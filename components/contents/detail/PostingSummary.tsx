import { ISocialAccount } from "@/contexts/brand-social-context.provider";
import {
    POPULAR_POSTING_TIMES,
    ScheduleMode,
    SocialDestination,
} from "@/components/contents/types";
import Colors from "@/shared-uis/constants/Colors";
import {
    faBolt,
    faCalendarDays,
    faPen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

// ─── PostingSummary ───────────────────────────────────────────────────────────
// Read-only recap of the destinations + schedule, shown above the content card
// once the user has configured where/when to post. Tapping Edit reopens the
// publish modal. Keeps the heavy controls off the page.

const PUBLISHABLE = new Set(["instagram", "facebook"]);

export interface PostingSummaryProps {
    socialAccounts: ISocialAccount[];
    destinations: SocialDestination[];
    scheduleMode: ScheduleMode;
    formattedDate: string;
    timeOfPosting: string;
    onEdit: () => void;
}

const PostingSummary: React.FC<PostingSummaryProps> = ({
    socialAccounts,
    destinations,
    scheduleMode,
    formattedDate,
    timeOfPosting,
    onEdit,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const accounts = useMemo(
        () => socialAccounts.filter((a) => PUBLISHABLE.has(a.platform)),
        [socialAccounts]
    );

    const selected = useMemo(
        () =>
            destinations
                .map((d) => accounts.find((a) => a.id === d.socialAccountId) ?? null)
                .filter(Boolean) as ISocialAccount[],
        [destinations, accounts]
    );

    const timeLabel = useMemo(() => {
        if (!timeOfPosting) return "default time";
        const popular = POPULAR_POSTING_TIMES.find((t) => t.value === timeOfPosting);
        return popular ? popular.label : timeOfPosting;
    }, [timeOfPosting]);

    const whenSummary =
        scheduleMode === "now" ? "Publish now" : `${formattedDate} · ${timeLabel}`;

    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.left}>
                    {/* Destinations */}
                    <View style={styles.destRow}>
                        {selected.map((a) => {
                            const dot =
                                a.platform === "instagram"
                                    ? colors.socialInstagram
                                    : colors.socialFacebook;
                            return (
                                <View key={a.id} style={styles.destChip}>
                                    {a.profileImageURL ? (
                                        <Image source={{ uri: a.profileImageURL }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatar, styles.avatarFallback]}>
                                            <Text style={styles.avatarInitial}>
                                                {(a.username || "?").charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={[styles.platformDot, { backgroundColor: dot }]} />
                                    <Text style={styles.destName} numberOfLines={1}>
                                        {a.username}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* When */}
                    <View style={styles.whenRow}>
                        <FontAwesomeIcon
                            icon={scheduleMode === "now" ? faBolt : faCalendarDays}
                            size={12}
                            color={colors.primary}
                        />
                        <Text style={styles.whenText}>{whenSummary}</Text>
                    </View>
                </View>

                <Pressable
                    style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
                    onPress={onEdit}
                    accessibilityRole="button"
                    accessibilityLabel="Edit destinations and schedule"
                >
                    <FontAwesomeIcon icon={faPen} size={11} color={colors.primary} />
                    <Text style={styles.editText}>Edit</Text>
                </Pressable>
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        card: {
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        left: {
            flex: 1,
            gap: 8,
        },
        destRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        destChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingLeft: 5,
            paddingRight: 11,
            paddingVertical: 5,
            borderRadius: 18,
            backgroundColor: colors.aliceBlue,
        },
        avatar: {
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: colors.card,
        },
        avatarFallback: {
            alignItems: "center",
            justifyContent: "center",
        },
        avatarInitial: {
            fontSize: 10,
            fontWeight: "800",
            color: colors.primary,
        },
        platformDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginLeft: -2,
        },
        destName: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.text,
            maxWidth: 140,
        },
        whenRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
        },
        whenText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.text,
        },
        editBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            minHeight: 36,
            paddingHorizontal: 12,
            borderRadius: 9,
            backgroundColor: colors.aliceBlue,
        },
        editText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.primary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default PostingSummary;
