import InviteToCampaignButton from "@/components/collaboration/InviteToCampaignButton";
import { FacebookImageComponent } from "@/shared-uis/components/image-component";
import Colors from "@/shared-uis/constants/Colors";
import { maskHandle } from "@/shared-uis/utils/masks";
import { useTheme } from "@react-navigation/native";
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

    // Scale avatar relative to measured parent width when available,
    // otherwise use a sensible fallback so layout doesn't break.
    const baseAvatarScale = 0.28;
    const fallbackSize = isCollapsed ? 88 : 64;
    const avatarSize =
        parentWidth && parentWidth > 0
            ? Math.max(40, parentWidth * baseAvatarScale * (isCollapsed ? 1.1 : 1))
            : fallbackSize;

    return (
        <View
            style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                borderWidth: isCollapsed ? 4 : 3,
                borderColor: colors.primary,
                overflow: "hidden",
                backgroundColor: colors.aliceBlue,
            }}
        >
            <FacebookImageComponent
                url={item.profile_pic}
                altText="Issue Loading image"
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: avatarSize / 2,
                }}
            />
        </View>
    );
};

const SelectCheckbox = ({
    checked,
    onToggle,
}: {
    checked: boolean;
    onToggle: () => void;
}) => {
    return (
        <Checkbox.Android
            status={checked ? "checked" : "unchecked"}
            onPress={onToggle}
            color="#1D425D"
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

    return (
        <View style={{ marginTop: isCollapsed ? 14 : 10, maxWidth: "60%" }}>
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                    fontSize: isCollapsed ? 22 : 18,
                    fontWeight: "700" as const,
                  color: colors.black,
                }}
            >
                {item.name}
            </Text>

            <Text
                numberOfLines={1}
                style={{
                    fontSize: isCollapsed ? 16 : 14,
                    opacity: 0.7,
                    marginTop: 2,
                    fontWeight: "300" as const,
                    color: colors.black,
                }}
            >
                @{maskHandle(item.username)}
            </Text>

            <View style={{ marginTop: isCollapsed ? 14 : 10 }}>
                {isStatusCard ? (
                    // show status badge when StatusCard is enabled
                    <View
                        style={{
                            backgroundColor:
                                item.status === "accepted"
                                    ? "#D1F7DC"
                                    : item.status === "denied"
                                        ? "#F7D7D7"
                                        : "#F2E6B5",
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                            alignSelf: "flex-start",
                        }}
                    >
                        <Text
                            style={{
                                color:
                                    item.status === "accepted"
                                        ? "#0B7A2A"
                                        : item.status === "denied"
                                            ? "#A92C2C"
                                            : "#333",
                                fontWeight: "500",
                            }}
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
    const scale = isCollapsed ? 1.08 : 1;

    const labelStyle = {
        fontSize: isCollapsed ? 11 : 10,
        opacity: 0.7,
    };

    const valueStyle = {
        fontSize: isCollapsed ? 18 : 16,
        fontWeight: "600" as const,
    };

    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "center",
                marginTop: isCollapsed ? 20 : 16,
                transform: [{ scale }],
            }}
        >
            <View style={{ alignItems: "center", flex: 1 }}>
                <Text style={valueStyle}>{formatNumber(item.follower_count)}</Text>
                <Text style={labelStyle}>Followers</Text>
            </View>

            <View style={{ width: 1, height: "70%", backgroundColor: "#CCC" }} />

            <View style={{ alignItems: "center", flex: 1 }}>
                <Text style={valueStyle}>{formatNumber(item.engagement_count)}</Text>
                <Text style={labelStyle}>Engagements</Text>
            </View>

            <View style={{ width: 1, height: "70%", backgroundColor: "#CCC" }} />

            <View style={{ alignItems: "center", flex: 1 }}>
                <Text style={valueStyle}>{formatNumber(item.views_count)}</Text>
                <Text style={labelStyle}>Views</Text>
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

    return (
        <View
            style={[
                styles.CardLayoutWrapper,
                { alignSelf: isCollapsed ? "center" : "auto" },
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
                    {
                        backgroundColor: colors.aliceBlue,
                        width: "100%",
                        minHeight: isCollapsed ? 296 : 252,
                        height: "auto",
                    },
                ]}
                onPress={onPress}
            >
                <Card.Content style={{ paddingRight: 0 }}>
                    {/* Checkbox and ER */}
                    <View style={styles.CheckoutAndBookMarkContainer}>
                        {isStatusCard ? (
                            <View>
                                <Text>{TimeAgo}</Text>
                            </View>
                        ) : (
                            <View>
                                <SelectCheckbox
                                    checked={isSelected ?? false}
                                    onToggle={onToggleSelect ?? (() => { })}
                                />
                            </View>
                        )}
                        <View>
                            <View
                                style={{
                                    backgroundColor: colors.primary,
                                    padding: 8,
                                    width: 108,
                                    alignItems: "flex-end",
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: Colors(theme).aliceBlue,
                                        height: 24,
                                        width: 24,
                                        position: "absolute",
                                        transform: [{ rotate: "45deg" }],
                                        left: -12,
                                        top: 5,
                                    }}
                                />
                                <Text
                                    style={{
                                        color: Colors(theme).white,
                                        fontSize: 14,
                                        fontWeight: "300",
                                    }}
                                >
                                    {`ER - ${item.engagement_rate?.toFixed(2)}%`}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Avatar and Details */}
                    <View
                        style={{
                            flexDirection: "row",
                            columnGap: isCollapsed ? 24 : 20,
                            alignItems: "center",
                        }}
                    >
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
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        CardLayoutWrapper: {
            width: "100%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            borderRadius: 16,
        },
        card: {
            borderRadius: 16,
            overflow: "hidden",
        },
        stat: { alignItems: "center" },
        CheckoutAndBookMarkContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
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
            color: colors.white,
            letterSpacing: 1.2,
        },
    });

export default InfluencerCard;
