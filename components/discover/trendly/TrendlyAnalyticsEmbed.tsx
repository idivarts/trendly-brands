import { useBrandContext } from '@/contexts/brand-context.provider'
import { HttpWrapper } from '@/shared-libs/utils/http-wrapper'
import { View } from '@/shared-uis/components/theme/Themed'
import React, { useEffect } from 'react'
import { Card } from 'react-native-paper'
import { InfluencerItem, StatChip } from '../DiscoverInfluencer'

interface IProps {
    influencer: InfluencerItem
}
const TrendlyAnalyticsEmbed: React.FC<IProps> = ({ influencer }) => {
    const { selectedBrand } = useBrandContext()

    const loadInfluencer = async () => {
        try {
            let body = await HttpWrapper.fetch(`/discovery/brands/${selectedBrand?.id || ""}/influencers/${influencer.userId}`, {
                method: "GET",
                headers: {
                    "content-type": "application/json"
                },
            }).then(async res => {
                return res.json()
            })
        } catch (e) {
        } finally {

        }
    }
    useEffect(() => {

    }, [])
    return (
        <>
            <Card.Content>
                <Card.Title title={"Statistics"} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 16 }}>
                    <StatChip label="Followers" value={influencer?.followers} />
                    <StatChip label="Engagements" value={influencer?.engagements} />
                    <StatChip label="ER (in %)" value={((influencer?.engagementRate || 0) * 100)} />
                    <StatChip label="Reel Plays" value={influencer?.views} />
                </View>
            </Card.Content>

        </>
    )
}

export default TrendlyAnalyticsEmbed