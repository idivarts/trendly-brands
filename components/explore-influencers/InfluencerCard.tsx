import InviteToCampaignButton from "@/components/collaboration/InviteToCampaignButton";
import { FacebookImageComponent } from "@/shared-uis/components/image-component";
import { Stars, qualityScoreToStars } from "@/shared-uis/components/rating-section";
import Colors from "@/shared-uis/constants/Colors";
import { getPlaceholderImageForGender } from "@/shared-uis/utils/url";
import { maskHandle } from "@/shared-uis/utils/masks";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, Checkbox } from "react-native-paper";
import type { InfluencerItem } from "../discover/discover-types";

export interface InfluencerCardProps {
    item: InfluencerItem;
    onPress?: () => void;
    openModal?: any;
    isCollapsed?: boolean;
    collaborations?: any[];
    isSelected?: boolean;
    onToggleSelect?: () => void;
    isStatusCard?: boolean;
}

const formatNumber = (n: number | undefined) => {
    if (n == null) return "-";
    if (n < 100) return String(n.toFixed(2));
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${Math.round(n / 100) / 10}k`;
    if (n < 1_000_000_000) return `${Math.round(n / 100_000) / 10}M`;
    return `${Math.round(n / 100_000_000) / 10}B`;
};

const getStatusKind = (status?: string) => {
    if (status === "accepted") return "accepted";
    if (status === "denied") return "denied";
    return "pending";
};

const Avatar = ({
    item,
    parentWidth,
    isCollapsed,
}: {
    item: InfluencerItem;
    parentWidth: number;
    isCollapsed?: boolean;
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useAvatarStyles(colors), [colors]);

    // Scale avatar relative to measured parent width when available,
    // otherwise use a sensible fallback so layout doesn't break.
    const baseAvatarScale = 0.28;
    const fallbackSize = isCollapsed ? 88 : 64;
    const avatarSize =
        parentWidth && parentWidth > 0
            ? Math.max(40, parentWidth * baseAvatarScale * (isCollapsed ? 1.1 : 1))
            : fallbackSize;
    const avatarContainerDynamicStyle = useMemo(
        () => ({
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderWidth: isCollapsed ? 4 : 3,
        }),
        [avatarSize, isCollapsed],
    );
    const avatarImageDynamicStyle = useMemo(
        () => ({
            borderRadius: avatarSize / 2,
        }),
        [avatarSize],
    );

    return (
        <View style={[styles.avatarContainer, avatarContainerDynamicStyle]}>
            <FacebookImageComponent
                url={item.profile_pic}
                altText="Issue Loading image"
                placeholder={getPlaceholderImageForGender(item.gender)}
                style={[styles.avatarImage, avatarImageDynamicStyle]}
            />
        </View>
    );
};

const SelectCheckbox = ({
    checked,
    onToggle,
    color,
}: {
    checked: boolean;
    onToggle: () => void;
    color: string;
}) => {
    return (
        <Checkbox.Android
            status={checked ? "checked" : "unchecked"}
            onPress={onToggle}
            color={color}
        />
    );
};

const NameSection = ({
    item,
    isCollapsed,
    isStatusCard,
    openModal,
}: {
    item: InfluencerItem;
    isCollapsed?: boolean;
    isStatusCard?: boolean;
    openModal?: any;
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useNameSectionStyles(colors), [colors]);
    const statusKind = getStatusKind(item.status);

    return (
        <View style={[styles.nameSection, isCollapsed ? styles.nameSectionCollapsed : null]}>
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.nameText, isCollapsed ? styles.nameTextCollapsed : null]}
            >
                {item.name}
            </Text>

            <Text
                numberOfLines={1}
                style={[styles.handleText, isCollapsed ? styles.handleTextCollapsed : null]}
            >
                @{maskHandle(item.username)}
            </Text>

            {typeof item.quality_score === "number" && item.quality_score > 0 && (
                <View style={styles.ratingRow}>
                    <Stars rating={qualityScoreToStars(item.quality_score)} size={isCollapsed ? 14 : 12} />
                    <Text style={[styles.ratingText, isCollapsed ? styles.ratingTextCollapsed : null]}>
                        {qualityScoreToStars(item.quality_score).toFixed(1)}
                    </Text>
                </View>
            )}

            <View style={[styles.actionContainer, isCollapsed ? styles.actionContainerCollapsed : null]}>
                {isStatusCard ? (
                    <View
                        style={[
                            styles.statusBadge,
                            statusKind === "accepted"
                                ? styles.statusBadgeAccepted
                                : statusKind === "denied"
                                    ? styles.statusBadgeDenied
                                    : styles.statusBadgePending,
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusText,
                                statusKind === "accepted"
                                    ? styles.statusTextAccepted
                                    : statusKind === "denied"
                                        ? styles.statusTextDenied
                                        : styles.statusTextPending,
                            ]}
                        >
                            {item.status
                                ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
                                : "Pending"}
                        </Text>
                    </View>
                ) : (
                    <InviteToCampaignButton label="Invite Now" openModal={openModal} influencerIds={[item.id]} influencerName={item.name} />
                )}
            </View>
        </View>
    );
};

const StatsSection = ({
    item,
    isCollapsed,
}: {
    item: InfluencerItem;
    isCollapsed?: boolean;
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStatsStyles(colors), [colors]);

    return (
        <View style={[styles.statsContainer, isCollapsed ? styles.statsContainerCollapsed : null]}>
            <View style={styles.statItem}>
                <Text style={[styles.statValue, isCollapsed ? styles.statValueCollapsed : null]}>{formatNumber(item.follower_count)}</Text>
                <Text style={[styles.statLabel, isCollapsed ? styles.statLabelCollapsed : null]}>Followers</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.statItem}>
                <Text style={[styles.statValue, isCollapsed ? styles.statValueCollapsed : null]}>{formatNumber(item.engagement_count)}</Text>
                <Text style={[styles.statLabel, isCollapsed ? styles.statLabelCollapsed : null]}>Engagements</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.statItem}>
                <Text style={[styles.statValue, isCollapsed ? styles.statValueCollapsed : null]}>{formatNumber(item.views_count)}</Text>
                <Text style={[styles.statLabel, isCollapsed ? styles.statLabelCollapsed : null]}>Views</Text>
            </View>
        </View>
    );
};

const InfluencerCard: React.FC<InfluencerCardProps> = ({
    item,
    onPress,
    isCollapsed,
    isSelected,
    onToggleSelect,
    isStatusCard,
    openModal,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const [parentWidth, setParentWidth] = useState(0);

    const formatTimeAgo = (timestampMs?: number) => {
        if (!timestampMs) {
            const times = ["1 hour ago", "2 days ago", "1 week ago", "3 months ago"];
            return times[Math.floor(Math.random() * times.length)];
        }
        const seconds = Math.floor((Date.now() - timestampMs) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks}w ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;
        const years = Math.floor(days / 365);
        return `${years}y ago`;
    };

    const TimeAgo = formatTimeAgo(item.invitedAt);
    const noop = () => { };

    return (
        <LinearGradient
            colors={[colors.influencerCardGradientStart, colors.influencerCardGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
                styles.CardLayoutWrapper,
                isCollapsed ? styles.CardLayoutWrapperCollapsed : null,
            ]}
            onLayout={(e) => {
                const layoutWidth = e.nativeEvent.layout.width;
                if (layoutWidth > 0 && layoutWidth !== parentWidth) {
                    setParentWidth(layoutWidth);
                }
            }}
        >
            <Card
                style={[
                    styles.card,
                    isCollapsed ? styles.cardCollapsed : styles.cardExpanded,
                ]}
                onPress={onPress}
            >
                <Card.Content style={styles.cardContent}>
                    {/* Checkbox and ER */}
                    <View style={styles.CheckoutAndBookMarkContainer}>
                        {isStatusCard ? (
                            <View>
                                <Text style={styles.timeAgoText}>{TimeAgo}</Text>
                            </View>
                        ) : (
                            <View>
                                <SelectCheckbox
                                    checked={isSelected ?? false}
                                    onToggle={onToggleSelect ?? noop}
                                    color={colors.primary}
                                />
                            </View>
                        )}
                        <View>
                            <View style={styles.erTag}>
                                <View style={styles.erTagNotch} />
                                <Text style={styles.erText}>
                                    {`ER - ${item.engagement_rate?.toFixed(2)}%`}
                                </Text>
                            </View>
                        </View>
                    </View>
                    {/* Avatar and Details */}
                    <View style={[styles.avatarDetailsRow, isCollapsed ? styles.avatarDetailsRowCollapsed : null]}>
                        <Avatar
                            item={item}
                            parentWidth={parentWidth}
                            isCollapsed={isCollapsed}
                        />
                        <NameSection
                            item={item}
                            isCollapsed={isCollapsed}
                            isStatusCard={isStatusCard}
                            openModal={openModal}
                        />
                    </View>

                    <StatsSection item={item} isCollapsed={isCollapsed} />
                </Card.Content>
            </Card>
            {item.isDiscover && (
                <View style={[styles.CategoryTag]}>
                    <Text style={styles.CategoryText}>By Discovery</Text>
                </View>
            )}
        </LinearGradient>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        CardLayoutWrapper: {
            width: "100%",
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            borderRadius: 16,
        },
        CardLayoutWrapperCollapsed: {
            alignSelf: "center",
        },
        card: {
            borderRadius: 16,
            overflow: "hidden",
            width: "100%",
            height: "auto",
            backgroundColor: colors.transparent,
        },
        cardExpanded: {
            minHeight: 252,
        },
        cardCollapsed: {
            minHeight: 296,
        },
        cardContent: {
            paddingRight: 0,
        },
        timeAgoText: {
            color: colors.textSecondary,
            fontSize: 12,
        },
        CheckoutAndBookMarkContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        erTag: {
            backgroundColor: colors.primary,
            padding: 8,
            width: 108,
            alignItems: "flex-end",
        },
        erTagNotch: {
            backgroundColor: colors.influencerCardGradientStart,
            height: 24,
            width: 24,
            position: "absolute",
            transform: [{ rotate: "45deg" }],
            left: -12,
            top: 5,
        },
        erText: {
            color: colors.onPrimary,
            fontSize: 14,
            fontWeight: "300",
        },
        avatarDetailsRow: {
            flexDirection: "row",
            columnGap: 20,
            alignItems: "center",
        },
        avatarDetailsRowCollapsed: {
            columnGap: 24,
        },
        CategoryTag: {
            backgroundColor: colors.primary,
            borderTopLeftRadius: 8,
            borderBottomRightRadius: 8,
            paddingVertical: 6,
            position: "absolute",
            right: 0,
            paddingRight: 12,
            paddingLeft: 8,
            bottom: 0,
        },
        CategoryText: {
            fontSize: 10,
            fontWeight: "200",
            color: colors.onPrimary,
            letterSpacing: 1.2,
        },
    });

const useAvatarStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        avatarContainer: {
            borderColor: colors.primary,
            overflow: "hidden",
            backgroundColor: colors.card,
        },
        avatarImage: {
            width: "100%",
            height: "100%",
        },
    });

const useNameSectionStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        nameSection: {
            marginTop: 10,
            maxWidth: "60%",
        },
        nameSectionCollapsed: {
            marginTop: 14,
        },
        nameText: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        nameTextCollapsed: {
            fontSize: 22,
        },
        handleText: {
            fontSize: 14,
            opacity: 0.7,
            marginTop: 2,
            fontWeight: "300",
            color: colors.text,
        },
        handleTextCollapsed: {
            fontSize: 16,
        },
        ratingRow: {
            flexDirection: "row",
            alignItems: "center",
            marginTop: 4,
            gap: 4,
        },
        ratingText: {
            fontSize: 10,
            color: colors.text,
            opacity: 0.6,
        },
        ratingTextCollapsed: {
            fontSize: 12,
        },
        actionContainer: {
            marginTop: 10,
        },
        actionContainerCollapsed: {
            marginTop: 14,
        },
        statusBadge: {
            backgroundColor: colors.tag,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            alignSelf: "flex-start",
            borderWidth: 1,
        },
        statusBadgeAccepted: {
            borderColor: colors.successForeground,
        },
        statusBadgeDenied: {
            borderColor: colors.red,
        },
        statusBadgePending: {
            borderColor: colors.yellow,
        },
        statusText: {
            fontWeight: "500",
        },
        statusTextAccepted: {
            color: colors.successForeground,
        },
        statusTextDenied: {
            color: colors.red,
        },
        statusTextPending: {
            color: colors.yellow,
        },
    });

const useStatsStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        statsContainer: {
            flexDirection: "row",
            justifyContent: "space-evenly",
            alignItems: "center",
            marginTop: 16,
            transform: [{ scale: 1 }],
        },
        statsContainerCollapsed: {
            marginTop: 20,
            transform: [{ scale: 1.08 }],
        },
        statItem: {
            alignItems: "center",
            flex: 1,
        },
        statValue: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
        },
        statValueCollapsed: {
            fontSize: 18,
        },
        statLabel: {
            fontSize: 10,
            opacity: 0.7,
            color: colors.textSecondary,
        },
        statLabelCollapsed: {
            fontSize: 11,
        },
        separator: {
            width: 1,
            height: "70%",
            backgroundColor: colors.outline,
        },
    });

export default InfluencerCard;
