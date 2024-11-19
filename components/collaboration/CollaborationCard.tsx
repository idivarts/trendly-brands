import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text, Card, Divider, Chip } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@react-navigation/native";
import { stylesFn } from "@/styles/CollaborationCard.styles";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { router } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import Colors from "@/constants/Colors";

export interface CollaborationAdCardProps extends ICollaboration {
  name: string;
  brandName: string;
  paymentVerified?: boolean;
  appliedCount?: number;
  aiSuccessRate?: string;
  id: string;
  brandHireRate?: string;
  cardType: "collaboration" | "proposal" | "invitation";
  acceptedApplications?: number;
  onOpenBottomSheet: (id: string) => void;
}

const JobCard = (props: CollaborationAdCardProps) => {
  const [bookmarked, setBookmarked] = useState(false);
  const theme = useTheme();
  const styles = stylesFn(theme);
  const datePosted = new Date(props.timeStamp);

  return (
    <Card
      style={styles.card}
      onPress={() => {
        router.push(`/collaboration-details/${props.id}`);
      }}
    >
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.collabName}>{props.name}</Text>
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                props.onOpenBottomSheet(props.id);
              }}
              style={{
                padding: 10,
              }}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={30}
                color={Colors(theme).platinum}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Short Description */}

        {/* Posted Date and Cost */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            Posted: {formatDistanceToNow(datePosted, { addSuffix: true })}
          </Text>
        </View>

        {/* Payment Verified, Promotion and Collaboration Type */}
        <View style={styles.chipRow}>
          {/* 
          show applied, invited and shortlisted chips
           */}
          <Chip mode="outlined">
            Applied: {props.applications}
          </Chip>
          <Chip mode="outlined">
            Invited: {props.invitations}
          </Chip>
          <Chip mode="outlined">
            Shortlisted: {props.acceptedApplications}
          </Chip>
        </View>

        {/* Influencers Needed, Applied Count, AI Success Rate, Brand Hire Rate */}
        {props.cardType === "collaboration" && (
          <View>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>
                Influencers Needed: {props.numberOfInfluencersNeeded}
              </Text>
              <Text style={styles.infoText}>
                Applied: {props.appliedCount || 0}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>
                AI Success Rate: {props.aiSuccessRate || 0}
              </Text>
              <Text style={styles.infoText}>
                Brand Hire Rate: {props.brandHireRate || 0}
              </Text>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

export default JobCard;
