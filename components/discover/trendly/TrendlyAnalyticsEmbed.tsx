import { View } from '@/shared-uis/components/theme/Themed'
import React from 'react'
import { Card } from 'react-native-paper'
import { InfluencerItem, StatChip } from '../DiscoverInfluencer'

interface IProps {
    influencer: InfluencerItem
}
const TrendlyAnalyticsEmbed: React.FC<IProps> = ({ influencer }) => {
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