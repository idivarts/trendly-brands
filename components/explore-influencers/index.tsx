import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { User } from "@/types/User";
import { useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions } from "react-native";
import CollaborationFilter from "../FilterModal";
// import InfluencerCard from "../InfluencerCard";
import { View } from "../theme/Themed";


import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import {
  BottomSheetBackdrop
} from "@gorhom/bottom-sheet";

import { MAX_WIDTH_WEB } from "@/constants/Container";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useInfiniteIdScroll } from "@/shared-libs/utils/infinite-id-scroll";
import { APPROX_CARD_HEIGHT } from "@/shared-uis/components/carousel/carousel-util";
import InfluencerCard from "@/shared-uis/components/InfluencerCard";
import { CarouselInViewProvider } from "@/shared-uis/components/scroller/CarouselInViewContext";
import CarouselScroller from "@/shared-uis/components/scroller/CarouselScroller";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { collection, query } from "firebase/firestore";
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

  const { manager } = useAuthContext()
  const theme = useTheme();
  const { selectedBrand } = useBrandContext()
  const preferences = selectedBrand?.preferences || {}

  const { xl } = useBreakpoints();

  const [influencerIds, setInfluencerIds] = useState<string[]>([])

  const influencersRef = collection(FirestoreDB, "users");
  const q = query(
    influencersRef,
  );

  useEffect(() => {
    if (!selectedBrand)
      return;
    HttpWrapper.fetch(`/api/v1/influencers?brandId=${selectedBrand?.id}`, {
      method: "GET",
    }).then(async (res) => {
      const body = await res.json()
      setInfluencerIds(body.data as string[])
    }).catch(e => {
      Toaster.error("Cant fetch Influencers")
    })
  }, [selectedBrand])

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

  const width = Math.min(MAX_WIDTH_WEB, Dimensions.get('window').width);
  const height = Math.min(APPROX_CARD_HEIGHT, Dimensions.get('window').height);

  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
          marginHorizontal: "auto",
          width: "100%", //xl ? MAX_WIDTH_WEB :
        }}
      >
        <View style={{ alignSelf: "stretch" }}>
          <CarouselInViewProvider>
            <CarouselScroller
              data={filteredInfluencers}
              renderItem={({ item, index }) => (
                <InfluencerCard
                  xl={xl}
                  key={item.id}
                  type="explore"
                  ToggleModal={ToggleModal}
                  influencer={item}
                  setSelectedInfluencer={setSelectedInfluencer as any}
                  openProfile={(item) => {
                    if (item)
                      setSelectedInfluencer(item as User);
                    setOpenProfileModal(true)
                  }}
                />
              )}
              objectKey='id'
              vertical={false}
              width={width} // Default width if not provided
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
          FireStoreDB={FirestoreDB}
          isBrandsApp={true}
          closeModal={() => setOpenProfileModal(false)}
        />
      </BottomSheetScrollContainer>
    </AppLayout>
  );
};

export default ExploreInfluencers;
