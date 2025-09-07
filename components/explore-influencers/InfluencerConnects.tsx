import { useBrandContext } from '@/contexts/brand-context.provider'
import { View } from '@/shared-uis/components/theme/Themed'
import React from 'react'
import { PremiumActionTag } from '../discover/components/PremiumActionTag'

interface IProps {
    all?: boolean
}
const InfluencerConnects: React.FC<IProps> = ({ all }) => {
    const { selectedBrand } = useBrandContext()

    const planKey = selectedBrand?.billing?.planKey || "";
    const discoverCoinsLeft = Number((selectedBrand)?.credits?.discovery ?? 0)
    const connectionCreditsLeft = Number((selectedBrand)?.credits?.connection ?? 0)

    return (

        <View style={{ padding: 8, flexDirection: "row" }}>
            <PremiumActionTag
                label="Influencers remaining"
                tooltip="Use this coin to unlock infleuncers who are registered on Trendly"
                icon="star-four-points"
                variant="gold"
                count={selectedBrand?.credits?.influencer || 0}
                onPress={() => {
                    // Placeholder: You can navigate to a paywall or show coin balance here
                    // For now, we simply no-op.
                }}
            />
            {all && ["pro", "enterprise"].includes(planKey) && <>
                <PremiumActionTag
                    label="Discovery remaining"
                    tooltip="Open deep statistics for any influencer. Uses 1 coin each time you open a profile."
                    icon="diamond-stone"
                    variant="gold"
                    count={discoverCoinsLeft}
                    onPress={() => {
                        // Placeholder: You can navigate to a paywall or show coin balance here
                        // For now, we simply no-op.
                    }}
                />
                <PremiumActionTag
                    label="Connections remaining"
                    tooltip="We reach out to the influencer on your behalf and connect you directly."
                    icon="lightning-bolt"
                    variant="purple"
                    count={connectionCreditsLeft}
                    onPress={() => {
                        // Placeholder: Open your request flow here
                    }}
                />
            </>}
        </View>
    )
}

export default InfluencerConnects