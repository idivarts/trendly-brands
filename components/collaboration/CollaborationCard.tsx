import Colors from "@/constants/Colors";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { stylesFn } from "@/styles/CollaborationCard.styles";
import { formatTimeToNow } from "@/utils/date";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { Card, Text } from "react-native-paper";
import Tag from "../ui/tag";

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
    const theme = useTheme();
    const styles = stylesFn(theme);

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
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                        }}
                    >
                        <Pressable
                            onPress={() => {
                                props.onOpenBottomSheet(props.id);
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faEllipsis}
                                size={24}
                                color={Colors(theme).text}
                            />
                        </Pressable>
                    </View>
                </View>

                {/* Posted Date and Cost */}
                <View style={styles.infoRow}>
                    <Text style={styles.infoText}>
                        Posted: {formatTimeToNow(props.timeStamp)}
                    </Text>
                </View>

                {/* Payment Verified, Promotion and Collaboration Type */}
                <View style={styles.chipRow}>
                    <Tag>
                        Applied: {props.applications}
                    </Tag>
                    <Tag>
                        Invited: {props.invitations}
                    </Tag>
                    <Tag>
                        Shortlisted: {props.acceptedApplications}
                    </Tag>
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
