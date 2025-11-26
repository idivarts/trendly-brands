import {
  DiscoverCommunication,
  useDiscovery,
} from "@/components/discover/Discover";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { SocialsBrief } from "@/shared-libs/firestore/trendly-pro/models/bq-socials";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import { View } from "@/shared-uis/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  FlatList,
  Linking,
  ListRenderItemInfo,
  StyleSheet,
  Text,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
} from "react-native-paper";
import InviteToCampaignButton from "../collaboration/InviteToCampaignButton";
import InfluencerCard from "../explore-influencers/InfluencerCard";
import DiscoverPlaceholder from "./DiscoverAdPlaceholder";
import { InfluencerStatsModal } from "./InfluencerStatModal";
import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";


export type InfluencerItem = SocialsBrief & {
  // For invitation card
  invitedAt?: number; // timestamp in milliseconds
  status?: string;
}

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
      elevation: 2,
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
  const theme = useTheme();
  const colors = Colors(theme);
  const styles = useMemo(() => useStyles(colors), [colors]);

  const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);
  const [statsItem, setStatsItemNative] = useState<InfluencerItem | null>(null);
  const setStatsItem = (data: InfluencerItem | null) => {
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

    setStatsItemNative(data);
  };

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InfluencerItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<IAdvanceFilters | null>(
    null
  );
  const { selectedBrand } = useBrandContext();
  const { openModal } = useConfirmationModel();

  const { xl } = useBreakpoints();

  // collaborations are fetched inside InviteToCampaignModal when it mounts

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

  const onOpenProfile = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  const Col = 2;
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
            width: "50%", // always 2 columns
            paddingHorizontal: isCollapsed ? 12 : 8,
            paddingVertical: isCollapsed ? 12 : 8,
          }}
        >
          <InfluencerCard
            item={item}
            isCollapsed={isCollapsed}
            onPress={() => setStatsItem(item)}
            openModal={openModal}
            isSelected={selectedIds.includes(item.id)}
            onToggleSelect={() => toggleSelect(item.id)}
            isStatusCard={isStatusCard}
          />
        </View>
      );
    },
    [isCollapsed, openModal, setStatsItem]
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
            // shadowColor: Colors(theme).primary,
            // shadowOffset: { width: 0, height: 2 },
            // shadowOpacity: 0.2,
            // shadowRadius: 1,
            // elevation: 2,
            borderBottomEndRadius: 12,
            borderBottomStartRadius: 12,
            zIndex: 999,
            width: isCollapsed ? "90%" : undefined,
          }}
        >
          <View style={{ width: 80 }} />
          {/* Left: Total results */}
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

          {/* Right: Sort dropdown or Status Filter or Advance Filter Button */}
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
        </View>
      )}

      <View
        style={{ flex: 1, alignItems: isCollapsed ? "center" : "flex-start" }}
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
          numColumns={2}
          key={"fixed-2-cols"}
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
                {selectedIds.length} item selected
              </Text>

              {/* Invite Button */}
              <View style={{ top: 0, borderRadius: 50 }}>
                <InviteToCampaignButton
                  label="Invite Now"
                  openModal={() => { }}
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
        )}

        {!!statsItem && (
          <InfluencerStatsModal
            visible={!!statsItem}
            item={statsItem}
            onClose={() => setStatsItem(null)}
            selectedDb={selectedDb}
          />
        )}
      </View>
    </View>
  );
};

export default DiscoverInfluencer;
