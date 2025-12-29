import {
    DiscoverCommunication,
    useDiscovery,
} from "@/components/discover/Discover";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { ISocialAnalytics, ISocials, SocialsBrief } from "@/shared-libs/firestore/trendly-pro/models/bq-socials";
import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import { View } from "@/shared-uis/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { User } from "@/types/User";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    FlatList,
    Image,
    Linking,
    ListRenderItemInfo,
    ScrollView,
    StyleSheet,
    Text,
} from "react-native";
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Divider,
    IconButton,
    Menu,
    Text as PaperText,
    Portal,
} from "react-native-paper";
import InviteToCampaignButton from "../collaboration/InviteToCampaignButton";
import InfluencerCard from "../explore-influencers/InfluencerCard";
import BottomSheetScrollContainer from "../ui/bottom-sheet/BottomSheetWithScroll";
import DiscoverPlaceholder from "./DiscoverAdPlaceholder";
import TrendlyAnalyticsEmbed from "./trendly/TrendlyAnalyticsEmbed";

// type SocialsBreif struct {
// 	ID       string `db:"id" bigquery:"id" json:"id" firestore:"id"`
// 	Name     string `db:"name" bigquery:"name" json:"name" firestore:"name"`
// 	Username string `db:"username" bigquery:"username" json:"username" firestore:"username"`

// 	ProfilePic      string  `db:"profile_pic" bigquery:"profile_pic" json:"profile_pic" firestore:"profile_pic"`
// 	FollowerCount   int64   `db:"follower_count" bigquery:"follower_count" json:"follower_count" firestore:"follower_count"`
// 	ViewsCount      int64   `db:"views_count" bigquery:"views_count" json:"views_count" firestore:"views_count"`                      //views
// 	EnagamentsCount int64   `db:"engagement_count" bigquery:"engagements_count" json:"engagement_count" firestore:"engagement_count"` //engagement
// 	EngagementRate  float32 `db:"engagement_rate" bigquery:"engagement_rate" json:"engagement_rate" firestore:"engagement_rate"`

// 	SocialType string `db:"social_type" bigquery:"social_type" json:"social_type" firestore:"social_type"`

// 	Location string `db:"location" bigquery:"location" json:"location" firestore:"location"`

// 	Bio string `db:"bio" bigquery:"bio" json:"bio" firestore:"bio"`

// 	ProfileVerified bool `db:"profile_verified" bigquery:"profile_verified" json:"profile_verified" firestore:"profile_verified"`

// 	CreationTime   int64 `db:"creation_time" bigquery:"creation_time" json:"creation_time" firestore:"creation_time"`
// 	LastUpdateTime int64 `db:"last_update_time" bigquery:"last_update_time" json:"last_update_time" firestore:"last_update_time"`
// }
// Types

export type InfluencerItem = SocialsBrief & {
    // For invitation card
    invitedAt?: number; // timestamp in milliseconds
    status?: string;
};

export type InfluencerInviteUnit = InfluencerItem & {
    invitedAt: number;
    status: string;
};

const sortOptions = [
    { label: "Followers", value: "followers" },
    { label: "Engagements", value: "engagement" },
    { label: "ER %", value: "engagement_rate" },
    { label: "Views", value: "views" },
];

