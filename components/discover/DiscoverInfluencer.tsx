import { View } from '@/shared-uis/components/theme/Themed'
import Colors from '@/shared-uis/constants/Colors'
import { useTheme } from '@react-navigation/native'
import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, Image, Linking, ListRenderItemInfo, StyleSheet } from 'react-native'
import { Card, Chip, Divider, IconButton, Menu, Modal, Portal, Text, useTheme as usePaperTheme } from 'react-native-paper'
import { MOCK_INFLUENCERS } from './mock/influencers'

// Types
export interface InfluencerItem {
    userId: string
    fullname: string
    username: string
    url: string
    picture: string
    followers: number
    engagements: number
    engagementRate: number
    reelPlays?: number
}


// Helpers
const formatNumber = (n: number | undefined) => {
    if (n == null) return '-'
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
    modalCard: { margin: 16, borderRadius: 16, overflow: 'hidden' },
    content: { paddingHorizontal: 8, paddingVertical: 8 },
})

const StatChip = ({ label, value }: { label: string; value?: number }) => (
    <Chip mode="outlined" compact style={{ marginRight: 6, marginBottom: 6 }}>
        <Text style={{ fontWeight: '600' }}>{value != null ? formatNumber(value) : '-'}</Text>
        <Text> {label}</Text>
    </Chip>
)

const DiscoverInfluencer: React.FC = () => {
    const theme = useTheme()
    const paper = usePaperTheme()
    const colors = Colors(theme)
    const styles = useMemo(() => useStyles(colors), [colors])

    const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null)
    const [statsItem, setStatsItem] = useState<InfluencerItem | null>(null)

    const data = MOCK_INFLUENCERS

    const onOpenProfile = useCallback((url: string) => {
        Linking.openURL(url)
    }, [])

    const renderItem = useCallback(({ item }: ListRenderItemInfo<InfluencerItem>) => {
        return (
            <Card style={styles.card} onPress={() => setStatsItem(item)}>
                <Card.Content style={styles.content}>
                    <View style={styles.row}>
                        <View style={styles.avatarCol}>
                            <Image source={{ uri: item.picture }} style={styles.avatar} />
                        </View>
                        <View style={styles.body}>
                            <Text style={styles.title} numberOfLines={1}>{item.fullname}</Text>
                            <Text style={styles.subtitle} numberOfLines={1}>@{item.username}</Text>

                            <View style={styles.statsRow}>
                                <StatChip label="Followers" value={item.followers} />
                                <StatChip label="Engagements" value={item.engagements} />
                                <Chip mode="outlined" compact style={styles.statChip}>
                                    <Text style={{ fontWeight: '600' }}>{(item.engagementRate * 100).toFixed(2)}%</Text>
                                    <Text> ER</Text>
                                </Chip>
                                <StatChip label="Reel Plays" value={item.reelPlays} />
                            </View>
                        </View>

                        <View style={styles.rightCol}>
                            <Menu
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

    return (
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
            />

            {/* Stats Modal */}
            <Portal>
                <Modal visible={!!statsItem} onDismiss={() => setStatsItem(null)}>
                    <Card style={styles.modalCard}>
                        <Card.Title title={statsItem?.fullname} subtitle={`@${statsItem?.username}`} />
                        <Card.Content>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                {!!statsItem?.picture && (
                                    <Image source={{ uri: statsItem.picture }} style={{ width: 64, height: 64, borderRadius: 8, marginRight: 12 }} />
                                )}
                                <Text onPress={() => statsItem?.url && Linking.openURL(statsItem.url)} style={{ color: paper.colors.primary }}>
                                    {statsItem?.url}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                <StatChip label="Followers" value={statsItem?.followers} />
                                <StatChip label="Engagements" value={statsItem?.engagements} />
                                <Chip mode="outlined" compact style={{ marginRight: 6, marginBottom: 6 }}>
                                    <Text style={{ fontWeight: '600' }}>{statsItem ? (statsItem.engagementRate * 100).toFixed(2) : '-'}%</Text>
                                    <Text> ER</Text>
                                </Chip>
                                <StatChip label="Reel Plays" value={statsItem?.reelPlays} />
                            </View>
                        </Card.Content>
                        <Card.Actions>
                            <IconButton icon="open-in-new" onPress={() => statsItem?.url && Linking.openURL(statsItem.url)} />
                            <IconButton icon="close" onPress={() => setStatsItem(null)} />
                        </Card.Actions>
                    </Card>
                </Modal>
            </Portal>
        </View>
    )
}

export default DiscoverInfluencer