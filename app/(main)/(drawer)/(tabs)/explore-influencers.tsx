import ExploreInfluencers from "@/components/explore-influencers";
import RightPanel from "@/components/explore-influencers/RightPanel";
import FullInformationalIllustration from "@/components/FullScreenIllustration";
import { View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import React, { useState } from "react";
import { ActivityIndicator } from "react-native-paper";

const ExploreInfluencersScreen = () => {
  const { manager } = useAuthContext()
  const { selectedBrand } = useBrandContext()
  const preferences = selectedBrand?.preferences
  const [connectedInfluencer, setConnectedInfluencer] = useState(false)

  const { xl } = useBreakpoints()

  const b = true;
  if (b)
    return <FullInformationalIllustration />

  if (!manager && !preferences)
    return <ActivityIndicator />

  if (xl) {
    return (
      <View style={{ width: "100%", flexDirection: "row", gap: 24, height: "100%" }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ExploreInfluencers key={connectedInfluencer ? "connected" : "explore"} connectedInfluencers={connectedInfluencer} />
        </View>
        <View style={{ width: 350 }} >
          <RightPanel connectedInfluencers={connectedInfluencer} setConnectedInfluencers={setConnectedInfluencer} />
        </View>
      </View>
    );
  }

  return <ExploreInfluencers />
};

export default ExploreInfluencersScreen;
