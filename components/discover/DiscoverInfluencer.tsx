import { useBrandContext } from '@/contexts/brand-context.provider'
import { FacebookImageComponent } from '@/shared-uis/components/image-component'
import { View } from '@/shared-uis/components/theme/Themed'
import Colors from '@/shared-uis/constants/Colors'
import { maskHandle } from '@/shared-uis/utils/masks'
import { useTheme } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Linking, ListRenderItemInfo, StyleSheet } from 'react-native'
import { ActivityIndicator, Card, Chip, Divider, IconButton, Menu, Text } from 'react-native-paper'
import { Subject } from 'rxjs'
import ScreenHeader from '../ui/screen-header'
import DiscoverPlaceholder from './DiscoverAdPlaceholder'
import { InfluencerStatsModal } from './InfluencerStatModal'
import { DB_TYPE } from './RightPanelDiscover'
import { PremiumActionTag } from './components/PremiumActionTag'

// Types
export interface InfluencerItem {
    userId: string
    fullname: string
    username: string
    url: string
    picture: string
    followers: number
    views?: number
    engagements: number
    engagementRate: number
}


// Helpers
const formatNumber = (n: number | undefined) => {
    if (n == null) return '-'
    if (n < 100) return String(n.toFixed(2))
    if (n < 1000) return String(n)
    if (n < 1_000_000) return `${Math.round(n / 100) / 10}k`
    if (n < 1_000_000_000) return `${Math.round(n / 100_000) / 10}M`
    return `${Math.round(n / 100_000_000) / 10}B`
}

const useStyles = (colors: ReturnType<typeof Colors>) => StyleSheet.create({
    list: { flex: 1 },
    card: {
        marginHorizontal: 10,
        marginVertical: 6,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: colors.card,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    avatarCol: { padding: 6, justifyContent: 'center', alignItems: 'center' },
    body: { flex: 1, padding: 8, paddingRight: 6 },
    title: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18, marginBottom: 0 },
    subtitle: { fontSize: 12, opacity: 0.7, marginBottom: 6 },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    statChip: { marginRight: 4, marginBottom: 4, height: 26, borderRadius: 14, paddingHorizontal: 6 },
    rightCol: {
        width: 72,
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    avatar: { width: 56, height: 56, borderRadius: 10 },
    content: { paddingHorizontal: 8, paddingVertical: 8 },
    fullScreenLoader: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
})

export const StatChip = ({ label, value }: { label: string; value?: number }) => (
    <Chip mode="outlined" compact style={{ marginRight: 6, marginBottom: 6 }}>
        <Text style={{ fontWeight: '600' }}>{value != null ? formatNumber(value) : '-'}</Text>
        <Text> {label}</Text>
    </Chip>
)


interface IProps {
    selectedDb: DB_TYPE,
}

export const DiscoverCommuninicationChannel = new Subject<{
    loading?: boolean
    data: InfluencerItem[]
}>()

const DiscoverInfluencer: React.FC<IProps> = ({ selectedDb }) => {
    const theme = useTheme()
    const colors = Colors(theme)
    const styles = useMemo(() => useStyles(colors), [colors])

    const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null)
    const [statsItem, setStatsItem] = useState<InfluencerItem | null>(null)

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<InfluencerItem[]>([])

    const { selectedBrand } = useBrandContext()

    useEffect(() => {
        DiscoverCommuninicationChannel.subscribe(({ loading, data }) => {
            setLoading(loading || false)
            setData(data)
        })
    }, [])

    // const data = MOCK_INFLUENCERS

    const onOpenProfile = useCallback((url: string) => {
        Linking.openURL(url)
    }, [])

    const renderItem = useCallback(({ item }: ListRenderItemInfo<InfluencerItem>) => {
        return (
            <Card style={styles.card} onPress={() => setStatsItem(item)}>
                <Card.Content style={styles.content}>
                    <View style={styles.row}>
                        <View style={styles.avatarCol}>
                            <FacebookImageComponent url={item.picture} altText={item.fullname} style={styles.avatar} />
                            {/* <Image source={{ uri: item.picture }} style={styles.avatar} /> */}
                        </View>
                        <View style={styles.body}>
                            <Text style={styles.title} numberOfLines={1}>{item.fullname}</Text>
                            <Text style={styles.subtitle} numberOfLines={1}>@{maskHandle(item.username)}</Text>

                            <View style={styles.statsRow}>
                                <StatChip label="Followers" value={item.followers} />
                                <StatChip label="Engagements" value={item.engagements} />
                                <StatChip label="ER (in %)" value={((item?.engagementRate || 0) * 100)} />
                                <StatChip label="Reel Plays" value={item.views} />
                            </View>
                        </View>

                        <View style={styles.rightCol}>
                            <Menu
                                style={{ backgroundColor: Colors(theme).background }}
                                visible={menuVisibleId === item.userId}
                                onDismiss={() => setMenuVisibleId(null)}
                                anchor={
                                    <IconButton
                                        icon="dots-vertical"
                                        onPress={() => setMenuVisibleId(item.userId)}
                                        accessibilityLabel="More options"
                                    />
                                }
                            >
                                <Menu.Item onPress={() => onOpenProfile(item.url)} title="View Profile" />
                                <Divider />
                                <Menu.Item onPress={() => setStatsItem(item)} title="View Stats" />
                            </Menu>
                        </View>
                    </View>
                </Card.Content>
            </Card>
        )
    }, [menuVisibleId, onOpenProfile, styles])

    const keyExtractor = useCallback((i: InfluencerItem) => i.userId, [])

    const getItemLayout = useCallback(
        (_: InfluencerItem[] | null | undefined, index: number) => ({ length: 96, offset: 96 * index, index }),
        []
    )

    const discoverCoinsLeft = Number((selectedBrand)?.credits?.discovery ?? 0)
    const connectionCreditsLeft = Number((selectedBrand)?.credits?.connection ?? 0)

    if (loading && data.length === 0) {
        // Full screen loader when we're fetching the first page
        return (
            <View style={styles.fullScreenLoader}>
                <ActivityIndicator />
                <Text style={{ marginTop: 8, opacity: 0.7 }}>Loading influencers…</Text>
            </View>
        )
    }

    if (data.length == 0) {
        return <DiscoverPlaceholder selectedDb={selectedDb} />
    }

    return (
        <>
            <ScreenHeader title={
                selectedDb == "trendly" ? "Trendly Internal Discovery" :
                    (selectedDb == "phyllo" ? "Phyllo Discovery" : "Modash Discovery")
            } hideAction={true}
                rightAction={true}
                rightActionButton={
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 8 }}>
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
                    </View>
                } />
            <View style={{ flex: 1 }}>
                <FlatList
                    data={data}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    style={styles.list}
                    initialNumToRender={8}
                    maxToRenderPerBatch={8}
                    windowSize={7}
                    removeClippedSubviews
                    // @ts-ignore
                    getItemLayout={getItemLayout}
                    ListFooterComponent={
                        loading && data.length > 0
                            ? (
                                <View style={styles.footerLoader}>
                                    <ActivityIndicator />
                                </View>
                            )
                            : null
                    }
                />

                <InfluencerStatsModal visible={!!statsItem} item={statsItem} onClose={() => setStatsItem(null)} />
            </View>
        </>
    )
}

export default DiscoverInfluencer