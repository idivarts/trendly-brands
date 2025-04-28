import ExploreInfluencers from "@/components/explore-influencers";
import React from "react";
import { IOScrollView } from "react-native-intersection-observer";

const ExploreInfluencersScreen = () => {
  return <IOScrollView>
    <ExploreInfluencers />
  </IOScrollView>;
};

export default ExploreInfluencersScreen;
