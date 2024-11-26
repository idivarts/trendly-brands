import { FlatList } from "react-native";
import InfluencerCard from "../InfluencerCard";
import { View } from "../theme/Themed";
import AppLayout from "@/layouts/app-layout";
import SearchComponent from "../SearchComponent";
import { useState } from "react";
import BottomSheetActions from "../BottomSheetActions";
import { influencers } from "@/constants/Influencers";
import CollaborationFilter from "../FilterModal";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";

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
  const ToggleModal = () => setIsModalVisible(!isModalVisible);
  const theme = useTheme();

  const filteredInfluencers = influencers.filter((influencer) => {
    const isCollaborationTypeMatch =
      currentCollaborationType === "All" ||
      influencer.collaborationType === currentCollaborationType;

    const isFollowersRangeMatch =
      Number(influencer.followers) >= currentFollowersRange[0] &&
      Number(influencer.followers) <= currentFollowersRange[1];
    const isReachRangeMatch =
      Number(influencer.reach) >= currentReachRange[0] &&
      Number(influencer.reach) <= currentReachRange[1];
    const isEngagementRangeMatch =
      Number(influencer.engagement) >= currentEngagementRange[0] &&
      Number(influencer.engagement) <= currentEngagementRange[1];

    const isSearchQueryMatch = influencer.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return (
      isCollaborationTypeMatch &&
      isFollowersRangeMatch &&
      isReachRangeMatch &&
      isEngagementRangeMatch &&
      isSearchQueryMatch
    );
  });

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
              paddingHorizontal: 16,
            }}
          >
            <SearchComponent
              setSearchQuery={setSearchQuery}
              ToggleModal={() => setIsFilterModalVisible(true)}
            />
          </View>
        }
      />
      {isModalVisible && (
        <BottomSheetActions
          cardType="influencerCard"
          isVisible={isModalVisible}
          onClose={ToggleModal}
          snapPointsRange={["25%", "50%"]}
        />
      )}
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
    </AppLayout>
  );
};

export default ExploreInfluencers;
