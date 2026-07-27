import { BRANDS_FE_URL } from '@/shared-constants/app'
import { useBrandContext } from '@/contexts/brand-context.provider'
import { useOrganizationContext } from '@/contexts/organization-context.provider'
import { useBreakpoints } from '@/hooks'
import { ModelStatus } from '@/shared-libs/firestore/trendly-pro/models/status'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import Colors from '@/shared-uis/constants/Colors'
import {
    getManagementURL,
    getOfferings,
    isIapConfigured,
    purchase,
    restorePurchases,
} from '@/utils/iap/purchases'
import { IapPackage, IapPlanKey } from '@/utils/iap/types'
import { useTheme } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

/** wa.me expects digits only (country code + number, no + or spaces). */
const WHATSAPP_NUMBER_DIGITS = '917604007156'

const PLAN_META: Record<IapPlanKey, { name: string; features: string[] }> = {
    pro: {
        name: 'Pro',
        features: ['1 brand workspace', '2 seats', 'Full scheduling · standard analytics', 'AI content & planning'],
    },
    team: {
        name: 'Team',
        features: ['Up to 3 brand workspaces', '5 seats', 'Approvals & campaigns', 'Full analytics + team reporting'],
    },
}

const PayWallComponent = () => {
    const theme = useTheme()
    const colors = useMemo(() => Colors(theme), [theme])
    const styles = useMemo(() => createStyles(colors), [colors])
    const { xl } = useBreakpoints()

    const { selectedBrand } = useBrandContext()
    const { selectedOrgBilling } = useOrganizationContext()

    const [loading, setLoading] = useState(true)
    const [subscriptions, setSubscriptions] = useState<IapPackage[]>([])
    const [topups, setTopups] = useState<IapPackage[]>([])
    const [busyProduct, setBusyProduct] = useState<string | null>(null)
    const [restoring, setRestoring] = useState(false)

    const configured = isIapConfigured()

    const currentPlanKey = selectedOrgBilling?.planKey as IapPlanKey | 'free' | undefined
    const provider = selectedOrgBilling?.provider
    const hasActivePaid =
        (currentPlanKey === 'pro' || currentPlanKey === 'team') &&
        (selectedOrgBilling?.accessState === 'active' || selectedOrgBilling?.status === ModelStatus.Accepted)
    // A plan bought via Razorpay (web) can only be changed on the web — never
    // offer a second (IAP) purchase for it, to avoid cross-rail double billing.
    const managedOnWeb = hasActivePaid && provider === 'razorpay'
    const managedInApp = provider === 'revenuecat'

    const loadOfferings = useCallback(async () => {
        if (!configured) {
            setLoading(false)
            return
        }
        setLoading(true)
        const o = await getOfferings()
        setSubscriptions(o.subscriptions)
        setTopups(o.topups)
        setLoading(false)
    }, [configured])

    useEffect(() => {
        loadOfferings()
    }, [loadOfferings])

    const handlePurchase = useCallback(async (pkg: IapPackage) => {
        setBusyProduct(pkg.productId)
        const res = await purchase(pkg)
        setBusyProduct(null)
        if (res.userCancelled) return
        if (res.success) {
            Toaster.success('Purchase successful — unlocking your plan. This can take a minute.')
        } else {
            Toaster.error(res.error ?? 'Purchase failed. Please try again.')
        }
    }, [])

    const handleRestore = useCallback(async () => {
        setRestoring(true)
        const res = await restorePurchases()
        setRestoring(false)
        if (res.success) Toaster.success('Purchases restored.')
        else if (res.error) Toaster.error(res.error)
    }, [])

    const handleManage = useCallback(async () => {
        const url = await getManagementURL()
        if (url) Linking.openURL(url)
    }, [])

    const handleContactAgency = useCallback(() => {
        Linking.openURL('mailto:support@idiv.in?subject=Trendly%20Agency%20plan')
    }, [])

    // ── Fallback: store products not configured yet → keep the desktop/WhatsApp
    // deflection so the screen is never a dead end before IAP is live. ──
    if (!configured) {
        const brandId = selectedBrand?.id ?? '—'
        const whatsAppMessage = `Hi, I'd like to unlock the full Trendly workspace with higher limits. My brand ID is: ${brandId}.`
        return (
            <View style={styles.fallbackWrap}>
                <Text style={styles.title}>The full Trendly lives on desktop</Text>
                <Text style={styles.body}>
                    Trendly on mobile is a lightweight companion. To unlock everything and manage your
                    plan, open Trendly in your desktop browser — or message our team and we’ll set you up.
                </Text>
                <Pressable
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                    onPress={() =>
                        Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER_DIGITS}?text=${encodeURIComponent(whatsAppMessage)}`)
                    }
                >
                    <Text style={styles.primaryBtnText}>Message us on WhatsApp</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={() => Linking.openURL(BRANDS_FE_URL)}>
                    <Text style={styles.secondaryBtnText}>Open Trendly on desktop</Text>
                </Pressable>
            </View>
        )
    }

    return (
        <ScrollView contentContainerStyle={styles.root}>
            <Text style={styles.title}>Choose your plan</Text>
            <Text style={styles.body}>Unlock higher limits and more AI tokens for your whole workspace.</Text>

            {managedOnWeb && (
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Your plan is managed on the web</Text>
                    <Text style={styles.infoBody}>
                        You subscribed on the Trendly website. To change or cancel this plan, open Trendly on desktop.
                    </Text>
                    <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={() => Linking.openURL(BRANDS_FE_URL)}>
                        <Text style={styles.secondaryBtnText}>Open Trendly on desktop</Text>
                    </Pressable>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
                <>
                    {/* Subscriptions */}
                    {!managedOnWeb && (
                        <View style={[styles.cardsWrap, xl && styles.cardsWrapRow]}>
                            {(['pro', 'team'] as IapPlanKey[]).map((planKey) => {
                                const pkg = subscriptions.find((s) => s.planKey === planKey)
                                const meta = PLAN_META[planKey]
                                const isCurrent = managedInApp && hasActivePaid && currentPlanKey === planKey
                                return (
                                    <View key={planKey} style={[styles.planCard, planKey === 'team' && styles.planPreferred]}>
                                        {planKey === 'team' && (
                                            <View style={styles.tag}>
                                                <Text style={styles.tagText}>Most popular</Text>
                                            </View>
                                        )}
                                        <Text style={styles.planName}>{meta.name}</Text>
                                        <Text style={styles.price}>{pkg ? pkg.priceString : 'Unavailable'}</Text>
                                        {pkg && <Text style={styles.priceNote}>per month · cancel anytime</Text>}
                                        <View style={styles.divider} />
                                        {meta.features.map((f, i) => (
                                            <View key={i} style={styles.featureRow}>
                                                <Text style={styles.tick}>✓</Text>
                                                <Text style={styles.featureText}>{f}</Text>
                                            </View>
                                        ))}
                                        <Pressable
                                            disabled={!pkg || isCurrent || busyProduct === pkg?.productId}
                                            onPress={() => pkg && handlePurchase(pkg)}
                                            style={({ pressed }) => [
                                                isCurrent ? styles.currentBtn : styles.primaryBtn,
                                                (!pkg || isCurrent) && styles.btnDisabled,
                                                pressed && !isCurrent && styles.pressed,
                                            ]}
                                        >
                                            {busyProduct === pkg?.productId ? (
                                                <ActivityIndicator color={colors.onPrimary} />
                                            ) : (
                                                <Text style={isCurrent ? styles.currentBtnText : styles.primaryBtnText}>
                                                    {isCurrent ? 'Current plan' : pkg ? `Get ${meta.name}` : 'Unavailable'}
                                                </Text>
                                            )}
                                        </Pressable>
                                    </View>
                                )
                            })}
                        </View>
                    )}

                    {/* Token top-ups */}
                    {topups.length > 0 && (
                        <View style={styles.topupSection}>
                            <Text style={styles.sectionTitle}>Need more AI tokens?</Text>
                            {topups.map((pkg) => (
                                <View key={pkg.productId} style={styles.topupCard}>
                                    <View style={styles.topupInfo}>
                                        <Text style={styles.topupName}>
                                            {pkg.tokens ? `${(pkg.tokens / 1_000_000).toLocaleString()}M tokens` : 'Token pack'}
                                        </Text>
                                        <Text style={styles.topupNote}>One-time top-up · added to your wallet</Text>
                                    </View>
                                    <Pressable
                                        disabled={busyProduct === pkg.productId}
                                        onPress={() => handlePurchase(pkg)}
                                        style={({ pressed }) => [styles.topupBtn, pressed && styles.pressed]}
                                    >
                                        {busyProduct === pkg.productId ? (
                                            <ActivityIndicator color={colors.onPrimary} />
                                        ) : (
                                            <Text style={styles.primaryBtnText}>{pkg.priceString}</Text>
                                        )}
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Agency */}
                    <Pressable style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]} onPress={handleContactAgency}>
                        <Text style={styles.linkText}>Need an Agency plan? Contact us →</Text>
                    </Pressable>

                    {/* Manage + restore */}
                    <View style={styles.footerRow}>
                        {managedInApp && hasActivePaid && (
                            <Pressable style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]} onPress={handleManage}>
                                <Text style={styles.linkText}>Manage subscription</Text>
                            </Pressable>
                        )}
                        <Pressable style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]} onPress={handleRestore} disabled={restoring}>
                            <Text style={styles.linkText}>{restoring ? 'Restoring…' : 'Restore purchases'}</Text>
                        </Pressable>
                    </View>
                </>
            )}
        </ScrollView>
    )
}

export default PayWallComponent

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        root: { padding: 20, gap: 4 },
        fallbackWrap: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
        title: { color: colors.text, fontWeight: '800', fontSize: 24, lineHeight: 32 },
        body: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 12 },
        loader: { marginTop: 40 },

        infoCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            gap: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        infoTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
        infoBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

        cardsWrap: { gap: 16, marginTop: 8 },
        cardsWrapRow: { flexDirection: 'row', flexWrap: 'wrap' },
        planCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 18,
            flex: 1,
            minWidth: 260,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        planPreferred: {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.18,
            elevation: 4,
        },
        tag: { alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
        tagText: { color: colors.onPrimary, fontSize: 11, fontWeight: '800' },
        planName: { color: colors.text, fontSize: 18, fontWeight: '800' },
        price: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 6 },
        priceNote: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
        divider: { height: 1, backgroundColor: colors.surface, marginVertical: 14 },
        featureRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
        tick: { color: colors.primary, fontSize: 16, marginRight: 10 },
        featureText: { color: colors.text, fontSize: 13, flex: 1 },

        primaryBtn: {
            marginTop: 16,
            backgroundColor: colors.primary,
            height: 46,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        primaryBtnText: { color: colors.onPrimary, fontWeight: '800' },
        secondaryBtn: {
            marginTop: 4,
            backgroundColor: colors.tag,
            height: 46,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
        },
        secondaryBtnText: { color: colors.tagForeground, fontWeight: '800' },
        currentBtn: {
            marginTop: 16,
            backgroundColor: colors.tag,
            height: 46,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
        },
        currentBtnText: { color: colors.tagForeground, fontWeight: '900' },
        btnDisabled: { opacity: 0.6 },
        pressed: { opacity: 0.9 },

        topupSection: { marginTop: 24, gap: 10 },
        sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
        topupCard: {
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        topupInfo: { flex: 1 },
        topupName: { color: colors.text, fontSize: 15, fontWeight: '800' },
        topupNote: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
        topupBtn: {
            backgroundColor: colors.primary,
            minWidth: 96,
            height: 42,
            borderRadius: 999,
            paddingHorizontal: 16,
            alignItems: 'center',
            justifyContent: 'center',
        },

        linkRow: { marginTop: 18, alignItems: 'center' },
        linkText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
        footerRow: { marginTop: 8, gap: 4 },
    })
}
