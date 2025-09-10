import { useBrandContext } from '@/contexts/brand-context.provider'
import { HttpWrapper } from '@/shared-libs/utils/http-wrapper'
import { View } from '@/shared-uis/components/theme/Themed'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Card } from 'react-native-paper'
import { InfluencerItem, StatChip } from '../DiscoverInfluencer'


export interface ILink {
    url: string;
    text: string;
}

export interface IReel {
    id: string;
    thumbnail_url: string;
    url: string;
    caption: string;
    pinned: boolean;
    views_count: number | null;
    likes_count: number | null;
    comments_count: number | null;
}

export interface ISocials {
    id: string;
    social_type: string;

    gender: string;
    niches: string[];
    location: string;

    follower_count: number;
    following_count: number;
    content_count: number; // posts
    views_count: number; // views
    engagement_count: number; // engagement

    reel_scrapped_count: number; // scrapped reels

    average_views: number;
    average_likes: number;
    average_comments: number;
    quality_score: number;
    engagement_rate: number;

    username: string;
    name: string;
    bio: string;
    category: string;
    profile_pic: string;

    profile_verified: boolean;
    has_contacts: boolean;

    reels: IReel[];
    links: ILink[];

    has_follow_button: boolean;
    has_message_button: boolean;

    added_by: string;

    creation_time: number;
    last_update_time: number;
}

interface IProps {
    influencer: InfluencerItem
}
const TrendlyAnalyticsEmbed: React.FC<IProps> = ({ influencer }) => {
    const { selectedBrand } = useBrandContext()
    const [loading, setLoading] = useState(false)
    const [social, setSocial] = useState<ISocials | null>(null)

    const loadInfluencer = async () => {
        try {
            setLoading(true)
            let body = await HttpWrapper.fetch(`/discovery/brands/${selectedBrand?.id || ""}/influencers/${influencer.userId}`, {
                method: "GET",
                headers: {
                    "content-type": "application/json"
                },
            }).then(async res => {
                return res.json()
            })

            let social = body.social as ISocials
            setSocial(social)
        } catch (e) {
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        loadInfluencer()
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
                {loading && <ActivityIndicator size={"small"} />}

            </Card.Content>

        </>
    )
}

export default TrendlyAnalyticsEmbed