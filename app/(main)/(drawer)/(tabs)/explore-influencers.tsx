import ExploreInfluencers from "@/components/explore-influencers";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import React from "react";
import { ActivityIndicator } from "react-native-paper";

const ExploreInfluencersScreen = () => {
  const { manager } = useAuthContext()
  const { selectedBrand } = useBrandContext()
  const preferences = selectedBrand?.preferences

  if (!manager && !preferences)
    return <ActivityIndicator />
  return <ExploreInfluencers />
};

export default ExploreInfluencersScreen;
