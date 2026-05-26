import Colors from "@/shared-uis/constants/Colors";
import { useChatContext } from "@/contexts";
import { useDrawerColors } from "@/components/drawer-layout/drawer-colors-context";
import { useSidebarCollapsed } from "@/components/drawer-layout/sidebar-collapsed-context";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Href, usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, View as RNView } from "react-native";
import { Badge } from "react-native-paper";
import { Text, View } from "../theme/Themed";

export interface IconPropFn {
    focused: boolean;
}

export type Tab = {
    href: Href;
    icon: (props: IconPropFn) => JSX.Element;
    label: string;
    showUnreadCount?: boolean;
    pro?: boolean;
};

type DrawerMenuItemProps = {
    tab: Tab;
    proLock?: boolean;
};

const DrawerMenuItem: React.FC<DrawerMenuItemProps> = ({ tab, proLock }) => {
    const router = useRouter();
    const pathname = usePathname();
    const theme = useTheme();
    const { unreadCount } = useChatContext();
    const drawerColors = useDrawerColors();
    const [hovered, setHovered] = useState(false);
    const { isCollapsed } = useSidebarCollapsed();

    // Avoid marking blank href items as active
    const isActive = !!tab.href && pathname.startsWith(tab.href.toString());
    const colorSet = Colors(theme);
    const inactiveBg = drawerColors?.inactiveBg ?? (drawerColors ? colorSet.drawerBackground : colorSet.background);
    const inactiveText = drawerColors ? drawerColors.inactiveColor : colorSet.text;
    const activeBg = (colorSet as any).drawerActiveBg ?? colorSet.primary;
    const activeBorderColor = (colorSet as any).drawerActiveBorder ?? colorSet.primary;
    const activeText = drawerColors ? drawerColors.activeColor : colorSet.onPrimary;
    const hoverBg = theme.dark
        ? "rgba(83, 139, 166, 0.10)"
        : "rgba(5, 68, 99, 0.05)";
    const hoverText = theme.dark
        ? (colorSet as any).drawerText ?? colorSet.text
        : drawerColors?.activeColor ?? colorSet.primary;

    // Collapsed mode: icon-only with hover tooltip
    if (isCollapsed) {
        return (
            <Pressable
                onPress={() => { if (tab.href) router.push(tab.href); }}
                onHoverIn={() => setHovered(true)}
                onHoverOut={() => setHovered(false)}
                android_ripple={{ color: colorSet.primary + "22" }}
                style={[
                    styles.wrapperCollapsed,
                    {
                        backgroundColor: isActive
                            ? activeBg
                            : hovered
                                ? hoverBg
                                : inactiveBg,
                        borderWidth: theme.dark ? (isActive ? 1 : hovered ? StyleSheet.hairlineWidth : 0) : 0,
                        borderColor: isActive ? activeBorderColor : colorSet.border,
                    },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
            >
                {isActive && !theme.dark && <RNView style={styles.activeAccentBar} />}
                <RNView style={styles.innerCollapsed}>
                    {tab.icon({ focused: isActive })}
                    {tab.showUnreadCount && unreadCount > 0 && (
                        <RNView style={styles.collapsedBadge}>
                            <Badge
                                visible={true}
                                size={8}
                                style={{ backgroundColor: colorSet.red }}
                            />
                        </RNView>
                    )}
                </RNView>
                {/* Tooltip rendered outside the icon, floating to the right */}
                {hovered && (
                    <RNView style={styles.tooltip} pointerEvents="none">
                        <Text style={styles.tooltipText} numberOfLines={1}>
                            {tab.label}
                        </Text>
                    </RNView>
                )}
            </Pressable>
        );
    }

    // Expanded mode (default)
    return (
        <Pressable
            onPress={() => {
                if (tab.href) router.push(tab.href);
            }}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            android_ripple={{ color: colorSet.primary + "22" }}
            style={({ pressed }) => [
                styles.wrapper,
                {
                    backgroundColor: isActive
                        ? activeBg
                        : pressed || hovered
                            ? hoverBg
                            : inactiveBg,
                    borderWidth: theme.dark
                        ? (isActive ? 1 : hovered ? StyleSheet.hairlineWidth : 0)
                        : 0,
                    borderColor: isActive
                        ? activeBorderColor
                        : drawerColors
                          ? theme.dark
                              ? colorSet.border
                              : (colorSet as any).drawerBorder ?? colorSet.border
                          : colorSet.border,
                },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
        >
            {isActive && !theme.dark && (
                <RNView style={styles.activeAccentBar} />
            )}
            <View style={styles.innerContainer}>
                {tab.icon({ focused: isActive })}
                <Text
                    style={[
                        styles.label,
                        {
                            color: isActive ? activeText : hovered ? hoverText : inactiveText,
                            fontWeight: isActive ? "600" : "500",
                        },
                    ]}
                    numberOfLines={1}
                >
                    {tab.label}
                </Text>
                {proLock && (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: colorSet.border,
                            borderRadius: 6,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            marginLeft: 6,
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faLock}
                            size={10}
                            color={colorSet.text}
                            style={{ marginRight: 4 }}
                        />
                        <Text style={{ color: colorSet.text, fontSize: 11, fontWeight: "500" }}>
                            Upgrade to Pro
                        </Text>
                    </View>
                )}
                {tab.showUnreadCount && unreadCount > 0 && (
                    <Badge
                        visible={true}
                        size={16}
                        selectionColor={Colors(theme).red}
                        style={{
                            backgroundColor: Colors(theme).red,
                            minWidth: 16,
                            alignSelf: "center",
                        }}
                    >
                        {unreadCount}
                    </Badge>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    // ── Expanded mode ────────────────────────────────────────────────
    wrapper: {
        marginHorizontal: 8,
        marginVertical: 2,
        borderRadius: 10,
        overflow: "hidden",
    },
    innerContainer: {
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
    },
    activeAccentBar: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: "rgb(5, 68, 99)",
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
    },
    // ── Collapsed mode ────────────────────────────────────────────────
    wrapperCollapsed: {
        marginHorizontal: 4,
        marginVertical: 2,
        borderRadius: 10,
        // overflow: visible so tooltip can extend outside the sidebar's scroll area
        overflow: "visible",
        position: "relative",
    },
    innerCollapsed: {
        width: 48,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    collapsedBadge: {
        position: "absolute",
        top: 8,
        right: 8,
    },
    tooltip: {
        position: "absolute",
        left: 56,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        backgroundColor: "rgba(5, 68, 99, 0.95)",
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        zIndex: 99999,
        // Web-only visual enhancements (ignored on native)
        ...Platform.select({
            web: {
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
            } as any,
        }),
    },
    tooltipText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "500",
    },
});

interface DrawerIconProps {
    href?: string;
    icon: IconProp;
    size?: number;
    focused?: boolean;
}

const DrawerIcon: React.FC<DrawerIconProps> = ({ href, icon, size = 20, focused: focusedProp }) => {
    const theme = useTheme();
    const pathname = usePathname();
    const drawerColors = useDrawerColors();

    const active = focusedProp !== undefined ? focusedProp : (!!href && pathname.startsWith(href));
    const color = active
        ? (drawerColors ? drawerColors.activeColor : Colors(theme).white)
        : (drawerColors ? drawerColors.inactiveColor : Colors(theme).text);

    return (
        <FontAwesomeIcon
            icon={icon}
            color={color}
            size={size}
        />
    );
};

export default DrawerMenuItem;
export { DrawerIcon };
