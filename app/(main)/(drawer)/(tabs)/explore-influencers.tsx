import ExploreInfluencers from "@/components/explore-influencers";
import { useAuthContext } from "@/contexts";
import React from "react";
import { ActivityIndicator } from "react-native-paper";

const ExploreInfluencersScreen = () => {
  const { manager } = useAuthContext()
  if (!manager)
    return <ActivityIndicator />
  return <ExploreInfluencers />
};

export default ExploreInfluencersScreen;
