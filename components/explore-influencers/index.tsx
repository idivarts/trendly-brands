import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { User } from "@/types/User";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, Linking, ScrollView } from "react-native";
import CollaborationFilter from "../FilterModal";
// import InfluencerCard from "../InfluencerCard";
import { View } from "../theme/Themed";


import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";

import { MAX_WIDTH_WEB } from "@/constants/Container";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { ISocialAnalytics, ISocials } from "@/shared-libs/firestore/trendly-pro/models/bq-socials";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useInfiniteIdScroll } from "@/shared-libs/utils/infinite-id-scroll";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { APPROX_CARD_HEIGHT } from "@/shared-uis/components/carousel/carousel-util";
import InfluencerCard from "@/shared-uis/components/InfluencerCard";
import { CarouselInViewProvider } from "@/shared-uis/components/scroller/CarouselInViewContext";
import CarouselScroller from "@/shared-uis/components/scroller/CarouselScroller";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { collection, query } from "firebase/firestore";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator, Card, Chip, Divider, Text } from "react-native-paper";
import SlowLoader from "../../shared-uis/components/SlowLoader";
import BottomSheetScrollContainer from "../ui/bottom-sheet/BottomSheetWithScroll";
import EmptyState from "../ui/empty-state";
import InfluencerActionModal from "./InfluencerActionModal";
import InfluencerInvite from "./InfluencerInvite";
import { StatChip } from "../discover/DiscoverInfluencer";

