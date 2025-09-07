import { useBrandContext } from '@/contexts/brand-context.provider'
import { IS_MONETIZATION_DONE } from '@/shared-constants/app'
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
    const influencerCredits = selectedBrand?.credits?.influencer || (IS_MONETIZATION_DONE ? 0 : 1000)

    return (

        <View style={{ padding: 8, flexDirection: "row" }}>
            <PremiumActionTag
                label="Influencers remaining"
                tooltip={"This means how many influencers you can unlock from the explore influencers page. Please upgrade if you have exhausted the limit here.\n\nLimit recharges every month depending on what plan you are on"}
                icon="star-four-points"
                variant="gold"
                count={influencerCredits}
            />
            {all && ["pro", "enterprise"].includes(planKey) && <>
                <PremiumActionTag
                    label="Discovery remaining"
                    tooltip={"Open deep statistics for any influencer on the discover page. Uses 1 coin each time you open a unique profile on the discover page.\n\nLimit recharges every month depending on what plan you are on"}
                    icon="diamond-stone"
                    variant="gold"
                    count={discoverCoinsLeft}
                />
                <PremiumActionTag
                    label="Connections remaining"
                    tooltip={"We reach out to the influencer on your behalf and connect you directly. Uses 1 coin whenever you request connection for any influencer.\n\nLimit recharges every month depending on what plan you are on"}
                    icon="lightning-bolt"
                    variant="purple"
                    count={connectionCreditsLeft}
                />
            </>}
        </View>
    )
}

export default InfluencerConnects