import { useDiscovery } from '@/app/(main)/(drawer)/(tabs)/discover'
import { useBrandContext } from '@/contexts/brand-context.provider'
import { useBreakpoints } from '@/hooks'
import { useConfirmationModel } from '@/shared-uis/components/ConfirmationModal'
import { FacebookImageComponent } from '@/shared-uis/components/image-component'
import { View } from '@/shared-uis/components/theme/Themed'
import Colors from '@/shared-uis/constants/Colors'
import { maskHandle } from '@/shared-uis/utils/masks'
import { useTheme } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Linking, ListRenderItemInfo, ScrollView, StyleSheet } from 'react-native'
import { ActivityIndicator, Card, Chip, Divider, IconButton, Menu, Text } from 'react-native-paper'
import { Subject } from 'rxjs'
import DiscoverPlaceholder from './DiscoverAdPlaceholder'
import { InfluencerStatsModal } from './InfluencerStatModal'

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
    avatar: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.primary },
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
}

export const DiscoverCommuninicationChannel = new Subject<{
    loading?: boolean;
    data: InfluencerItem[];
    total?: number;
    page?: number;
    pageSize?: number;
    pageCount?: number;
    sort?: string;
    sortOptions?: { label: string; value: string }[];
}>()

export const DiscoverUIActions = new Subject<{
    action: 'changePage' | 'changeSort';
    page?: number;
    sort?: string;
}>()