interface IProps {
  connectedInfluencers?: boolean
}
const ExploreInfluencers: React.FC<IProps> = ({ connectedInfluencers = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [currentCollaborationType, setCurrentCollaborationType] =
    useState("All");
  const [currentInfluencerType, setCurrentInfluencerType] = useState("All");
  const [currentFollowersRange, setCurrentFollowersRange] = useState([
    0, 1000000,
  ]);
  const [currentReachRange, setCurrentReachRange] = useState([0, 1000000]);
  const [currentEngagementRange, setCurrentEngagementRange] = useState([
    0, 10000000,
  ]);
  const ToggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };
  const [influencers, setInfluencers] = useState<User[]>([]);
  const [filteredInfluencers, setFilteredInfluencers] = useState<User[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<User | null>(
    null
  );

  // const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  // const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);
  const [openProfileModal, setOpenProfileModal] = useState(false)
  const [trendlyAnalytics, setTrendlyAnalytics] = useState<ISocialAnalytics | null>(null)
  const [trendlySocial, setTrendlySocial] = useState<ISocials | null>(null)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false)

  const insets = useSafeAreaInsets();
  const containerOffset = useSharedValue({
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
  });

  // const [isLoading, setIsLoading] = useState(true);

  const { manager } = useAuthContext()
  const theme = useTheme();
  const { selectedBrand, isOnFreeTrial, isProfileLocked } = useBrandContext()
  const preferences = selectedBrand?.preferences || {}

  const { xl } = useBreakpoints();

  const [influencerIds, setInfluencerIds] = useState<string[]>([])

  const influencersRef = collection(FirestoreDB, "users");
  const q = query(
    influencersRef,
  );

  const loadInfluencers = async () => {
    if (connectedInfluencers) {
      setInfluencerIds(selectedBrand?.unlockedInfluencers || [])
      return
    }
    const influencerIds = await PersistentStorage.getItemWithExpiry("matchmaking_influencers-" + selectedBrand?.id)
    if (influencerIds) {
      setInfluencerIds(influencerIds as string[])
    } else
      HttpWrapper.fetch(`/api/matchmaking/influencer-for-brand?brandId=${selectedBrand?.id}`, {
        method: "GET",
      }).then(async (res) => {
        const body = await res.json()
        setInfluencerIds(body.data as string[])
        PersistentStorage.setItemWithExpiry("matchmaking_influencers-" + selectedBrand?.id, body.data as string[])
      }).catch(e => {
        Toaster.error("Cant fetch Influencers")
      })
  }
  useEffect(() => {
    if (!selectedBrand)
      return;
    setInfluencerIds([])
    loadInfluencers()
  }, [selectedBrand?.id])

  const { loading: isLoading, data, loadMore } = useInfiniteIdScroll<User>(influencerIds, q, 10)

  useEffect(() => {
    const fetchedInfluencers: User[] = [];
    data.forEach((doc) => {
      const inf = doc
      if (inf.primarySocial)
        fetchedInfluencers.push({
          ...inf,
          id: doc.documentId,
        } as User);
    });
    setInfluencers(fetchedInfluencers);
  }, [data])

  const filterInfluencers = () => {
    const newFilteredInfluencers = influencers.filter((influencer) => {
      if (manager?.moderations?.blockedInfluencers?.includes(influencer.id))
        return false
      const isSearchQueryMatch = influencer.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return (
        isSearchQueryMatch
      );
    });

    setFilteredInfluencers(newFilteredInfluencers);
  };

  useEffect(() => {
    filterInfluencers();
  }, [
    currentCollaborationType,
    currentInfluencerType,
    currentFollowersRange,
    currentReachRange,
    currentEngagementRange,
    searchQuery,
    influencers,
    manager
  ]);

  useEffect(() => {
    if (!openProfileModal || !selectedInfluencer?.id || !selectedBrand?.id) {
      setTrendlyAnalytics(null)
      setTrendlySocial(null)
      setIsAnalyticsLoading(false)
      return
    }

    let isActive = true
    setIsAnalyticsLoading(true)
    setTrendlyAnalytics(null)
    setTrendlySocial(null)

    HttpWrapper.fetch(`/discovery/brands/${selectedBrand.id}/influencers/${selectedInfluencer.id}`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    }).then(async (res) => {
      const body = await res.json()
      if (!isActive) return
      const analytics = body?.analysis as ISocialAnalytics | undefined
      const social = body?.social as ISocials | undefined
      setTrendlyAnalytics(analytics || null)
      setTrendlySocial(social || null)
    }).catch(() => {
      if (!isActive) return
      setTrendlyAnalytics(null)
      setTrendlySocial(null)
    }).finally(() => {
      if (isActive)
        setIsAnalyticsLoading(false)
    })

    return () => {
      isActive = false
    }
  }, [openProfileModal, selectedBrand?.id, selectedInfluencer?.id])

  const width = Math.min(MAX_WIDTH_WEB, Dimensions.get('window').width);
  const [height, setHeight] = useState(Math.min(APPROX_CARD_HEIGHT, Dimensions.get('window').height))

  const formatNumber = (n?: number | null) => {
    if (n === null || n === undefined) return "—"
    try {
      return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n)
    } catch {
      return `${n}`
    }
  }

  const formatCurrency = (n?: number | null) => {
    if (n === null || n === undefined) return "—"
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(n)
    } catch {
      return `₹${formatNumber(n)}`
    }
  }

  const HeaderCards = ({ analytics }: { analytics: ISocialAnalytics }) => (
    <View style={{ marginHorizontal: 12, marginBottom: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        <Card style={{ width: "31%", marginBottom: 12 }}>
          <Card.Content>
            <Text variant="labelLarge" style={{ opacity: 0.7, marginBottom: 6 }}>Quality</Text>
            <Text variant="displaySmall">{analytics.quality}<Text variant="labelLarge">%</Text></Text>
            <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 6 }}>Higher = richer, classy, aesthetic creators</Text>
          </Card.Content>
        </Card>

        <Card style={{ width: "31%", marginBottom: 12 }}>
          <Card.Content>
            <Text variant="labelLarge" style={{ opacity: 0.7, marginBottom: 6 }}>Trustability</Text>
            <Text variant="displaySmall">{analytics.trustablity}<Text variant="labelLarge">%</Text></Text>
            <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 6 }}>Signals from past collabs, engagement quality</Text>
          </Card.Content>
        </Card>
        <Card style={{ width: "31%", marginBottom: 12 }}>
          <Card.Content>
            <Text variant="labelLarge" style={{ opacity: 0.7, marginBottom: 6 }}>CPM</Text>
            <Text variant="displaySmall">{formatCurrency(analytics.cpm)} </Text>
            <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 6 }}>Cost per Mille (1000 views)</Text>
          </Card.Content>
        </Card>

        <Card style={{ width: "48%", marginBottom: 12 }}>
          <Card.Content>
            <Text variant="labelLarge" style={{ opacity: 0.7, marginBottom: 6 }}>Estimated Budget</Text>
            <Text variant="headlineLarge">
              {formatCurrency(analytics.estimatedBudget?.min)} — {formatCurrency(analytics.estimatedBudget?.max)}
            </Text>
            <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 6 }}>Typical creator ask for one deliverable</Text>
          </Card.Content>
        </Card>

        <Card style={{ width: "48%", marginBottom: 12 }}>
          <Card.Content>
            <Text variant="labelLarge" style={{ opacity: 0.7, marginBottom: 6 }}>Estimated Reach</Text>
            <Text variant="headlineLarge">
              {formatNumber(analytics.estimatedReach?.min)} — {formatNumber(analytics.estimatedReach?.max)}
            </Text>
            <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 6 }}>Projected unique views per post</Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  )

  const AveragesCard = ({ social }: { social: ISocials }) => (
    <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
      <Card.Title title="Averages & Rates" />
      <Card.Content>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <StatChip label="Median Views" value={social.average_views} />
          <StatChip label="Median Likes" value={social.average_likes} />
          <StatChip label="Median Comments" value={social.average_comments} />
          <StatChip label="Engagement Rate %" value={(social.engagement_rate || 0)} />
          <StatChip label="Quality Score" value={social.quality_score} />
        </View>
      </Card.Content>
    </Card>
  )

  const ReelsCard = ({ social }: { social: ISocials }) => (
    Array.isArray(social.reels) && social.reels.length > 0 ? (
      <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
        <Card.Title title={`Reels`} />
        <Card.Content>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row" }}>
              {social.reels.map((r) => (
                <Card key={r.id} style={{ width: 140, marginRight: 12 }} onPress={() => r.url && Linking.openURL(r.url)}>
                  {!!r.thumbnail_url && (
                    <Image source={{ uri: r.thumbnail_url }} style={{ width: "100%", height: 180, borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
                  )}
                  <Card.Content>
                    <Text numberOfLines={2} variant="bodySmall" style={{ marginTop: 6 }}>{r.caption || "Reel"}</Text>
                    <Divider style={{ marginVertical: 6 }} />
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
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
    ) : null
  )


  if (influencers.length == 0 && connectedInfluencers) {
    return (
      <AppLayout>
        <EmptyState
          image={require("@/assets/images/illustration6.png")}
          subtitle="You don’t have any influencers connected yet. Switch to Explore Mode from the right panel to start discovering and unlocking influencers."
          title="No Influencers Connected"
          hideAction={true}
        />
      </AppLayout>
    );
  }
  if (isLoading && influencers.length == 0) {
    return (
      <AppLayout>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SlowLoader />
        </View>
      </AppLayout>
    );
  }
  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          alignSelf: "stretch",
          minHeight: 0,
        }}>
        <View style={{ alignSelf: "stretch", flex: 1, minHeight: 0 }}>
          <CarouselInViewProvider>
            <CarouselScroller
              data={filteredInfluencers}
              renderItem={({ item, index }) => (
                <InfluencerCard
                  xl={xl}
                  key={item.id}
                  isOnFreePlan={isOnFreeTrial}
                  lockProfile={isProfileLocked(item.id)}
                  type="explore"
                  ToggleModal={ToggleModal}
                  influencer={item}
                  fullHeight={true}
                  setSelectedInfluencer={setSelectedInfluencer as any}
                  openProfile={(item) => {
                    if (item)
                      setSelectedInfluencer(item as User);
                    setOpenProfileModal(true)
                  }}
                />
              )}
              objectKey='id'
              vertical={true}
              width={width} 
              height={height}
              onLoadMore={() => loadMore()}
              onPressView={(item, ind) => {
                if (item)
                  setSelectedInfluencer(item as User);
                setOpenProfileModal(true)
              }}
            />
          </CarouselInViewProvider>
        </View>
      </View>

      <InfluencerActionModal influencerId={selectedInfluencer?.id} isModalVisible={isModalVisible} openProfile={() => setOpenProfileModal(true)} toggleModal={ToggleModal} />

      {isFilterModalVisible && (
        <CollaborationFilter
          isVisible={isFilterModalVisible}
          onClose={() => setIsFilterModalVisible(false)}
          collaborationType={["All", "Paid", "Unpaid"]}
          influencerType={["All", "Micro", "Macro"]}
          setCollaborationType={setCurrentCollaborationType}
          setInfluencerType={setCurrentInfluencerType}
          setCurrentFollowersRange={setCurrentFollowersRange}
          setCurrentReachRange={setCurrentReachRange}
          setCurrentEngagementRange={setCurrentEngagementRange}
          currentCollaborationType="All"
          currentInfluencerType="All"
          currentFollowersRange={[0, 1000000]}
          currentReachRange={[0, 1000000]}
          currentEngagementRange={[0, 100000]}
        />
      )}

      <BottomSheetScrollContainer
        isVisible={openProfileModal}
        snapPointsRange={["90%", "90%"]}
        onClose={() => { setOpenProfileModal(false) }}
      >
        <ProfileBottomSheet
          influencer={selectedInfluencer as User}
          theme={theme}
          isOnFreePlan={isOnFreeTrial}
          isPhoneMasked={false}
          actionCard={
            <View
              style={{
                backgroundColor: Colors(theme).transparent,
                marginHorizontal: 16,
              }}
            >
              {/* <InfluencerInvite selectedInfluencer={selectedInfluencer as User} /> */}
              <View style={{ marginTop: 12 }}>
                {isAnalyticsLoading && (
                  <View style={{ alignItems: "center", paddingVertical: 12 }}>
                    <ActivityIndicator animating size="small" />
                  </View>
                )}
                {!isAnalyticsLoading && !trendlyAnalytics && !trendlySocial && (
                  <Text variant="bodySmall" style={{ opacity: 0.7, marginHorizontal: 12, marginBottom: 12 }}>
                    Detailed analytics are not available for this creator yet.
                  </Text>
                )}
                {trendlyAnalytics && <HeaderCards analytics={trendlyAnalytics} />}
                {trendlySocial && <AveragesCard social={trendlySocial} />}
                {trendlySocial && <ReelsCard social={trendlySocial} />}
              </View>
            </View>
          }
          FireStoreDB={FirestoreDB}
          isBrandsApp={true}
          lockProfile={isProfileLocked(selectedInfluencer?.id || "")}
          trendlySocial={trendlySocial}
          trendlyAnalytics={trendlyAnalytics}
          closeModal={() => setOpenProfileModal(false)}
        />
      </BottomSheetScrollContainer>
    </AppLayout>
  );
};

export default ExploreInfluencers;
