import {
    DiscoverCommunication,
    useDiscovery,
} from "@/components/discover/discovery-context";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useGuideTourOptional } from "@/contexts/guide-tour-context.provider";
import { useBreakpoints } from "@/hooks";
import { ISocialAnalytics, ISocials } from "@/shared-libs/firestore/trendly-pro/models/bq-socials";
import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { ISocials as IShadowSocial } from "@/shared-libs/firestore/trendly-pro/models/socials";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import SlowLoader from "@/shared-uis/components/SlowLoader";
import { View } from "@/shared-uis/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { User } from "@/types/User";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Linking,
    ListRenderItemInfo,
    Platform,
    StyleSheet,
    Text,
    View as RNView,
} from "react-native";
import {
    Button,
    Chip,
    Divider,
    IconButton,
    Menu,
    Portal
} from "react-native-paper";
import InviteToCampaignButton from "../collaboration/InviteToCampaignButton";
import InfluencerCard from "../explore-influencers/InfluencerCard";
import BottomSheetScrollContainer from "../ui/bottom-sheet/BottomSheetWithScroll";
import type { InfluencerItem } from "./discover-types";
import NoDiscoveryCreditModal from "./NoDiscoveryCreditModal";
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

interface DiscoverInfluencerProps {
    advanceFilter?: boolean;
    statusFilter?: boolean;
    isStatusCard?: boolean;
    onStatusChange?: (status: string) => void;
    defaultAdvanceFilters?: IAdvanceFilters;
    initialInfluencerId?: string;
}

