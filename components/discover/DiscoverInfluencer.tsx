import {
  DiscoverCommunication,
  useDiscovery,
} from "@/app/(main)/(drawer)/(tabs)/discover";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import { FacebookImageComponent } from "@/shared-uis/components/image-component";
import { View } from "@/shared-uis/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { maskHandle } from "@/shared-uis/utils/masks";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  FlatList,
  Linking,
  ListRenderItemInfo,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  ActivityIndicator,
  Card,
  Chip,
  Divider,
  IconButton,
  Menu,
} from "react-native-paper";
import DiscoverPlaceholder from "./DiscoverAdPlaceholder";
import { InfluencerStatsModal } from "./InfluencerStatModal";
import InviteToCampaignButton from "../collaboration/InviteToCampaignButton";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { processRawAttachment } from "@/shared-libs/utils/attachments";
import { Text } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowUpWideShort,
  faChartLine,
  faPeopleRoof,
} from "@fortawesome/free-solid-svg-icons";

// Types
export interface InfluencerItem {
  userId: string;
  fullname: string;
  username: string;
  url: string;
  picture: string;
  followers: number;
  views?: number;
  engagements: number;
  engagementRate: number;
}

const sortOptions = [
  { label: "Followers (High → Low)", value: "followers" },
  { label: "Engagements (High → Low)", value: "engagement" },
  { label: "ER % (High → Low)", value: "engagement_rate" },
  { label: "Views (High → Low)", value: "views" },
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
    list: { flex: 1 },
    card: {
      marginHorizontal: 8,
      marginVertical: 6,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: colors.aliceBlue,
      minWidth: 340,
      alignSelf: "stretch",
      minHeight: 216,
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

const DiscoverInfluencer: React.FC = () => {
  const { selectedDb, setRightPanel, rightPanel, setSelectedDb } =
    useDiscovery();
  const theme = useTheme();
  const colors = Colors(theme);
  const styles = useMemo(() => useStyles(colors), [colors]);

  const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);
  const [statsItem, setStatsItemNative] = useState<InfluencerItem | null>(null);
  const setStatsItem = (data: InfluencerItem | null) => {
    if (
      (selectedBrand?.credits?.discovery || 0) <= 0 &&
      data &&
      !selectedBrand?.discoveredInfluencers?.includes(data.userId)
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
  const [collaborations, setCollaborations] = useState<
    {
      id: string;
      name: string;
      description: string;
      mediaUrl?: string;
      isVideo?: boolean;
      active?: boolean;
    }[]
  >([]);

  const { selectedBrand } = useBrandContext();
  const { openModal } = useConfirmationModel();

  const { xl } = useBreakpoints();

  // Fetch active collaborations for the selected brand to show in Invite modal
  useEffect(() => {
    let mounted = true;

    const fetchActiveCollaborations = async () => {
      try {
        if (!selectedBrand) return;

        const coll = collection(FirestoreDB, "collaborations");
        const q = query(
          coll,
          where("brandId", "==", selectedBrand.id),
          where("status", "==", "active"),
          orderBy("timeStamp", "desc")
        );

        const snap = await getDocs(q);
        const items = snap.docs.map((d) => {
          const data = d.data() as any;
          const attachments = data.attachments || [];
          const first = attachments[0];
          const processed = processRawAttachment(first);
          const isVideo = processed?.type?.includes("video") || false;
          const mediaUrl =
            processed?.url ||
            first?.imageUrl ||
            first?.url ||
            "https://via.placeholder.com/300x200.png?text=No+Image";

          return {
            id: d.id,
            name: data.name || "",
            description: data.description || "",
            mediaUrl,
            isVideo,
            active: true,
          };
        });

        if (mounted) setCollaborations(items);
      } catch (err) {
        // swallow for now — don't break Discover UX
        console.warn("Failed to load active collaborations", err);
      }
    };

    fetchActiveCollaborations();

    return () => {
      mounted = false;
    };
  }, [selectedBrand]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(20);
  const [totalResults, setTotalResults] = useState<number>(0);

  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState<string>("followers");
  const { discoverCommunication } = useDiscovery();

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

  const onOpenProfile = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<InfluencerItem>) => {
      return (
        <Card
          style={[styles.card, { maxWidth: xl ? "40%" : "100%" }]}
          onPress={() => setStatsItem(item)}
        >
          <Card.Content style={styles.content}>
            <View style={{ backgroundColor: colors.aliceBlue, paddingTop: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.aliceBlue,
                  columnGap: 4,
                }}
              >
                <View style={styles.avatarCol}>
                  <FacebookImageComponent
                    url={item.picture}
                    altText={item.fullname}
                    style={styles.avatar}
                  />
                </View>

                <View style={styles.NameAndUserNameCol}>
                  <Text
                    style={styles.title}
                    ellipsizeMode="tail"
                    numberOfLines={1}
                  >
                    {[item.fullname]}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    @{maskHandle(item.username)}
                  </Text>
                  <View
                    style={{
                      alignItems: "flex-start",
                      backgroundColor: colors.aliceBlue,
                      marginTop: 8,
                    }}
                  >
                    <InviteToCampaignButton
                      label="Invite"
                      openModal={openModal}
                      selectedBrand={selectedBrand}
                      collaborations={collaborations} // active ones
                      textstyle={{ fontSize: 18 }}
                    />
                  </View>
                </View>
              </View>
              <View
                style={{
                  paddingTop: 20,
                  backgroundColor: Colors(theme).aliceBlue,
                }}
              >
                <View
                  style={[
                    styles.statsRow,
                    { backgroundColor: Colors(theme).InfluencerStatCard },
                  ]}
                >
                  <View
                    style={[
                      styles.DetailsContainer,
                      { backgroundColor: Colors(theme).InfluencerStatCard },
                    ]}
                  >
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>
                      {formatNumber(item.followers)}
                    </Text>
                    <Text style={{ fontSize: 10, color: Colors(theme).text }}>
                      {"Followers"}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: Colors(theme).text,
                      height: "80%",
                      padding: 0.5,
                      alignSelf: "center",
                    }}
                  />
                  <View
                    style={[
                      styles.DetailsContainer,
                      { backgroundColor: Colors(theme).InfluencerStatCard },
                    ]}
                  >
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>
                      {formatNumber(item.engagements)}
                    </Text>
                    <Text style={{ fontSize: 10, color: Colors(theme).text }}>
                      {"Engagements"}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: Colors(theme).text,
                      height: "80%",
                      padding: 0.5,
                      alignSelf: "center",
                    }}
                  />
                  {/* <View style={styles.DetailsContainer}>
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>
                      {formatNumber(item.engagementRate)}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#737373" }}>
                      {xl ? "ER (in %)" : "ER"}
                    </Text>
                  </View> */}
                  {/* <View
                    style={{
                      backgroundColor: "#ccc",
                      height: "80%",
                      padding: 0.5,
                      alignSelf: "center",
                    }} */}

                  <View
                    style={[
                      styles.DetailsContainer,
                      { backgroundColor: Colors(theme).InfluencerStatCard },
                    ]}
                  >
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>
                      {formatNumber(item.views)}
                    </Text>
                    <Text style={{ fontSize: 10, color: Colors(theme).text }}>
                      {xl ? "Views" : "Views"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      );
    },
    [menuVisibleId, onOpenProfile, styles]
  );

  const keyExtractor = useCallback((i: InfluencerItem) => i.userId, []);

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
        !xl &&
          rightPanel && {
            display: "none",
          },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 10,
          paddingVertical: 6,
          shadowColor: Colors(theme).primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 1,
          elevation: 2,
          borderBottomEndRadius: 12,
          borderBottomStartRadius: 12,
          zIndex: 999,
        }}
      >
        {/* Left: Total results */}
        <View style={[styles.row, { gap: 6 }]}>
          <Text style={{ fontWeight: "600", color: Colors(theme).primary }}>
            Total
          </Text>
          <Text
            style={{
              fontSize: 12,
              opacity: 0.8,
              color: Colors(theme).primary,
              fontWeight: "500",
            }}
          >
            {data.length < 15 ? data.length : "500+"} Results found
          </Text>
        </View>

        {/* Right: Sort dropdown */}
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
              // right={() => (opt.value === currentSort ? <Badge>✓</Badge> : null)}
            />
          ))}
        </Menu>
      </View>

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
          numColumns={xl ? 2 : 1}
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
                    disabled={data.length != 15}
                    accessibilityLabel="Next page"
                  />
                </View>
              </View>
            </>
          }
        />

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
