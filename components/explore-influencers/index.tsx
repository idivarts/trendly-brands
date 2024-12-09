import { ActivityIndicator, FlatList } from "react-native";
import InfluencerCard from "../InfluencerCard";
import { View } from "../theme/Themed";
import AppLayout from "@/layouts/app-layout";
import SearchComponent from "../SearchComponent";
import { useEffect, useMemo, useRef, useState } from "react";
import CollaborationFilter from "../FilterModal";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { useBreakpoints } from "@/hooks";
import { User } from "@/types/User";

import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";

import { FirestoreDB } from "@/utils/firestore";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import BottomSheetContainer from "../ui/bottom-sheet/BottomSheet";
import { List } from "react-native-paper";

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
  const [selectedInfluencer, setSelectedInfluencer] = useState<User | null>(null);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  const [isLoading, setIsLoading] = useState(true);

  const theme = useTheme();

  const {
    xl,
  } = useBreakpoints();

  useEffect(() => {
    setIsLoading(true);
    const influencersRef = collection(FirestoreDB, "users");
    const q = query(influencersRef, where("profile.completionPercentage", ">=", 60));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedInfluencers: User[] = [];
      querySnapshot.forEach((doc) => {
        fetchedInfluencers.push({
          ...doc.data(),
          id: doc.id,
        } as User);
      });

      setInfluencers(fetchedInfluencers);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filterInfluencers = () => {
    const newFilteredInfluencers = influencers.filter((influencer) => {
      const isCollaborationTypeMatch =
        currentCollaborationType === "All" ||
        influencer.profile?.category?.includes(currentCollaborationType);

      // const isFollowersRangeMatch =
      //   Number(influencer.backend?.followers) >= currentFollowersRange[0] &&
      //   Number(influencer.backend?.followers) <= currentFollowersRange[1];
      // const isReachRangeMatch =
      //   Number(influencer.backend?.reach) >= currentReachRange[0] &&
      //   Number(influencer.backend?.reach) <= currentReachRange[1];
      // const isEngagementRangeMatch =
      //   Number(influencer.backend?.engagement) >= currentEngagementRange[0] &&
      //   Number(influencer.backend?.engagement) <= currentEngagementRange[1];

      const isSearchQueryMatch = influencer.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return (
        isCollaborationTypeMatch &&
        // isFollowersRangeMatch &&
        // isReachRangeMatch &&
        // isEngagementRangeMatch &&
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

  if (isLoading) {
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
      <FlatList
        data={filteredInfluencers}
        renderItem={({ item, index }) => (
          <InfluencerCard
            key={index}
            type="explore"
            ToggleModal={ToggleModal}
            influencer={item}
            openProfile={(influencer) => {
              setSelectedInfluencer(influencer);
              bottomSheetModalRef.current?.present();
            }}
            setSelectedInfluencer={setSelectedInfluencer}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 16,
        }}
        ItemSeparatorComponent={
          () => (
            <View
              style={{
                height: 16,
                backgroundColor: theme.dark ? Colors(theme).background : Colors(theme).aliceBlue,
              }}
            />
          )
        }
        ListHeaderComponent={
          <View
            style={{
              paddingHorizontal: xl ? 0 : 16,
              paddingBottom: theme.dark ? 16 : 0,
            }}
          >
            <SearchComponent
              setSearchQuery={setSearchQuery}
              ToggleModal={() => setIsFilterModalVisible(true)}
            />
          </View>
        }
        style={{
          width: xl ? 768 : '100%',
          marginHorizontal: "auto",
        }}
      />

      {
        isModalVisible && (
          <BottomSheetContainer
            isVisible={isModalVisible}
            snapPointsRange={["25%", "50%"]}
            onClose={ToggleModal}
          >
            <List.Section style={{ paddingBottom: 28 }}>
              <List.Item
                title="View Profile"
                onPress={() => {
                  bottomSheetModalRef.current?.present();
                  ToggleModal();
                }}
              />
              <List.Item
                title="Send Message"
                onPress={() => null}
              />
              <List.Item
                title="Block Influencer"
                onPress={() => null}
              />
            </List.Section>
          </BottomSheetContainer>
        )
      }

      {
        isFilterModalVisible && (
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
        )
      }

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={2}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
      >
        <BottomSheetScrollView>
          <ProfileBottomSheet
            influencer={selectedInfluencer as User}
            theme={theme}
            isBrandsApp={true}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </AppLayout>
  );
};

export default ExploreInfluencers;
