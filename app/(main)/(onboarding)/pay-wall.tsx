import PayWallComponent from '@/components/paywall'
import AppLayout from '@/layouts/app-layout'
import React from 'react'

const PayWall = () => {
    return (
        <AppLayout withWebPadding={true}>
            <PayWallComponent />
        </AppLayout>
    )
}

export default PayWall