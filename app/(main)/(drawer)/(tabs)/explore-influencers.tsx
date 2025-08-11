import ExploreInfluencers from "@/components/explore-influencers";
import RightPanel from "@/components/explore-influencers/RightPanel";
import { View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import React from "react";
import { ActivityIndicator } from "react-native-paper";

const ExploreInfluencersScreen = () => {
  const { manager } = useAuthContext()
  const { selectedBrand } = useBrandContext()
  const preferences = selectedBrand?.preferences

  const { xl } = useBreakpoints()

  if (!manager && !preferences)
    return <ActivityIndicator />

  if (xl) {
    return (
      <View style={{ width: "100%", flexDirection: "row", gap: 24, height: "100%" }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ExploreInfluencers />
        </View>
        <View style={{ width: 350 }} >
          <RightPanel />
        </View>
      </View>
    );
  }

  return <ExploreInfluencers />
};

export default ExploreInfluencersScreen;
