import PricingPage from '@/components/landing/pages/pricing-page'
import PayWallComponent from '@/components/paywall'
import { DEFAULT_MEMBER_LANDING_PAGE } from '@/constants/App'
import { useOrganizationContext } from '@/contexts/organization-context.provider'
import { useMyNavigation } from '@/shared-libs/utils/router'
import AppLayout from '@/layouts/app-layout'
import React, { useEffect } from 'react'
import { Platform } from 'react-native'

const PayWall = () => {
    const { billingGateStatus } = useOrganizationContext()
    const router = useMyNavigation()

    // /pay-wall is reached via resetAndNavigate, which clears the back stack —
    // nothing else routes the user out once they're unblocked (free plan,
    // restored purchase, or a recovered subscription), so this screen must
    // leave on its own once the gate that sent it here is no longer "gated".
    useEffect(() => {
        if (billingGateStatus === "clear") {
            router.resetAndNavigate(DEFAULT_MEMBER_LANDING_PAGE)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [billingGateStatus])

    if (Platform.OS == "web")
        return <PricingPage />
    return (
        <AppLayout withWebPadding={true} safeAreaEdges={["top", "right", "bottom", "left"]}>
            <PayWallComponent />
        </AppLayout>
    )
}

export default PayWall