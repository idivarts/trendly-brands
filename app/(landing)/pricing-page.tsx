import GrowthBookProtected from '@/components/landing/GrowthBookProtected'
import PricingPage from '@/components/landing/pages/pricing-page'
import { useMyGrowthBook } from '@/contexts/growthbook-context-provider'
import { useMyNavigation } from '@/shared-libs/utils/router'
import React, { useEffect } from 'react'

const Pricing = () => {
    const router = useMyNavigation()
    const { loading, features: { payWall } } = useMyGrowthBook()
    useEffect(() => {
        if (!loading)
            return
        if (!payWall) {
            router.resetAndNavigate("/explore-influencers")
            return;
        }
    }, [loading, payWall])

    return (
        <GrowthBookProtected>
            <PricingPage />
        </GrowthBookProtected>
    )
}

export default Pricing