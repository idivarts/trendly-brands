import React, { useState } from "react";
import { View, ScrollView, Dimensions } from "react-native";
import { useDiscovery } from "@/app/(main)/(drawer)/(tabs)/discover";
import EmptyState from "@/components/ui/empty-state";
import SlowLoader from "@/shared-uis/components/SlowLoader";
import { useInfluencers } from "@/hooks/request";
import { useBreakpoints } from "@/hooks";
import { useTheme } from "@react-navigation/native";
import Colors from "@/constants/Colors";
import { stylesFn } from "@/styles/collaboration-details/CollaborationDetails.styles";
import InvitationStatusCard from "@/components/explore-influencers/InvitationStatusCard";
import { MAX_WIDTH_WEB } from "@/shared-uis/components/carousel/carousel-util";
import { useCollapseContext } from "@/contexts/CollapseContext";

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

  if (influencers.length === 0 && isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
        }}
      >
        <SlowLoader />
      </View>
    );
  }

  if (influencers.length === 0) {
    return (
      <EmptyState
        subtitle="No invited members found."
        image={require("@/assets/images/illustration5.png")}
        hideAction
      />
    );
  }

  const width = Math.min(MAX_WIDTH_WEB, Dimensions.get("window").width);
  const cardWidth = isCollapsed ? width + 12 : Math.floor(width / 2) + 120;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: isCollapsed ? "flex-start" : "flex-start",
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 24,
        gap: 8,
      }}
      showsVerticalScrollIndicator={true}
    >
      {influencers.map((inf, index) => (
        <View
          key={inf.id || index}
          style={{
            width: cardWidth,
            padding: 12,
          }}
        >
          <InvitationStatusCard
            item={{
              userId: inf.id,
              fullname: inf.name || "Unknown",
              username: inf.profile?.content?.socialMediaHighlight || "",
              picture: inf.profileImage || "",
              followers: (inf as any)?.profile?.stats?.followers || 0,
              engagements: (inf as any)?.profile?.stats?.engagements || 0,
              views: (inf as any)?.profile?.stats?.views || 0,
            }}
            status={getRandomStatus()}
            timeAgo={getRandomTime()}
            flag="By Discovery"
          />
          <InvitationStatusCard
            item={{
              userId: inf.id,
              fullname: inf.name || "Unknown",
              username: inf.profile?.content?.socialMediaHighlight || "",
              picture: inf.profileImage || "",
              followers: (inf as any)?.profile?.stats?.followers || 0,
              engagements: (inf as any)?.profile?.stats?.engagements || 0,
              views: (inf as any)?.profile?.stats?.views || 0,
            }}
            status={getRandomStatus()}
            timeAgo={getRandomTime()}
            flag="By Spotlight"
          />
        </View>
      ))}
    </ScrollView>
  );
};

export default InvitedMemberTabContent;