const DiscoverInfluencer: React.FC<DiscoverInfluencerProps> = ({
    advanceFilter = false,
    statusFilter = false,
    isStatusCard = false,
    onStatusChange,
    defaultAdvanceFilters,
    initialInfluencerId,
}) => {
    const {
        selectedDb,
        setRightPanel,
        rightPanel,
        setSelectedDb,
        isCollapsed,
        setTotalCount,
        setCurrentSort,
        currentSort,
        pageSortCommunication,
    } = useDiscovery();
    const { manager } = useAuthContext();
    const { selectedBrand, isOnFreeTrial, isProfileLocked } = useBrandContext();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);
    const [adminMenuVisible, setAdminMenuVisible] = useState(false);
    const [selectedInfluencer, setSelectedInfluencer] =
        useState<InfluencerItem | null>(null);
    const [isRescraping, setIsRescraping] = useState(false);
    const [openProfileModal, setOpenProfileModal] = useState(false);
    const [trendlyAnalytics, setTrendlyAnalytics] = useState<ISocialAnalytics | null>(null);
    const [trendlySocial, setTrendlySocial] = useState<ISocials | null>(null);
    const [shadowUser, setShadowUser] = useState<IUsers | null>(null);
    const [shadowSocial, setShadowSocial] = useState<IShadowSocial | null>(null);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const trendlyAnalyticsRef = React.useRef<any>(null);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<InfluencerItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [appliedFilters, setAppliedFilters] = useState<IAdvanceFilters | null>(
        null
    );
    const { openModal } = useConfirmationModel();
    const [showNoCreditModal, setShowNoCreditModal] = useState(false);

    const { xl } = useBreakpoints();
    const guideTour = useGuideTourOptional();
    const firstCardRef = useRef<RNView>(null);

    useEffect(() => {
        if (guideTour?.isTourActive && guideTour.currentStep === 0) {
            guideTour.registerMeasureTarget("step-0", firstCardRef);
        }
        return () => {
            guideTour?.registerMeasureTarget("step-0", null);
        };
    }, [guideTour]);

    // collaborations are fetched inside InviteToCampaignModal when it mounts
    const openProfile = (data: InfluencerItem | null) => {
        if (
            (selectedBrand?.credits?.discovery || 0) <= 0 &&
            data &&
            !selectedBrand?.discoveredInfluencers?.includes(data.id)
        ) {
            setShowNoCreditModal(true);
            return;
        }

        setTrendlyAnalytics(null);
        setTrendlySocial(null);
        setShadowUser(null);
        setShadowSocial(null);
        setIsAnalyticsLoading(false);
        setSelectedInfluencer(data);
        setOpenProfileModal(!!data);
    };

    const closeProfileModal = () => {
        setOpenProfileModal(false);
        setSelectedInfluencer(null);
        setTrendlyAnalytics(null);
        setTrendlySocial(null);
        setShadowUser(null);
        setShadowSocial(null);
        setIsAnalyticsLoading(false);
    };
    const [autoOpenedId, setAutoOpenedId] = useState<string | null>(null);

    // Auto-open profile when initialInfluencerId is provided (deep-linking)
    useEffect(() => {
        if (!initialInfluencerId || autoOpenedId === initialInfluencerId) return;

        if (data.length === 0 && loading) {
            return;
        }

        const influencerMatch = data.find((item) => item.id === initialInfluencerId);

        if (influencerMatch) {
            openProfile(influencerMatch);
            setAutoOpenedId(initialInfluencerId);
        } else if (!loading && data.length > 0 && selectedBrand?.id) {
            (async () => {
                try {
                    const res = await HttpWrapper.fetch(
                        `/discovery/brands/${selectedBrand.id}/influencers/${initialInfluencerId}`,
                        { method: "GET" }
                    );
                    const body = await res.json();

                    if (body?.id) {
                        const influencerItem: InfluencerItem = {
                            id: body.id,
                            name: body.name || "Unknown",
                            username: body.username || "unknown",
                            profile_pic: body.profile_pic || "",
                            follower_count: body.follower_count || 0,
                            engagement_count: body.engagement_count || 0,
                            views_count: body.views_count || 0,
                            engagement_rate: body.engagement_rate || 0,
                        };
                        openProfile(influencerItem);
                        setAutoOpenedId(initialInfluencerId);
                    }
                } catch (error) {
                    console.error("[DiscoverInfluencer] Error fetching influencer:", error);
                }
            })();
        }
    }, [initialInfluencerId, data, loading, openProfile, selectedBrand?.id]);

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageCount, setPageCount] = useState<number>(20);
    const [totalResults, setTotalResults] = useState<number>(0);

    const { discoverCommunication } = useDiscovery();

    const dedupeById = useCallback((items: InfluencerItem[]) => {
        const seen = new Set<string>();
        const result = items.filter((item) => {
            if (!item?.id) return true;
            if (seen.has(item.id)) {
                return false;
            }
            seen.add(item.id);
            return true;
        });
        return result;
    }, []);

    discoverCommunication.current = useCallback(
        ({ loading, data, page, sort }: DiscoverCommunication) => {
            setLoading(loading || false);
            const nextData = Array.isArray(data) ? data : [];
            setData(dedupeById(nextData));
            setTotalCount(
                nextData.length < 15 ? String(nextData.length) : "500+"
            );
            if (!xl) {
                setRightPanel(false);
            }
            if (page) setCurrentPage(page);
            if (sort) {
                setCurrentSort(sort);
            }
        },
        [dedupeById, xl, setRightPanel, setTotalCount, setCurrentSort]
    );

    // Trigger first discover API call when we have a brand. Run when filters are set OR when
    // we're ready with no filters (defaultAdvanceFilters undefined) so the list still loads.
    useEffect(() => {
        if (!selectedBrand?.id) return;

        if (defaultAdvanceFilters) {
            setAppliedFilters(defaultAdvanceFilters);
        }

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
    }, [defaultAdvanceFilters, selectedBrand?.id]);

    useEffect(() => {
        if (
            !openProfileModal ||
            !selectedInfluencer?.id ||
            !selectedBrand?.id ||
            selectedDb !== "trendly"
        ) {
            setTrendlyAnalytics(null);
            setTrendlySocial(null);
            setShadowSocial(null);
            setIsAnalyticsLoading(false);
            return;
        }

        let isActive = true;
        setIsAnalyticsLoading(true);
        setTrendlyAnalytics(null);
        setTrendlySocial(null);
        setShadowUser(null);
        setShadowSocial(null);

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
                const shadowSocial = body?.influencer.social as IShadowSocial | undefined;
                const shadowUser = body?.influencer.user as IUsers | undefined;
                setTrendlyAnalytics(analytics || null);
                setTrendlySocial(social || null);
                setShadowUser(shadowUser || null);
                setShadowSocial(shadowSocial || null);
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

    const profileSocial = shadowSocial
        ? {
            ...shadowSocial,
            gender: trendlySocial?.gender,
            quality: trendlySocial?.quality_score,
            isVerified: trendlySocial?.profile_verified,
        }
        : undefined;

    const columns = xl ? 2 : 1;
    const [key, setKey] = useState(0);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const renderItem = useCallback(
        ({ item, index }: ListRenderItemInfo<InfluencerItem>) => {
            return (
                <RNView
                    ref={index === 0 ? firstCardRef : undefined}
                    collapsable={index === 0 ? false : undefined}
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
                </RNView>
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

    const onSelectPage = useCallback(
        (p: number) => {
            if (p < 1 || p > pageCount || p === currentPage) return;
            setCurrentPage(p);
            // Close right panel on mobile when changing pages
            if (!xl) {
                setRightPanel(false);
            }
            pageSortCommunication.current?.({
                page: p,
                sort: currentSort,
            });
        },
        [currentPage, pageCount, xl, setRightPanel]
    );

    if (loading && data.length === 0) {
        // Full screen loader when we're fetching the first page
        return (
            <View style={styles.fullScreenLoader}>
                <SlowLoader messages={["Searching for influencers...", "Analyzing profiles...", "Applying filters...", "Almost there...", "Loading results..."]} />
            </View>
        );
    }

    if (data.length == 0) {
        return (
            <View
                style={{
                    flex: 1,
                    minWidth: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 24,
                }}
            >
                <Text
                    style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: Colors(theme).text,
                        textAlign: "center",
                    }}
                >
                    No influencers matched your filters.
                </Text>
                <Text
                    style={{
                        marginTop: 8,
                        fontSize: 13,
                        color: Colors(theme).textSecondary,
                        textAlign: "center",
                    }}
                >
                    Try widening follower range or clearing a few filters.
                </Text>
            </View>
        );
    }

    return (
        <View
            style={[
                { flex: 1, minWidth: 0, },
                !xl && rightPanel && { display: "none" },
            ]}
        >
            <View
                style={{
                    flex: 1,
                    alignItems: isCollapsed ? "center" : "flex-start",
                    paddingHorizontal: Platform.OS === "web" && xl ? 120 : 16,
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
                                                        color: colors.black,
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
                                    backgroundColor: colors.playBadgeBg,
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderRadius: 24,
                                    shadowColor: colors.black,
                                    shadowOffset: { width: 0, height: 3 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 6,
                                    elevation: 6,
                                    width: "90%",
                                    maxWidth: 420,
                                    alignItems: "center",
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        backgroundColor: "transparent"
                                    }}
                                >
                                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.black }}>
                                        {selectedIds.length} {selectedIds.length === 1 ? "account" : "accounts"} selected
                                    </Text>
                                    <IconButton
                                        icon="close"
                                        iconColor={colors.black}
                                        size={20}
                                        style={{ margin: 0, }}
                                        onPress={() => setSelectedIds([])}

                                    />
                                </View>
                                <View style={{ marginTop: 8, alignItems: "center", backgroundColor: "transparent", alignSelf: "center" }}>
                                    <InviteToCampaignButton
                                        label="Invite Now"
                                        openModal={openModal}
                                        influencerIds={selectedIds}
                                        influencerName={
                                            selectedIds.length === 1
                                                ? data.find((i) => i.id === selectedIds[0])?.name
                                                : undefined
                                        }
                                        brandId={selectedBrand?.id}
                                        connectionCredits={selectedBrand?.credits?.connection}

                                    />
                                </View>
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
                        shadowUser && !isAnalyticsLoading ? (
                            <ProfileBottomSheet
                                key={selectedInfluencer.id}
                                influencer={{
                                    ...shadowUser,
                                    id: selectedInfluencer.id,
                                } as User}
                                theme={theme}
                                isOnFreePlan={isOnFreeTrial}
                                isPhoneMasked={false}
                                social={profileSocial}
                                actionCard={
                                    <>
                                        <TrendlyAnalyticsEmbed
                                            ref={trendlyAnalyticsRef}
                                            influencer={selectedInfluencer}
                                            selectedBrand={selectedBrand}
                                            initialSocial={trendlySocial}
                                            initialAnalytics={trendlyAnalytics}
                                        />
                                        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                                            {/* TODO Need to get the Profile Meta rendered correctly */}
                                            {/* <Title style={[styles.cardColor, { marginBottom: 8 }]}>
                                                Profile Meta
                                            </Title>
                                            <View style={{ gap: 6 }}>
                                                <Text style={styles.subTextHeading}>
                                                    ID: {trendlySocial.id}
                                                </Text>
                                                <Text style={styles.subTextHeading}>
                                                    Platform: {trendlySocial.social_type || "—"}
                                                </Text>
                                                <Text style={styles.subTextHeading}>
                                                    Last Updated:{" "}
                                                    {formatDate(
                                                        trendlySocial.last_update_time
                                                            ? trendlySocial.last_update_time / 1000000
                                                            : undefined
                                                    )}
                                                </Text>
                                            </View> */}
                                        </View>
                                    </>
                                }
                                actionButton={
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <InviteToCampaignButton
                                            label="Invite Now"
                                            openModal={openModal}
                                            influencerIds={[selectedInfluencer.id]}
                                            influencerName={selectedInfluencer.name}
                                        />
                                        {manager?.isAdmin && (
                                            <Menu
                                                visible={adminMenuVisible}
                                                onDismiss={() => setAdminMenuVisible(false)}
                                                anchor={
                                                    <IconButton
                                                        icon="dots-vertical"
                                                        onPress={() => setAdminMenuVisible(true)}
                                                        accessibilityLabel="Admin actions"
                                                    />
                                                }
                                                contentStyle={{ zIndex: 99999, elevation: 99999 }}
                                            >
                                                <Menu.Item
                                                    onPress={() => {
                                                        setAdminMenuVisible(false);
                                                        trendlyAnalyticsRef.current?.openEditModal();
                                                    }}
                                                    title="Edit Metrics"
                                                    leadingIcon="pencil"
                                                />
                                                <Menu.Item
                                                    onPress={() => {
                                                        setAdminMenuVisible(false);
                                                        trendlyAnalyticsRef.current?.handleRescrape();
                                                    }}
                                                    title="Re-scrape"
                                                    disabled={isRescraping}
                                                />
                                            </Menu>
                                        )}
                                    </View>
                                }
                                FireStoreDB={FirestoreDB}
                                isBrandsApp={true}
                                lockProfile={isProfileLocked(selectedInfluencer.id)}
                                closeModal={closeProfileModal}
                            />
                        ) : (
                            <View style={{ padding: 24, alignItems: "center", flex: 1 }}>
                                {isAnalyticsLoading ? (
                                    <SlowLoader messages={["Loading profile data...", "Fetching analytics...", "Getting social insights...", "Almost ready..."]} />
                                ) : (
                                    <Text style={{ color: colors.text }}>
                                        Unable to load profile.
                                    </Text>
                                )}
                            </View>
                        )
                    )}
                </BottomSheetScrollContainer>
            </View>
            <NoDiscoveryCreditModal
                visible={showNoCreditModal}
                onClose={() => setShowNoCreditModal(false)}
            />
        </View>
    );
};

export default DiscoverInfluencer;