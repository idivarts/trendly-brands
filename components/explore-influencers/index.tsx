import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { User } from "@/types/User";
import { useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import CollaborationFilter from "../FilterModal";
// import InfluencerCard from "../InfluencerCard";
import { FlashList } from "@shopify/flash-list";
import SearchComponent from "../SearchComponent";
import { View } from "../theme/Themed";


import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import {
  BottomSheetBackdrop
} from "@gorhom/bottom-sheet";

import { useAuthContext } from "@/contexts";
import { IOScroll } from "@/shared-libs/contexts/scroll-context";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { useInfiniteScroll } from "@/shared-libs/utils/infinite-scroll";
import { APPROX_CARD_HEIGHT, MAX_WIDTH_WEB } from "@/shared-uis/components/carousel/carousel-util";
import InfluencerCard from "@/shared-uis/components/InfluencerCard";
import { collection, orderBy, query, where } from "firebase/firestore";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheetScrollContainer from "../ui/bottom-sheet/BottomSheetWithScroll";
import InfluencerActionModal from "./InfluencerActionModal";

const ExploreInfluencers = () => {
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

  const insets = useSafeAreaInsets();
  const containerOffset = useSharedValue({
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
  });

  // const [isLoading, setIsLoading] = useState(true);

  const { manager, updateManager } = useAuthContext()
  const theme = useTheme();

  const { xl } = useBreakpoints();

  const influencersRef = collection(FirestoreDB, "users");
  const q = query(
    influencersRef,
    ...((manager?.isAdmin || false) ? [] : [where("profile.completionPercentage", ">=", 60)]),
    orderBy("creationTime", "desc")
  );
  const { loading: isLoading, data, onScrollEvent } = useInfiniteScroll<User>(q, 10)

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

  const renderBackdrop = (props: any) => {
    return (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    );
  };

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
          <ActivityIndicator size="large" color={Colors(theme).primary} />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
          marginHorizontal: "auto",
          width: "100%", //xl ? MAX_WIDTH_WEB :
        }}
      >
        <IOScroll onScroll={(ev) => {
          onScrollEvent(ev)
        }}>
          <FlashList
            data={filteredInfluencers}
            renderItem={({ item, index }) => (
              <InfluencerCard
                xl={xl}
                key={index}
                type="explore"
                ToggleModal={ToggleModal}
                influencer={item}
                openProfile={(influencer) => {
                  if (influencer)
                    setSelectedInfluencer(influencer as User);
                  setOpenProfileModal(true)
                }}
                setSelectedInfluencer={setSelectedInfluencer as any}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 16,
              paddingHorizontal: xl ? 16 : 0,
            }}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 16,
                  backgroundColor: !xl ? (theme.dark
                    ? Colors(theme).background
                    : Colors(theme).aliceBlue) : "unset",
                }}
              />
            )}
            ListHeaderComponent={
              <View
                style={{
                  paddingHorizontal: xl ? 0 : 16,
                  paddingBottom: theme.dark ? 16 : 0,
                  marginBottom: xl ? 16 : 0
                }}
              >
                <SearchComponent
                  setSearchQuery={setSearchQuery}
                  ToggleModal={() => setIsFilterModalVisible(true)}
                />
              </View>
            }
            style={{
              width: xl ? MAX_WIDTH_WEB : "100%",
              marginHorizontal: "auto",
            }}
            estimatedItemSize={APPROX_CARD_HEIGHT}
          // initialNumToRender={5}
          // maxToRenderPerBatch={10}
          // windowSize={5}
          />
        </IOScroll>
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
          FireStoreDB={FirestoreDB}
          isBrandsApp={true}
          closeModal={() => setOpenProfileModal(false)}
        />
      </BottomSheetScrollContainer>
    </AppLayout>
  );
};

export default ExploreInfluencers;