const DiscoverInfluencer: React.FC<IProps> = () => {
    const { selectedDb, setRightPanel, rightPanel, setSelectedDb } = useDiscovery()
    const theme = useTheme()
    const colors = Colors(theme)
    const styles = useMemo(() => useStyles(colors), [colors])

    const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null)
    const [statsItem, setStatsItemNative] = useState<InfluencerItem | null>(null)
    const setStatsItem = (data: InfluencerItem | null) => {
        if ((selectedBrand?.credits?.discovery || 0) <= 0 && data
            && !selectedBrand?.discoveredInfluencers?.includes(data.userId)) {
            openModal({
                title: "No Discovery Credit",
                description: "You seem to have exhausted the discovery credit. Contact support for recharging the credits",
                confirmText: "Contact Support",
                confirmAction: () => {
                    Linking.openURL("mailto:support@idiv.in")
                }
            })
            return
        }

        setStatsItemNative(data)
    }

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<InfluencerItem[]>([])

    const { selectedBrand } = useBrandContext()
    const { openModal } = useConfirmationModel()

    const { xl } = useBreakpoints()

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageCount, setPageCount] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(20);
    const [totalResults, setTotalResults] = useState<number>(0);

    const [sortMenuVisible, setSortMenuVisible] = useState(false);
    const [sortOptions, setSortOptions] = useState<{ label: string; value: string }[]>([
        { label: 'Relevance', value: 'relevance' },
        { label: 'Followers (High → Low)', value: 'followers_desc' },
        { label: 'Engagements (High → Low)', value: 'engagement_desc' },
        { label: 'ER % (High → Low)', value: 'er_desc' },
        { label: 'Views (High → Low)', value: 'views_desc' },
    ]);
    const [currentSort, setCurrentSort] = useState<string>('relevance');

    useEffect(() => {
        const subs = DiscoverCommuninicationChannel.subscribe(({ loading, data, ...meta }: any) => {
            setLoading(loading || false);
            setData(data || []);
            // Meta: total, page, pageSize, pageCount, sort, sortOptions
            if (typeof meta?.total === 'number') setTotalResults(meta.total);
            else setTotalResults((data || []).length);

            if (typeof meta?.pageSize === 'number') setPageSize(meta.pageSize);
            if (typeof meta?.pageCount === 'number') setPageCount(meta.pageCount);
            if (typeof meta?.page === 'number') setCurrentPage(meta.page);
            else if (meta?.page == null && meta?.pageCount == null) {
                // derive simple pagination if not provided
                const derivedCount = Math.max(1, Math.ceil(((data || []).length || 0) / (pageSize || 20)));
                setPageCount(derivedCount);
                setCurrentPage(1);
            }

            if (typeof meta?.sort === 'string') setCurrentSort(meta.sort);
            if (Array.isArray(meta?.sortOptions) && meta.sortOptions.length) setSortOptions(meta.sortOptions);

            setRightPanel(false);
        });
        return () => {
            subs.unsubscribe();
        };
    }, [pageSize, setRightPanel]);

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
                                <StatChip label="ER (in %)" value={((item?.engagementRate || 0))} />
                                <StatChip label="Views" value={item.views} />
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

    const pageNumbers = useMemo(() => {
        // Windowed pagination: show up to 7 pages around current
        const maxToShow = 7;
        const pages: number[] = [];
        if (pageCount <= maxToShow) {
            for (let i = 1; i <= pageCount; i++) pages.push(i);
            return pages;
        }
        const half = Math.floor(maxToShow / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(pageCount, start + maxToShow - 1);
        // adjust start if we hit the end
        start = Math.max(1, Math.min(start, Math.max(1, end - maxToShow + 1)));
        end = Math.min(pageCount, start + maxToShow - 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    }, [currentPage, pageCount]);

    const onSelectPage = useCallback((p: number) => {
        if (p < 1 || p > pageCount || p === currentPage) return;
        setCurrentPage(p);
        DiscoverUIActions.next({ action: 'changePage', page: p });
    }, [currentPage, pageCount]);

    const onSelectSort = useCallback((val: string) => {
        setCurrentSort(val);
        setSortMenuVisible(false);
        DiscoverUIActions.next({ action: 'changeSort', sort: val });
    }, []);

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
        if (xl)
            return <View style={{ flex: 1, minWidth: 0 }}>
                <DiscoverPlaceholder selectedDb={selectedDb} setSelectedDb={setSelectedDb} />
            </View>
        else
            return null
    }

    return (
        <View style={[{ flex: 1, minWidth: 0 }, (!xl && rightPanel) && {
            display: "none"
        }]}>
            <View style={{ flex: 1 }}>

                <FlatList
                    data={data}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    style={styles.list}
                    // initialNumToRender={8}
                    // maxToRenderPerBatch={8}
                    // windowSize={7}
                    // removeClippedSubviews
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
                <Divider />
                {/* Header Bar: totals • pagination • sort */}
                <View style={[styles.row, { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }]}>
                    {/* Left: Total results */}
                    <View style={[styles.row, { gap: 6 }]}>
                        <Text style={{ fontWeight: '600' }}>Total</Text>
                        <Text style={{ fontSize: 12, opacity: 0.8 }}>{totalResults} Results found</Text>
                    </View>

                    {/* Middle: Pages list */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }} style={{ flexGrow: 1 }}>
                        <View style={[styles.row, { gap: 6, paddingHorizontal: 6 }]}>
                            <IconButton icon="chevron-left" onPress={() => onSelectPage(currentPage - 1)} disabled={currentPage <= 1} accessibilityLabel="Previous page" />
                            {pageNumbers[0] > 1 && (
                                <>
                                    <Chip compact onPress={() => onSelectPage(1)}>1</Chip>
                                    <Text style={{ opacity: 0.5, marginHorizontal: 2 }}>…</Text>
                                </>
                            )}
                            {pageNumbers.map(p => (
                                <Chip
                                    key={p}
                                    mode={p === currentPage ? 'flat' : 'outlined'}
                                    compact
                                    onPress={() => onSelectPage(p)}
                                    style={{ height: 28 }}
                                >
                                    <Text style={{ fontWeight: p === currentPage ? '700' : '500' }}>{p}</Text>
                                </Chip>
                            ))}
                            {pageNumbers[pageNumbers.length - 1] < pageCount && (
                                <>
                                    <Text style={{ opacity: 0.5, marginHorizontal: 2 }}>…</Text>
                                    <Chip compact onPress={() => onSelectPage(pageCount)}>{pageCount}</Chip>
                                </>
                            )}
                            <IconButton icon="chevron-right" onPress={() => onSelectPage(currentPage + 1)} disabled={currentPage >= pageCount} accessibilityLabel="Next page" />
                        </View>
                    </ScrollView>

                    {/* Right: Sort dropdown */}
                    <Menu
                        visible={sortMenuVisible}
                        onDismiss={() => setSortMenuVisible(false)}
                        anchor={
                            <Chip
                                compact
                                onPress={() => setSortMenuVisible(true)}
                                icon="sort"
                                style={{ marginLeft: 'auto' }}
                            >
                                <Text numberOfLines={1} style={{ maxWidth: 140 }}>
                                    Sort: {sortOptions.find(o => o.value === currentSort)?.label || 'Relevance'}
                                </Text>
                            </Chip>
                        }
                        style={{ backgroundColor: Colors(theme).background }}
                    >
                        {sortOptions.map(opt => (
                            <Menu.Item
                                key={opt.value}
                                onPress={() => onSelectSort(opt.value)}
                                title={opt.label}
                            // right={() => (opt.value === currentSort ? <Badge>✓</Badge> : null)}
                            />
                        ))}
                    </Menu>
                </View>
                {!!statsItem &&
                    <InfluencerStatsModal visible={!!statsItem} item={statsItem} onClose={() => setStatsItem(null)} selectedDb={selectedDb} />}
            </View>
        </View>
    )
}

export default DiscoverInfluencer