import { useSidebarCollapsed } from "@/components/drawer-layout/sidebar-collapsed-context";
import { Text, View } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { faChevronRight, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Theme, useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, View as RNView, StyleSheet } from "react-native";

type Variant = "expanded" | "rail";

/**
 * The "Influencer Led Growth" trigger. In the expanded drawer it renders as a
 * labelled row; in the collapsed rail it renders as an icon button with a hover
 * tooltip. Pressing it opens the segmented sub-drawer
 * (see InfluencerLedGrowthSubDrawer).
 */
const InfluencerLedGrowth: React.FC<{ variant: Variant }> = ({ variant }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { subDrawerKind, openSubDrawer, toggleSubDrawer } = useSidebarCollapsed();
    const isActive = subDrawerKind === "ilg";
    const [hovered, setHovered] = useState(false);

    const drawerColors = useMemo(
        () =>
            theme.dark
                ? {
                    inactiveColor: (colors as any).drawerTextMuted ?? colors.text,
                    activeColor: colors.drawerText,
                }
                : {
                    inactiveColor: (colors as any).drawerTextMuted ?? "#506878",
                    activeColor: colors.primary,
                },
        [theme.dark, colors.primary, colors.drawerText, (colors as any).drawerTextMuted]
    );

    if (variant === "rail") {
        return (
            <Pressable
                onPress={() => {
                    toggleSubDrawer("ilg");
                    if (!isActive) router.push("/discover");
                }}
                onHoverIn={() => setHovered(true)}
                onHoverOut={() => setHovered(false)}
                style={styles.railTriggerWrapper}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel="Influencer Led Growth"
            >
                <RNView
                    style={[
                        styles.railTriggerInner,
                        (isActive || hovered) && styles.railTriggerActive,
                    ]}
                >
                    <FontAwesomeIcon
                        icon={faUsers}
                        size={18}
                        color={isActive ? drawerColors.activeColor : drawerColors.inactiveColor}
                    />
                </RNView>
                {hovered && !isActive && (
                    <RNView style={styles.railTooltip} pointerEvents="none">
                        <Text style={styles.railTooltipText} numberOfLines={1}>
                            Influencer Led Growth
                        </Text>
                    </RNView>
                )}
            </Pressable>
        );
    }

    // Expanded row
    return (
        <Pressable
            onPress={() => {
                openSubDrawer("ilg");
                router.push("/discover");
            }}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={[styles.row, hovered && styles.rowHover]}
            accessibilityRole="button"
            accessibilityLabel="Open Influencer Led Growth"
        >
            <View style={styles.rowInner}>
                <FontAwesomeIcon
                    icon={faUsers}
                    size={16}
                    color={hovered ? drawerColors.activeColor : drawerColors.inactiveColor}
                />
                <Text
                    style={[
                        styles.label,
                        { color: hovered ? drawerColors.activeColor : drawerColors.inactiveColor },
                    ]}
                    numberOfLines={1}
                >
                    Influencer Led Growth
                </Text>
                <FontAwesomeIcon icon={faChevronRight} size={12} color={drawerColors.inactiveColor} />
            </View>
        </Pressable>
    );
};

const createStyles = (theme: Theme) => {
    return StyleSheet.create({
        // ── Expanded row ───────────────────────────────────────────────────
        row: {
            marginHorizontal: 8,
            marginVertical: 2,
            borderRadius: 10,
            overflow: "hidden",
        },
        rowHover: {
            backgroundColor: theme.dark
                ? "rgba(83, 139, 166, 0.10)"
                : "rgba(5, 68, 99, 0.05)",
        },
        rowInner: {
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: "transparent",
        },
        label: {
            fontSize: 14,
            flex: 1,
            fontWeight: "500",
        },
        // ── Collapsed rail icon ─────────────────────────────────────────────
        railTriggerWrapper: {
            marginHorizontal: 4,
            marginVertical: 2,
            borderRadius: 10,
            alignItems: "center",
            position: "relative",
            overflow: "visible",
        },
        railTriggerInner: {
            width: 48,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
        },
        railTriggerActive: {
            backgroundColor: theme.dark
                ? "rgba(83, 139, 166, 0.18)"
                : "rgba(5, 68, 99, 0.10)",
        },
        railTooltip: {
            position: "absolute",
            left: 52,
            top: 0,
            bottom: 0,
            justifyContent: "center",
            backgroundColor: "rgba(5, 68, 99, 0.95)",
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            zIndex: 99999,
            ...Platform.select({
                web: {
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                } as any,
            }),
        },
        railTooltipText: {
            color: "#ffffff",
            fontSize: 13,
            fontWeight: "500",
        },
    });
};

export default InfluencerLedGrowth;
