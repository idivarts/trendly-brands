import { SidebarCollapsedContext, useSidebarCollapsed } from "@/components/drawer-layout/sidebar-collapsed-context";
import { Text, View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useBrandContext } from "@/contexts/brand-context.provider";
import Colors from "@/shared-uis/constants/Colors";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Theme, useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet } from "react-native";
import DrawerMenuItem from "../DrawerMenuItem";
import { INFLUENCER_LED_GROWTH_SEGMENTS } from "./menu-items";

// Kept in sync with SUB_DRAWER_WIDTH in DrawerMenuContentWeb.tsx and _layout.tsx
export const SUB_DRAWER_WIDTH = 248;

/**
 * The slide-out panel that sits beside the collapsed rail when "Influencer Led
 * Growth" is opened. Content is split into two segments — Discovery and
 * Execution. Reserves real layout width (it is NOT an overlay), so the page
 * content is pushed over rather than hidden underneath.
 */
const InfluencerLedGrowthSubDrawer: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(theme), [theme]);
    const sidebarCtx = useSidebarCollapsed();
    const { subDrawerKind, closeSubDrawer } = sidebarCtx;
    const isOpen = subDrawerKind === "ilg";
    const { selectedBrand, isIndiaBased } = useBrandContext();
    const { manager } = useAuthContext();
    const isChatConnected = !!manager?.isChatConnected;

    const planKey = selectedBrand?.billing?.planKey || "";
    const mutedColor = (colors as any).drawerTextMuted ?? (theme.dark ? colors.text : "#506878");

    // Close on Escape (web keyboard affordance).
    useEffect(() => {
        if (!isOpen || Platform.OS !== "web") return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeSubDrawer();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const segments = INFLUENCER_LED_GROWTH_SEGMENTS(theme, isChatConnected, isIndiaBased);

    return (
        <View style={styles.subDrawer}>
            <Pressable
                onPress={closeSubDrawer}
                style={styles.header}
                accessibilityRole="button"
                accessibilityLabel="Back to main menu"
            >
                <FontAwesomeIcon icon={faChevronLeft} size={14} color={mutedColor} />
                <Text style={styles.title} numberOfLines={1}>
                    Influencer Led Growth
                </Text>
            </Pressable>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Render items in expanded style even though the rail is collapsed */}
                <SidebarCollapsedContext.Provider
                    value={{ ...sidebarCtx, isCollapsed: false }}
                >
                    {segments.map((segment) => (
                        <View key={segment.title} style={styles.segment}>
                            <Text style={styles.segmentLabel}>{segment.title}</Text>
                            <View style={styles.segmentDivider} />
                            {segment.items.map((tab, idx) => (
                                <DrawerMenuItem
                                    key={`${segment.title}-${idx}`}
                                    tab={tab}
                                    proLock={!!(tab.pro && planKey !== "pro" && planKey !== "enterprise")}
                                />
                            ))}
                        </View>
                    ))}
                </SidebarCollapsedContext.Provider>
            </ScrollView>
        </View>
    );
};

const createStyles = (theme: Theme) => {
    const colors = Colors(theme);
    const sidebarSurfaceBg = (colors as any).drawerBackground ?? colors.card;
    const sectionLabelColor =
        (colors as any).drawerSectionLabel ??
        (theme.dark ? colors.textSecondary : (colors as any).drawerTextMuted ?? colors.textSecondary);
    const dividerColor = theme.dark
        ? "rgba(83, 139, 166, 0.12)"
        : "rgba(5, 68, 99, 0.08)";

    return StyleSheet.create({
        subDrawer: {
            // In-flow column beside the rail (NOT absolute) so it reserves real
            // layout width and the page content is pushed over.
            width: SUB_DRAWER_WIDTH,
            flexGrow: 0,
            flexShrink: 0,
            flexBasis: SUB_DRAWER_WIDTH,
            backgroundColor: sidebarSurfaceBg,
            paddingTop: Platform.OS === "web" ? 12 : 64,
            // Directional shadow toward the page content the panel sits against
            shadowColor: "#000",
            shadowOffset: { width: 8, height: 0 },
            shadowRadius: 18,
            shadowOpacity: 0.12,
            elevation: 16,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: "transparent",
        },
        title: {
            fontSize: 14,
            fontWeight: "700",
            letterSpacing: -0.2,
            flex: 1,
            color: theme.dark ? colors.drawerText : colors.primary,
        },
        scrollContent: {
            paddingTop: 4,
            paddingBottom: 16,
            gap: 0,
        },
        segment: {
            marginBottom: 8,
            backgroundColor: "transparent",
        },
        segmentLabel: {
            fontSize: 10,
            fontWeight: "700",
            paddingHorizontal: 14,
            paddingTop: 8,
            paddingBottom: 4,
            color: sectionLabelColor,
            textTransform: "uppercase" as const,
            letterSpacing: 0.9,
        },
        segmentDivider: {
            marginHorizontal: 8,
            borderTopColor: dividerColor,
            borderTopWidth: StyleSheet.hairlineWidth,
            marginBottom: 2,
        },
    });
};

export default InfluencerLedGrowthSubDrawer;
