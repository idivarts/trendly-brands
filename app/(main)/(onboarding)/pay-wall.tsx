import PricingPage from '@/components/landing/pages/pricing-page'
import PayWallComponent from '@/components/paywall'
import AppLayout from '@/layouts/app-layout'
import React from 'react'
import { Platform } from 'react-native'

const PayWall = () => {
    if (Platform.OS == "web")
        return <PricingPage />
    return (
        <AppLayout withWebPadding={true}>
            <PayWallComponent />
        </AppLayout>
    )
}

export default PayWall