// Helpers
const formatNumber = (n: number | undefined) => {
    if (n == null) return "-";
    if (n < 100) return String(n.toFixed(2));
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${Math.round(n / 100) / 10}k`;
    if (n < 1_000_000_000) return `${Math.round(n / 100_000) / 10}M`;
    return `${Math.round(n / 100_000_000) / 10}B`;
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        list: {
            flexGrow: 1,
            alignSelf: "center",
            width: "100%", // optional, you can even remove it
        },
        row: { flexDirection: "row", alignItems: "center" },
        avatarCol: {
            paddingHorizontal: 12,
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            backgroundColor: colors.aliceBlue,
        },
        title: {
            fontSize: 20,
            fontWeight: "600" as const,
            lineHeight: 18,
            marginBottom: 0,
            backgroundColor: colors.aliceBlue,
        },
        subtitle: {
            fontSize: 14,
            opacity: 0.7,
            marginBottom: 6,
            backgroundColor: colors.aliceBlue,
        },
        statsRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-evenly",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
        },
        avatar: {
            width: 100,
            height: 100,
            borderRadius: 48,
            backgroundColor: colors.aliceBlue,
            borderWidth: 3,
            borderColor: colors.primary,
        },
        content: { paddingHorizontal: 8, paddingVertical: 8 },
        fullScreenLoader: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
        },
        footerLoader: {
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
        },
        NameAndUserNameCol: {
            flexDirection: "column",
            backgroundColor: colors.aliceBlue,
            flex: 1,
            maxWidth: "40%",
        },
        DetailsContainer: {
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 4,
        },
    });

export const StatChip = ({
    label,
    value,
}: {
    label: string;
    value?: number;
}) => (
    <Chip
        mode="flat"
        compact
        style={{
            marginRight: 6,
            marginBottom: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1,
            flexDirection: "column",
        }}
    >
        <Text style={{ fontWeight: "600" }}>
            {value != null ? formatNumber(value) : "-"}
        </Text>
        <Text> {label}</Text>
    </Chip>
);

interface DiscoverInfluencerProps {
    advanceFilter?: boolean;
    statusFilter?: boolean;
    isStatusCard?: boolean;
    onStatusChange?: (status: string) => void;
    defaultAdvanceFilters?: IAdvanceFilters;
}

const DiscoverInfluencer: React.FC<DiscoverInfluencerProps> = ({
    advanceFilter = false,
    statusFilter = false,
    isStatusCard = false,
    onStatusChange,
    defaultAdvanceFilters,
}) => {
    const {
        selectedDb,
        setRightPanel,
        rightPanel,
        setSelectedDb,
        isCollapsed,
        showTopPanel,
    } = useDiscovery();
    const { selectedBrand, isOnFreeTrial, isProfileLocked } = useBrandContext();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);
    const [selectedInfluencer, setSelectedInfluencer] =
        useState<InfluencerItem | null>(null);
    const [openProfileModal, setOpenProfileModal] = useState(false);
    const [trendlyAnalytics, setTrendlyAnalytics] = useState<ISocialAnalytics | null>(null);
    const [trendlySocial, setTrendlySocial] = useState<ISocials | null>(null);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const trendlyAnalyticsRef = React.useRef<any>(null);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<InfluencerItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [appliedFilters, setAppliedFilters] = useState<IAdvanceFilters | null>(
        null
    );
    const { openModal } = useConfirmationModel();

    const { xl } = useBreakpoints();

    // collaborations are fetched inside InviteToCampaignModal when it mounts
    const openProfile = (data: InfluencerItem | null) => {
        if (
            (selectedBrand?.credits?.discovery || 0) <= 0 &&
            data &&
            !selectedBrand?.discoveredInfluencers?.includes(data.id)
        ) {
            openModal({
                title: "No Discovery Credit",
                description:
                    "You seem to have exhausted the discovery credit. Contact support for recharging the credits",
                confirmText: "Contact Support",
                confirmAction: () => {
                    Linking.openURL("mailto:support@idiv.in");
                },
            });
            return;
        }

        setSelectedInfluencer(data);
        setOpenProfileModal(!!data);
    };

    const closeProfileModal = () => {
        setOpenProfileModal(false);
        setSelectedInfluencer(null);
        setTrendlyAnalytics(null);
        setTrendlySocial(null);
        setIsAnalyticsLoading(false);
    };

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageCount, setPageCount] = useState<number>(20);
    const [totalResults, setTotalResults] = useState<number>(0);

    const [sortMenuVisible, setSortMenuVisible] = useState(false);
    const [currentSort, setCurrentSort] = useState<string>("followers");
    const [statusMenuVisible, setStatusMenuVisible] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<string>("pending");
    const { discoverCommunication } = useDiscovery();

    const statusOptions = [
        { label: "Pending", value: "pending" },
        { label: "Accepted", value: "accepted" },
        { label: "Denied", value: "denied" },
    ];

    discoverCommunication.current = useCallback(
        ({ loading, data, page, sort }: DiscoverCommunication) => {
            setLoading(loading || false);
            setData(data || []);
            setRightPanel(false);
            if (page) setCurrentPage(page);
            if (sort) setCurrentSort(sort);
        },
        []
    );

    useEffect(() => {
        if (defaultAdvanceFilters && !appliedFilters) {
            console.log("🔥 Default Filters Applied:", defaultAdvanceFilters);
            setAppliedFilters(defaultAdvanceFilters);

            discoverCommunication.current?.({
                loading: true,
                data: [],
                page: 1,
                sort: "followers",
            });

            pageSortCommunication.current?.({
                page: 1,
                sort: "followers",
            });
        }
    }, [defaultAdvanceFilters]);

    useEffect(() => {
        if (
            !openProfileModal ||
            !selectedInfluencer?.id ||
            !selectedBrand?.id ||
            selectedDb !== "trendly"
        ) {
            setTrendlyAnalytics(null);
            setTrendlySocial(null);
            setIsAnalyticsLoading(false);
            return;
        }

        let isActive = true;
        setIsAnalyticsLoading(true);
        setTrendlyAnalytics(null);
        setTrendlySocial(null);

        HttpWrapper.fetch(
            `/discovery/brands/${selectedBrand.id}/influencers/${selectedInfluencer.id}`,
            {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                },
            }
        )
            .then(async (res) => {
                const body = await res.json();
                if (!isActive) return;
                const analytics = body?.analysis as ISocialAnalytics | undefined;
                const social = body?.social as ISocials | undefined;
                setTrendlyAnalytics(analytics || null);
                setTrendlySocial(social || null);
            })
            .catch(() => {
                if (!isActive) return;
                setTrendlyAnalytics(null);
                setTrendlySocial(null);
            })
            .finally(() => {
                if (isActive) setIsAnalyticsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [
        openProfileModal,
        selectedBrand?.id,
        selectedDb,
        selectedInfluencer?.id,
    ]);

    const columns = xl ? 2 : 1;
    const [key, setKey] = useState(0);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<InfluencerItem>) => {
            return (
                <View
                    style={{
                        width: columns === 2 ? "50%" : "100%",
                        paddingHorizontal: isCollapsed ? 12 : 8,
                        paddingVertical: isCollapsed ? 12 : 8,
                    }}
                >
                    <InfluencerCard
                        item={item}
                        isCollapsed={isCollapsed}
                        onPress={() => openProfile(item)}
                        openModal={openModal}
                        isSelected={selectedIds.includes(item.id)}
                        onToggleSelect={() => toggleSelect(item.id)}
                        isStatusCard={isStatusCard}
                    />
                </View>
            );
        },
        [isCollapsed, openModal, openProfile, selectedIds]
    );

    const keyExtractor = useCallback((i: InfluencerItem) => i.id, []);

    const getItemLayout = useCallback(
        (_: InfluencerItem[] | null | undefined, index: number) => ({
            length: 96,
            offset: 96 * index,
            index,
        }),
        []
    );

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

    const formatAnalyticsNumber = (n?: number | null) => {
        if (n === null || n === undefined) return "—";
        try {
            return new Intl.NumberFormat(undefined, {
                notation: "compact",
                maximumFractionDigits: 1,
            }).format(n);
        } catch {
            return `${n}`;
        }
    };

    const formatCurrency = (n?: number | null) => {
        if (n === null || n === undefined) return "—";
        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: "INR",
                notation: "compact",
                maximumFractionDigits: 1,
            }).format(n);
        } catch {
            return `₹${formatAnalyticsNumber(n)}`;
        }
    };

    const HeaderCards = ({ analytics }: { analytics: ISocialAnalytics }) => (
        <View style={{ marginHorizontal: 12, marginBottom: 12 }}>
            <View
                style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                }}
            >
                <Card style={{ width: "31%", marginBottom: 12 }}>
                    <Card.Content>
                        <PaperText
                            variant="labelLarge"
                            style={{ opacity: 0.7, marginBottom: 6 }}
                        >
                            Quality
                        </PaperText>
                        <PaperText variant="displaySmall">
                            {analytics.quality}
                            <PaperText variant="labelLarge">%</PaperText>
                        </PaperText>
                        <PaperText
                            variant="bodySmall"
                            style={{ opacity: 0.7, marginTop: 6 }}
                        >
                            Higher = richer, classy, aesthetic creators
                        </PaperText>
                    </Card.Content>
                </Card>

                <Card style={{ width: "31%", marginBottom: 12 }}>
                    <Card.Content>
                        <PaperText
                            variant="labelLarge"
                            style={{ opacity: 0.7, marginBottom: 6 }}
                        >
                            Trustability
                        </PaperText>
                        <PaperText variant="displaySmall">
                            {analytics.trustablity}
                            <PaperText variant="labelLarge">%</PaperText>
                        </PaperText>
                        <PaperText
                            variant="bodySmall"
                            style={{ opacity: 0.7, marginTop: 6 }}
                        >
                            Signals from past collabs, engagement quality
                        </PaperText>
                    </Card.Content>
                </Card>
                <Card style={{ width: "31%", marginBottom: 12 }}>
                    <Card.Content>
                        <PaperText
                            variant="labelLarge"
                            style={{ opacity: 0.7, marginBottom: 6 }}
                        >
                            CPM
                        </PaperText>
                        <PaperText variant="displaySmall">
                            {formatCurrency(analytics.cpm)}{" "}
                        </PaperText>
                        <PaperText
                            variant="bodySmall"
                            style={{ opacity: 0.7, marginTop: 6 }}
                        >
                            Cost per Mille (1000 views)
                        </PaperText>
                    </Card.Content>
                </Card>

                <Card style={{ width: "48%", marginBottom: 12 }}>
                    <Card.Content>
                        <PaperText
                            variant="labelLarge"
                            style={{ opacity: 0.7, marginBottom: 6 }}
                        >
                            Estimated Budget
                        </PaperText>
                        <PaperText variant="headlineLarge">
                            {formatCurrency(analytics.estimatedBudget?.min)} —{" "}
                            {formatCurrency(analytics.estimatedBudget?.max)}
                        </PaperText>
                        <PaperText
                            variant="bodySmall"
                            style={{ opacity: 0.7, marginTop: 6 }}
                        >
                            Typical creator ask for one deliverable
                        </PaperText>
                    </Card.Content>
                </Card>

                <Card style={{ width: "48%", marginBottom: 12 }}>
                    <Card.Content>
                        <PaperText
                            variant="labelLarge"
                            style={{ opacity: 0.7, marginBottom: 6 }}
                        >
                            Estimated Reach
                        </PaperText>
                        <PaperText variant="headlineLarge">
                            {formatAnalyticsNumber(analytics.estimatedReach?.min)} —{" "}
                            {formatAnalyticsNumber(analytics.estimatedReach?.max)}
                        </PaperText>
                        <PaperText
                            variant="bodySmall"
                            style={{ opacity: 0.7, marginTop: 6 }}
                        >
                            Projected unique views per post
                        </PaperText>
                    </Card.Content>
                </Card>
            </View>
        </View>
    );

    const AveragesCard = ({ social }: { social: ISocials }) => (
        <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
            <Card.Title title="Averages & Rates" />
            <Card.Content>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    <StatChip label="Median Views" value={social.average_views} />
                    <StatChip label="Median Likes" value={social.average_likes} />
                    <StatChip label="Median Comments" value={social.average_comments} />
                    <StatChip
                        label="Engagement Rate %"
                        value={social.engagement_rate || 0}
                    />
                    <StatChip label="Quality Score" value={social.quality_score} />
                </View>
            </Card.Content>
        </Card>
    );

    const ReelsCard = ({ social }: { social: ISocials }) =>
        Array.isArray(social.reels) && social.reels.length > 0 ? (
            <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
                <Card.Title title={`Reels`} />
                <Card.Content>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: "row" }}>
                            {social.reels.map((r) => (
                                <Card
                                    key={r.id}
                                    style={{ width: 140, marginRight: 12 }}
                                    onPress={() => r.url && Linking.openURL(r.url)}
                                >
                                    {!!r.thumbnail_url && (
                                        <Image
                                            source={{ uri: r.thumbnail_url }}
                                            style={{
                                                width: "100%",
                                                height: 180,
                                                borderTopLeftRadius: 12,
                                                borderTopRightRadius: 12,
                                            }}
                                        />
                                    )}
                                    <Card.Content>
                                        <PaperText
                                            numberOfLines={2}
                                            variant="bodySmall"
                                            style={{ marginTop: 6 }}
                                        >
                                            {r.caption || "Reel"}
                                        </PaperText>
                                        <Divider style={{ marginVertical: 6 }} />
                                        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                            <Chip
                                                compact
                                                style={{ marginRight: 6, marginBottom: 6 }}
                                                icon="play-circle"
                                            >
                                                {formatAnalyticsNumber(r.views_count)}
                                            </Chip>
                                            <Chip
                                                compact
                                                style={{ marginRight: 6, marginBottom: 6 }}
                                                icon="heart"
                                            >
                                                {formatAnalyticsNumber(r.likes_count)}
                                            </Chip>
                                            <Chip
                                                compact
                                                style={{ marginRight: 6, marginBottom: 6 }}
                                                icon="comment-text"
                                            >
                                                {formatAnalyticsNumber(r.comments_count)}
                                            </Chip>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}
                        </View>
                    </ScrollView>
                </Card.Content>
            </Card>
        ) : null;

    const { pageSortCommunication } = useDiscovery();
    const onSelectPage = useCallback(
        (p: number) => {
            if (p < 1 || p > pageCount || p === currentPage) return;
            setCurrentPage(p);
            pageSortCommunication.current?.({
                page: p,
                sort: currentSort,
            });
        },
        [currentPage, pageCount]
    );

    const onSelectSort = useCallback((val: string) => {
        setCurrentSort(val);
        setSortMenuVisible(false);
        pageSortCommunication.current?.({
            page: currentPage,
            sort: val,
        });
    }, []);

    const onSelectStatus = useCallback(
        (val: string) => {
            setCurrentStatus(val);
            setStatusMenuVisible(false);
            onStatusChange?.(val);
        },
        [onStatusChange]
    );

    if (loading && data.length === 0) {
        // Full screen loader when we're fetching the first page
        return (
            <View style={styles.fullScreenLoader}>
                <ActivityIndicator />
                <Text style={{ marginTop: 8, opacity: 0.7 }}>Loading influencers…</Text>
            </View>
        );
    }

    if (data.length == 0) {
        if (xl)
            return (
                <View style={{ flex: 1, minWidth: 0 }}>
                    <DiscoverPlaceholder
                        selectedDb={selectedDb}
                        setSelectedDb={setSelectedDb}
                    />
                </View>
            );
        else return null;
    }

    return (
        <View
            style={[
                { flex: 1, minWidth: 0 },
                !xl && rightPanel && { display: "none" },
            ]}
        >
            {showTopPanel !== false && (
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderBottomEndRadius: 12,
                        borderBottomStartRadius: 12,
                        zIndex: 999,
                        width: isCollapsed ? "90%" : undefined,
                    }}
                >
                    {xl ? (
                        <>
                            <View style={{ width: 80 }} />
                            {/* Centered Total on desktop */}
                            <View
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    alignItems: "center",
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Text style={{ fontWeight: "600", color: Colors(theme).primary }}>
                                        Total
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            opacity: 0.8,
                                            color: Colors(theme).primary,
                                            fontWeight: "500",
                                            marginLeft: 4,
                                        }}
                                    >
                                        {data.length < 15 ? data.length : "500+"} Results found
                                    </Text>
                                </View>
                            </View>

                            {/* Right: keep existing right-side controls */}
                            {advanceFilter ? (
                                <Button
                                    mode="contained"
                                    onPress={() => router.push("/discover")}
                                    style={{
                                        marginLeft: "auto",
                                        backgroundColor: Colors(theme).aliceBlue,
                                    }}
                                    textColor={Colors(theme).black}
                                    icon={"filter"}
                                >
                                    Advanced Filters
                                </Button>
                            ) : statusFilter ? (
                                <Menu
                                    visible={statusMenuVisible}
                                    onDismiss={() => setStatusMenuVisible(false)}
                                    anchor={
                                        <Chip
                                            compact
                                            onPress={() => setStatusMenuVisible(true)}
                                            icon="filter"
                                            style={{ marginLeft: "auto" }}
                                        >
                                            <Text numberOfLines={1} style={{ maxWidth: 140 }}>
                                                {statusOptions.find((o) => o.value === currentStatus)
                                                    ?.label || "Status"}
                                            </Text>
                                        </Chip>
                                    }
                                    style={{ backgroundColor: Colors(theme).background }}
                                >
                                    {statusOptions.map((opt) => (
                                        <Menu.Item
                                            key={opt.value}
                                            onPress={() => onSelectStatus(opt.value)}
                                            title={opt.label}
                                        />
                                    ))}
                                </Menu>
                            ) : (
                                <Menu
                                    visible={sortMenuVisible}
                                    onDismiss={() => setSortMenuVisible(false)}
                                    anchor={
                                        <Chip
                                            compact
                                            onPress={() => setSortMenuVisible(true)}
                                            icon="sort"
                                            style={{ marginLeft: "auto" }}
                                        >
                                            <Text numberOfLines={1} style={{ maxWidth: 140 }}>
                                                {sortOptions.find((o) => o.value === currentSort)?.label ||
                                                    "Relevance"}
                                            </Text>
                                        </Chip>
                                    }
                                    style={{ backgroundColor: Colors(theme).background }}
                                >
                                    {sortOptions.map((opt) => (
                                        <Menu.Item
                                            key={opt.value}
                                            onPress={() => onSelectSort(opt.value)}
                                            title={opt.label}
                                        />
                                    ))}
                                </Menu>
                            )}
                        </>
                    ) : (
                        // Mobile layout: Total on left, sort/filter on right
                        <>
                            <View>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Text style={{ fontWeight: "600", color: Colors(theme).primary }}>
                                        Total
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            opacity: 0.8,
                                            color: Colors(theme).primary,
                                            fontWeight: "500",
                                            marginLeft: 6,
                                        }}
                                    >
                                        {data.length < 15 ? data.length : "500+"}
                                    </Text>
                                </View>
                            </View>

                            <View>
                                {advanceFilter ? (
                                    <Button
                                        mode="contained"
                                        onPress={() => router.push("/discover")}
                                        style={{ backgroundColor: Colors(theme).aliceBlue }}
                                        textColor={Colors(theme).black}
                                        icon={"filter"}
                                    >
                                        Advanced Filters
                                    </Button>
                                ) : statusFilter ? (
                                    <Menu
                                        visible={statusMenuVisible}
                                        onDismiss={() => setStatusMenuVisible(false)}
                                        anchor={
                                            <Chip compact onPress={() => setStatusMenuVisible(true)} icon="filter">
                                                <Text numberOfLines={1} style={{ maxWidth: 140 }}>
                                                    {statusOptions.find((o) => o.value === currentStatus)?.label || "Status"}
                                                </Text>
                                            </Chip>
                                        }
                                        style={{ backgroundColor: Colors(theme).background }}
                                    >
                                        {statusOptions.map((opt) => (
                                            <Menu.Item key={opt.value} onPress={() => onSelectStatus(opt.value)} title={opt.label} />
                                        ))}
                                    </Menu>
                                ) : (
                                    <Menu
                                        visible={sortMenuVisible}
                                        onDismiss={() => setSortMenuVisible(false)}
                                        anchor={
                                            <Chip compact onPress={() => setSortMenuVisible(true)} icon="sort">
                                                <Text numberOfLines={1} style={{ maxWidth: 140 }}>
                                                    {sortOptions.find((o) => o.value === currentSort)?.label || "Relevance"}
                                                </Text>
                                            </Chip>
                                        }
                                        style={{ backgroundColor: Colors(theme).background }}
                                    >
                                        {sortOptions.map((opt) => (
                                            <Menu.Item key={opt.value} onPress={() => onSelectSort(opt.value)} title={opt.label} />
                                        ))}
                                    </Menu>
                                )}
                            </View>
                        </>
                    )}
                </View>
            )}

            <View
                style={{
                    flex: 1,
                    alignItems: isCollapsed ? "center" : "flex-start",
                    paddingHorizontal: 16,
                }}
            >
                <FlatList
                    data={data}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    style={[styles.list, { maxWidth: isCollapsed ? 900 : undefined }]}
                    // initialNumToRender={8}
                    // maxToRenderPerBatch={8}
                    // windowSize={7}
                    // removeClippedSubviews
                    // @ts-ignore
                    getItemLayout={getItemLayout}
                    numColumns={columns}
                    key={`cols-${columns}`}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={
                        <>
                            {loading && data.length > 0 && (
                                <View style={styles.footerLoader}>
                                    <ActivityIndicator />
                                </View>
                            )}
                            <Divider />
                            {/* Pagination */}
                            <View
                                style={{
                                    paddingVertical: 2,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <View style={[styles.row, { gap: 6, paddingHorizontal: 6 }]}>
                                    <IconButton
                                        icon="chevron-left"
                                        onPress={() => onSelectPage(currentPage - 1)}
                                        disabled={currentPage <= 1}
                                        accessibilityLabel="Previous page"
                                    />
                                    {pageNumbers.map((p) => {
                                        return p != currentPage ? null : (
                                            <Chip
                                                key={p}
                                                mode={p === currentPage ? "flat" : "outlined"}
                                                compact
                                                onPress={() => onSelectPage(p)}
                                            >
                                                <Text
                                                    style={{
                                                        fontWeight: p === currentPage ? "700" : "500",
                                                    }}
                                                >
                                                    {p}
                                                </Text>
                                            </Chip>
                                        );
                                    })}
                                    <IconButton
                                        icon="chevron-right"
                                        onPress={() => onSelectPage(currentPage + 1)}
                                        disabled={currentPage >= pageCount}
                                        accessibilityLabel="Next page"
                                    />
                                </View>
                            </View>
                        </>
                    }
                />
                {selectedIds.length > 0 && (
                    <Portal>
                        <View
                            style={{
                                position: "absolute",
                                bottom: 20,
                                left: 0,
                                right: 0,
                                alignItems: "center",
                                zIndex: 9999,
                                backgroundColor: "transparent",
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: "rgba(255,255,255,0.5)",
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 40,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 3 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 6,
                                    elevation: 6,
                                    width: 320,
                                    justifyContent: "space-between",

                                }}
                            >
                                {/* Selected Count */}
                                <Text style={{ fontSize: 14, fontWeight: "500" }}>
                                    {selectedIds.length} {selectedIds.length === 1 ? "item" : "items"} selected
                                </Text>

                                {/* Invite Button */}
                                <View style={{ top: 0, borderRadius: 50 }}>
                                    <InviteToCampaignButton
                                        label="Invite Now"
                                        openModal={openModal}
                                        influencerIds={selectedIds}
                                        influencerName={
                                            selectedIds.length === 1
                                                ? data.find((i) => i.id === selectedIds[0])?.name
                                                : undefined
                                        }
                                    />
                                </View>

                                {/* Clear / Close Button */}
                                <IconButton
                                    icon="close"
                                    size={22}
                                    onPress={() => setSelectedIds([])}
                                />
                            </View>
                        </View>
                    </Portal>
                )}

                <BottomSheetScrollContainer
                    isVisible={openProfileModal}
                    snapPointsRange={["90%", "90%"]}
                    onClose={closeProfileModal}
                >
                    {selectedInfluencer && selectedBrand && (
                        <ProfileBottomSheet
                            influencer={selectedInfluencer as unknown as User}
                            theme={theme}
                            isOnFreePlan={isOnFreeTrial}
                            isPhoneMasked={false}
                            trendlySocial={trendlySocial}
                            trendlyAnalytics={trendlyAnalytics}
                            isDiscoverView={true}
                            actionCard={
                                <TrendlyAnalyticsEmbed
                                    ref={trendlyAnalyticsRef}
                                    influencer={selectedInfluencer}
                                    selectedBrand={selectedBrand}
                                />
                            }
                            editMetricsButton={
                                trendlyAnalyticsRef.current?.isAdmin ? (
                                    <Button
                                        mode="contained"
                                        onPress={() => trendlyAnalyticsRef.current?.openEditModal()}
                                        icon="pencil"
                                    >
                                        Edit Metrics
                                    </Button>
                                ) : undefined
                            }
                            FireStoreDB={FirestoreDB}
                            isBrandsApp={true}
                            lockProfile={isProfileLocked(selectedInfluencer.id)}
                            closeModal={closeProfileModal}
                        />
                    )}
                </BottomSheetScrollContainer>
            </View>
        </View>
    );
};

export default DiscoverInfluencer;