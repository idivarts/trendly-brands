import { HttpWrapper } from '@/shared-libs/utils/http-wrapper'
import { View } from '@/shared-uis/components/theme/Themed'
import { Brand } from '@/types/Brand'
import React, { useEffect, useMemo, useState } from 'react'
import { Image, Linking, ScrollView } from 'react-native'
import { ActivityIndicator, Avatar, Card, Chip, Divider, List, Text } from 'react-native-paper'
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
    selectedBrand: Brand
}

const TrendlyAnalyticsEmbed: React.FC<IProps> = ({ influencer, selectedBrand }) => {
    const [loading, setLoading] = useState(false)
    const [social, setSocial] = useState<ISocials | null>(null)

    const loadInfluencer = async () => {
        try {
            setLoading(true)
            const body = await HttpWrapper.fetch(`/discovery/brands/${selectedBrand?.id || ''}/influencers/${influencer.userId}`, {
                method: 'GET',
                headers: {
                    'content-type': 'application/json',
                },
            }).then(async (res) => res.json())

            const s = body.social as ISocials | undefined
            if (s) setSocial(s)
        } catch (e) {
            // no-op; you can hook to your toast/snackbar here
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!selectedBrand?.id)
            return;

        loadInfluencer()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBrand])

    const formatNumber = (n?: number | null) => {
        if (n === null || n === undefined) return '—'
        try {
            return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
        } catch {
            return `${n}`
        }
    }

    const formatPercent = (p?: number | null) => {
        if (p === null || p === undefined) return '—'
        return `${(p * 100).toFixed(2)}%`
    }

    const formatDate = (epoch?: number | null) => {
        if (!epoch) return '—'
        try {
            return new Date(epoch * 1000).toLocaleString()
        } catch {
            return `${epoch}`
        }
    }

    const primaryLink = useMemo(() => {
        if (!social?.links?.length) return null
        // Prefer profile-like links first
        const profileLike = social.links.find(l => /instagram|tiktok|youtube|facebook|x\.com|twitter/i.test(l.url))
        return profileLike || social.links[0]
    }, [social])

    return (
        <Card.Content>

            <Card style={{ marginHorizontal: 12, marginBottom: 24 }}>
                <Card.Title title={'Basic Statistics'} />
                {/* Top-level metrics from the parent list item (always available) */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 16 }}>
                    <StatChip label="Followers" value={influencer?.followers} />
                    <StatChip label="Engagements" value={influencer?.engagements} />
                    <StatChip label="ER (in %)" value={(influencer?.engagementRate || 0) * 100} />
                    <StatChip label="Reel Plays" value={influencer?.views} />
                </View>
            </Card>

            {loading && <ActivityIndicator size={'small'} />}

            {!loading && !social && (
                <Text variant="bodyMedium" style={{ opacity: 0.7, paddingHorizontal: 16, marginBottom: 12 }}>
                    Detailed analytics are not available for this creator yet.
                </Text>
            )}

            {!loading && social && (
                <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
                    {/* Header */}
                    <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
                        <Card.Title
                            title={social.name || social.username}
                            subtitle={[social.username ? `@${social.username}` : '', social.category].filter(Boolean).join(' · ')}
                            left={(props) => (
                                social.profile_pic ? (
                                    <Avatar.Image {...props} size={44} source={{ uri: social.profile_pic }} />
                                ) : (
                                    <Avatar.Icon {...props} size={44} icon="account" />
                                )
                            )}
                            right={(props) => (
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 12 }}>
                                    {social.profile_verified && <Chip compact icon="check-decagram" style={{ marginRight: 6 }}>Verified</Chip>}
                                    {primaryLink && (
                                        <Chip compact icon="open-in-new" onPress={() => Linking.openURL(primaryLink.url)}>
                                            Open Profile
                                        </Chip>
                                    )}
                                </View>
                            )}
                        />

                        <Card.Content>
                            <Text variant="bodyMedium" style={{ marginBottom: 8 }} numberOfLines={2} >{social.bio != "unknown" ? social.bio : ""}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {!!social.location && <Chip style={{ marginRight: 8, marginBottom: 8 }} icon="map-marker">{social.location}</Chip>}
                                {!!social.gender && <Chip style={{ marginRight: 8, marginBottom: 8 }} icon="gender-male-female">{social.gender}</Chip>}
                                {typeof social.quality_score === 'number' && (
                                    <Chip style={{ marginRight: 8, marginBottom: 8 }} icon="star" >Quality: {social.quality_score}/100</Chip>
                                )}
                                {social.has_contacts && <Chip style={{ marginRight: 8, marginBottom: 8 }} icon="card-account-mail">Has Contacts</Chip>}
                                {social.has_follow_button && <Chip style={{ marginRight: 8, marginBottom: 8 }} icon="account-plus">Follow Enabled</Chip>}
                                {social.has_message_button && <Chip style={{ marginRight: 8, marginBottom: 8 }} icon="message-text">DM Enabled</Chip>}
                            </View>

                            {Array.isArray(social.niches) && social.niches.length > 0 && (
                                <View style={{ marginTop: 8 }}>
                                    <Text variant="labelLarge" style={{ marginBottom: 6 }}>Niches</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                        {social.niches.map((n) => (
                                            <Chip key={n} style={{ marginRight: 8, marginBottom: 8 }}>{n}</Chip>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </Card.Content>

                    </Card>

                    {/* Totals */}
                    <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
                        <Card.Title title="Totals" />
                        <Card.Content>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                <StatChip label="Followers" value={social.follower_count} />
                                <StatChip label="Following" value={social.following_count} />
                                <StatChip label="Posts" value={social.content_count} />
                                <StatChip label="Total Views" value={social.views_count} />
                                <StatChip label="Total Engagements" value={social.engagement_count} />
                                <StatChip label="Reels Scraped" value={social.reel_scrapped_count} />
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Averages & Rates */}
                    <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
                        <Card.Title title="Averages & Rates" />
                        <Card.Content>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                <StatChip label="Median Views" value={social.average_views} />
                                <StatChip label="Median Likes" value={social.average_likes} />
                                <StatChip label="Median Comments" value={social.average_comments} />
                                <StatChip label="Engagement Rate %" value={(social.engagement_rate || 0) * 100} />
                                <StatChip label="Quality Score" value={social.quality_score} />
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Reels */}
                    {Array.isArray(social.reels) && social.reels.length > 0 && (
                        <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
                            <Card.Title title={`Reels (${formatNumber(social.reels.length)})`} />
                            <Card.Content>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ flexDirection: 'row' }}>
                                        {social.reels.map((r) => (
                                            <Card key={r.id} style={{ width: 140, marginRight: 12 }} onPress={() => r.url && Linking.openURL(r.url)}>
                                                {!!r.thumbnail_url && (
                                                    <Image source={{ uri: r.thumbnail_url }} style={{ width: '100%', height: 180, borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
                                                )}
                                                <Card.Content>
                                                    <Text numberOfLines={2} variant="bodySmall" style={{ marginTop: 6 }}>{r.caption || 'Reel'}</Text>
                                                    <Divider style={{ marginVertical: 6 }} />
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                                        <Chip compact style={{ marginRight: 6, marginBottom: 6 }} icon="play-circle">{formatNumber(r.views_count)}</Chip>
                                                        <Chip compact style={{ marginRight: 6, marginBottom: 6 }} icon="heart">{formatNumber(r.likes_count)}</Chip>
                                                        <Chip compact style={{ marginRight: 6, marginBottom: 6 }} icon="comment-text">{formatNumber(r.comments_count)}</Chip>
                                                    </View>
                                                </Card.Content>
                                            </Card>
                                        ))}
                                    </View>
                                </ScrollView>
                            </Card.Content>
                        </Card>
                    )}

                    {/* Links */}
                    {Array.isArray(social.links) && social.links.length > 0 && (
                        <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
                            <Card.Title title="Links" />
                            <Card.Content>
                                <List.Section>
                                    {social.links.map((l, idx) => (
                                        <List.Item
                                            key={`${l.url}-${idx}`}
                                            title={l.text || l.url}
                                            description={l.url}
                                            onPress={() => Linking.openURL(l.url)}
                                            left={(props) => <List.Icon {...props} icon="link-variant" />}
                                            right={(props) => <List.Icon {...props} icon="open-in-new" />}
                                        />
                                    ))}
                                </List.Section>
                            </Card.Content>
                        </Card>
                    )}

                    {/* Meta */}
                    <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
                        <Card.Title title="Meta" />
                        <Card.Content>
                            <List.Section>
                                <List.Item title="ID" description={social.id} left={(p) => <List.Icon {...p} icon="identifier" />} />
                                {/* <List.Item title="Added By" description={social.added_by || '—'} left={(p) => <List.Icon {...p} icon="account-badge" />} /> */}
                                {/* <List.Item title="Created" description={formatDate(social.creation_time)} left={(p) => <List.Icon {...p} icon="calendar-plus" />} /> */}
                                <List.Item title="Last Updated" description={formatDate(social.last_update_time / 1000000)} left={(p) => <List.Icon {...p} icon="update" />} />
                                <List.Item title="Platform" description={social.social_type || '—'} left={(p) => <List.Icon {...p} icon="target" />} />
                            </List.Section>
                        </Card.Content>
                    </Card>
                </ScrollView>
            )}
        </Card.Content>
    )
}

export default TrendlyAnalyticsEmbed