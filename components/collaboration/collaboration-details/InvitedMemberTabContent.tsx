import InvitationStatusCard from "@/components/explore-influencers/InvitationStatusCard";
import EmptyState from "@/components/ui/empty-state";
import Colors from "@/constants/Colors";
import { useCollapseContext } from "@/contexts/CollapseContext";
import { useBreakpoints } from "@/hooks";
import { useInfluencers } from "@/hooks/request";
import { MAX_WIDTH_WEB } from "@/shared-uis/components/carousel/carousel-util";
import SlowLoader from "@/shared-uis/components/SlowLoader";
import { stylesFn } from "@/styles/collaboration-details/CollaborationDetails.styles";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Dimensions, ScrollView, View } from "react-native";
import Discover from "@/components/discover/Discover";

const InvitedMemberTabContent = (props: any) => {
  const theme = useTheme();
  const colors = Colors(theme);
  const styles = stylesFn(theme);

  const { isCollapsed, setIsCollapsed } = useCollapseContext();
  const collaborationId = props.pageID;
  const { influencers: rawInfluencers, isLoading } = useInfluencers({
    collaborationId,
  });

  const { xl } = useBreakpoints();

  // Mock status and time for demonstration — replace this with actual data later
  const getRandomStatus = () => {
    const statuses: ("Accepted" | "Denied" | "Waiting")[] = [
      "Accepted",
      "Denied",
      "Waiting",
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getRandomTime = () => {
    const times = ["1 hour ago", "2 days ago", "1 week ago", "3 months ago"];
    return times[Math.floor(Math.random() * times.length)];
  };

  const influencers = rawInfluencers || [];

  // if (influencers.length === 0 && isLoading) {
  //   return (
  //     <View
  //       style={{
  //         flex: 1,
  //         justifyContent: "center",
  //         alignItems: "center",
  //         gap: 40,
  //       }}
  //     >
  //       <SlowLoader />
  //     </View>
  //   );
  // }

  if (influencers.length === 0 && !isLoading) {
    return (
      <EmptyState
        subtitle="No invited members found."
        image={require("@/assets/images/illustration5.png")}
        hideAction
      />
    );
  }

  const width = Math.min(MAX_WIDTH_WEB, Dimensions.get("window").width);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: isCollapsed ? "flex-start" : "flex-start",
        paddingTop: 12,
        paddingBottom: 24,
        gap: isCollapsed ? 20 : 8,
        paddingRight: isCollapsed ? 120 : 16,
        paddingLeft: isCollapsed ? 120 : 4,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Discover
        showRightPanel={false}
        showTopPanel={true}
        advanceFilter={false}
        statusFilter={true}
        StatusCard={true}
      />
    </ScrollView>
  );
};

export default InvitedMemberTabContent;
