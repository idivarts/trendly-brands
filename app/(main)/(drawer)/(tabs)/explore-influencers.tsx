import ExploreInfluencers from "@/components/explore-influencers";
import RightPanel from "@/components/explore-influencers/RightPanel";
import { View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native-paper";

const ExploreInfluencersScreen = () => {
  const { manager } = useAuthContext()
  const { selectedBrand } = useBrandContext()
  const preferences = selectedBrand?.preferences
  const [connectedInfluencer, setConnectedInfluencer] = useState(false)

  const { xl } = useBreakpoints()

  const [fullIllustration, setFullIllustration] = useState(true)
  useEffect(() => {
    if (!selectedBrand)
      return;
    (async () => {
      const x = await PersistentStorage.get(selectedBrand.id + "-explore")
      setFullIllustration(!x)
    })()
  }, [selectedBrand])

  // if (fullIllustration)
  //   return <FullInformationalIllustration action={() => {
  //     PersistentStorage.set(selectedBrand?.id + "-explore", "true")
  //     setFullIllustration(false)
  //   }} config={{
  //     kicker: "Our Micro Creators",
  //     title: "Showcasing {Trendly's Verified} Influencers!",
  //     description: "This will help you to find influencers that are already registered on trendly and hence verified from our end. This poses the least risk as we have strong control over these influencers",
  //     action: "Explore Now"
  //   }} videoUrl="https://www.youtube.com/embed/oqYLHTnszIg?si=NTYuarzgkbLEPhTO" />

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
