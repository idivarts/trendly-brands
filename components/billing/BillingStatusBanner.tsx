import { useBrandContext } from '@/contexts/brand-context.provider'
import { useOrganizationContext } from '@/contexts/organization-context.provider'
import { useEntitlements } from '@/hooks/use-entitlements'
import { ModelStatus } from '@/shared-libs/firestore/trendly-pro/models/status'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import Colors from '@/shared-uis/constants/Colors'
import { isIapSupported, restorePurchases } from '@/utils/iap/purchases'
import { faArrowRotateRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { useTheme } from '@react-navigation/native'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

type Reason = 'syncing' | 'past_due' | 'inactive'

const COPY: Record<Reason, { title: string; body: string }> = {
    syncing: {
        title: 'Confirming your last purchase',
        body: "This can take a minute. If it's been longer, restoring purchases usually fixes it.",
    },
    past_due: {
        title: 'Payment issue',
        body: 'Your last charge failed. Restoring purchases can re-sync your subscription.',
    },
    inactive: {
        title: "Subscription isn't active",
        body: 'Restore purchases if this looks wrong, or continue on the Free plan below.',
    },
}

// Surfaces the org's billing "health" at the top of the paywall/billing screen
// with an actionable next step, instead of a dead-end lock:
//  - "syncing"  — non-free plan but accessState/status never landed at all,
//    most likely a purchase whose RevenueCat webhook never reached the
//    backend. Restore Purchases re-validates the receipt with the store and
//    is often enough to un-stick it.
//  - "past_due" / "inactive" (canceled, locked, or any other non-active value)
//    — a real payment problem; same Restore Purchases recovery for IAP.
//  - Always available: "Continue on Free plan" — the guaranteed fallback when
//    nothing else resolves it, so the user is never fully locked out.
const BillingStatusBanner: React.FC = () => {
    const theme = useTheme()
    const colors = Colors(theme)
    const styles = useStyles(colors)
    const { billing } = useEntitlements()
    const { selectedBrand } = useBrandContext()
    const { downgradeToFree } = useOrganizationContext()

    const [restoring, setRestoring] = useState(false)
    const [downgrading, setDowngrading] = useState(false)

    const reason = useMemo<Reason | null>(() => {
        const planKey = billing?.planKey
        const isPaidPlanKey = planKey === 'pro' || planKey === 'team'
        if (!isPaidPlanKey) return null
        const hasActivePaid = billing?.accessState === 'active' || billing?.status === ModelStatus.Accepted
        if (hasActivePaid) return null
        if (!billing?.accessState && billing?.status == null) return 'syncing'
        if (billing?.accessState === 'past_due') return 'past_due'
        return 'inactive'
    }, [billing])

    if (!reason) return null

    const handleRestore = async () => {
        setRestoring(true)
        const res = await restorePurchases()
        setRestoring(false)
        if (res.success) Toaster.success('Purchases restored — this can take a minute to reflect.')
        else if (res.error) Toaster.error(res.error)
    }

    const handleDowngrade = async () => {
        const orgId = selectedBrand?.organizationId
        if (!orgId) return
        setDowngrading(true)
        await downgradeToFree(orgId)
        setDowngrading(false)
    }

    return (
        <View style={styles.wrap}>
            <View style={styles.header}>
                <FontAwesomeIcon icon={faTriangleExclamation} size={13} color={colors.white} />
                <View style={styles.textWrap}>
                    <Text style={styles.title}>{COPY[reason].title}</Text>
                    <Text style={styles.body}>{COPY[reason].body}</Text>
                </View>
            </View>
            <View style={styles.actions}>
                {isIapSupported && (
                    <Pressable
                        disabled={restoring}
                        onPress={handleRestore}
                        style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Restore purchases"
                    >
                        {restoring ? (
                            <ActivityIndicator size="small" color={colors.orange} />
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faArrowRotateRight} size={12} color={colors.orange} />
                                <Text style={styles.primaryActionText}>Restore Purchases</Text>
                            </>
                        )}
                    </Pressable>
                )}
                <Pressable
                    disabled={downgrading}
                    onPress={handleDowngrade}
                    style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Continue on Free plan"
                >
                    <Text style={styles.secondaryActionText}>
                        {downgrading ? 'Switching…' : 'Continue on Free plan'}
                    </Text>
                </Pressable>
            </View>
        </View>
    )
}

export default BillingStatusBanner

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    backgroundColor: colors.orange,
                    borderRadius: 14,
                    padding: 14,
                    gap: 12,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.1,
                    elevation: 3,
                },
                header: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
                textWrap: { flex: 1, gap: 2 },
                title: { color: colors.white, fontWeight: '800', fontSize: 14 },
                body: { color: colors.white, fontSize: 12.5, lineHeight: 18, opacity: 0.92 },
                actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
                primaryAction: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: colors.white,
                    height: 38,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                },
                primaryActionText: { color: colors.orange, fontWeight: '800', fontSize: 12.5 },
                secondaryAction: {
                    height: 38,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                secondaryActionText: {
                    color: colors.white,
                    fontWeight: '700',
                    fontSize: 12.5,
                    textDecorationLine: 'underline',
                },
                pressed: { opacity: 0.85 },
            }),
        [colors]
    )
}
