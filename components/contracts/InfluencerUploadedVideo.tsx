import type { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import VideoPlayer from "@/components/landing/VideoPlayer";
import { Text } from "../theme/Themed";

export interface InfluencerUploadedVideoProps {
    contract: IContracts;
}

const InfluencerUploadedVideo: React.FC<InfluencerUploadedVideoProps> = ({ contract }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const links = contract.deliverable?.deliverableLinks ?? [];
    const firstLink = links[0];

    if (links.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.title}>Uploaded video</Text>
                <Text style={styles.emptyText}>No video uploaded yet.</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <Text style={styles.title}>Uploaded video by influencer</Text>
            {firstLink ? (
                <View style={styles.videoWrap}>
                    {Platform.OS === "web" ? (
                        <VideoPlayer videoLink={firstLink} />
                    ) : (
                        <Pressable
                            style={styles.nativeVideoCard}
                            onPress={() => firstLink && Linking.openURL(firstLink)}
                        >
                            <Text style={styles.nativeVideoLabel}>Tap to view video</Text>
                            <Text style={styles.nativeVideoUrl} numberOfLines={1}>
                                {firstLink}
                            </Text>
                        </Pressable>
                    )}
                </View>
            ) : null}
            {links.length > 1 ? (
                <Text style={styles.moreLinks}>
                    +{links.length - 1} more link{links.length > 2 ? "s" : ""}
                </Text>
            ) : null}
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        card: {
            width: "100%",
            padding: 16,
            borderRadius: 8,
            backgroundColor: colors.tag ?? "rgba(0,0,0,0.06)",
            borderWidth: 1,
            borderColor: colors.budgetCardBorder ?? "rgba(0,0,0,0.08)",
        },
        title: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 12,
        },
        emptyText: {
            fontSize: 14,
            color: colors.gray300,
        },
        videoWrap: {
            width: "100%",
            marginBottom: 8,
        },
        nativeVideoCard: {
            padding: 20,
            borderRadius: 8,
            backgroundColor: colors.surface ?? colors.background,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 120,
        },
        nativeVideoLabel: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.primary,
            marginBottom: 8,
        },
        nativeVideoUrl: {
            fontSize: 12,
            color: colors.gray300,
        },
        moreLinks: {
            fontSize: 12,
            color: colors.gray300,
        },
    });
}

export default InfluencerUploadedVideo;
