import { useOrganizationContext } from '@/contexts/organization-context.provider'
import { useConfirmationModel } from '@/shared-uis/components/ConfirmationModal'
import React, { useEffect, useRef } from 'react'
import { Linking } from 'react-native'

/** wa.me expects digits only (country code + number, no + or spaces). Mirrors
 * components/paywall/index.native.tsx's WHATSAPP_NUMBER_DIGITS. */
const WHATSAPP_NUMBER_DIGITS = '917604007156'

// Watches the selected org's IapRestoreConflict — written asynchronously by
// the RevenueCat webhook when a restore/purchase reuses a store receipt
// that's already owned by a DIFFERENT org (subscriptions are not
// transferable, see trendlymodels.RecordRestoreConflict) — and surfaces it as
// a one-time popup naming the org that already owns it, with a pre-formed
// WhatsApp support message. Mounted once near the app root (alongside
// AccountLockedBanner) rather than only on the paywall screen, because the
// webhook lands asynchronously — by the time it arrives the user may already
// have navigated away from wherever they tapped Restore Purchases.
const RestoreConflictModal: React.FC = () => {
    const { selectedOrganization, dismissRestoreConflict } = useOrganizationContext()
    const { openModal } = useConfirmationModel()
    const shownForOrgId = useRef<string | null>(null)

    const conflict = selectedOrganization?.iapRestoreConflict
    const orgId = selectedOrganization?.id

    useEffect(() => {
        if (!conflict || !orgId) return
        // Show once per org per app session — the ref guards against
        // re-opening on every re-render while it's visible.
        if (shownForOrgId.current === orgId) return
        shownForOrgId.current = orgId

        const message =
            `Hi, I tried to restore/activate a subscription on organization "${selectedOrganization?.name}" ` +
            `(ID: ${orgId}), but it says it's already in use by organization "${conflict.conflictingOrgName}" ` +
            `(ID: ${conflict.conflictingOrgId}, owner: ${conflict.conflictingOwnerEmail}). Can you help?`

        openModal({
            title: 'Subscription already in use',
            description:
                `This subscription is already active on organization "${conflict.conflictingOrgName}" ` +
                `(ID: ${conflict.conflictingOrgId}), owned by ${conflict.conflictingOwnerEmail}. ` +
                `Subscriptions can't be moved between organizations — if you think this is a mistake, contact support.`,
            confirmText: 'Contact support on WhatsApp',
            confirmAction: () => {
                Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER_DIGITS}?text=${encodeURIComponent(message)}`)
            },
            cancelText: 'Dismiss',
        })
        // Clear it server-side as soon as it's queued to show, so it doesn't
        // resurface on next load regardless of which button the user presses
        // (there's no programmatic way to hook the modal's own close event).
        dismissRestoreConflict(orgId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conflict, orgId])

    return null
}

export default RestoreConflictModal
