import Colors from "@/shared-uis/constants/Colors";
import { useChatContext } from "@/contexts";
import { useDrawerColors } from "@/components/drawer-layout/drawer-colors-context";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Href, usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, View as RNView } from "react-native";
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
    proLock?: boolean
};

const DrawerMenuItem: React.FC<DrawerMenuItemProps> = ({ tab, proLock }) => {
    const router = useRouter();
    const pathname = usePathname();
    const theme = useTheme();
    const { unreadCount } = useChatContext();
    const drawerColors = useDrawerColors();
    const [hovered, setHovered] = useState(false);

    // Avoid marking blank href items as active
    const isActive = !!tab.href && pathname.startsWith(tab.href.toString());
    const colorSet = Colors(theme);
    const inactiveBg = drawerColors?.inactiveBg ?? (drawerColors ? colorSet.drawerBackground : colorSet.background);
    const inactiveText = drawerColors ? drawerColors.inactiveColor : colorSet.text;
    const activeBg = (colorSet as any).drawerActiveBg ?? colorSet.primary;
    const activeBorderColor = (colorSet as any).drawerActiveBorder ?? colorSet.primary;
    const activeText = drawerColors ? drawerColors.activeColor : colorSet.onPrimary;
    // primary/inactiveBg may be rgb() strings — hex-suffix trick ("+ '22'") is invalid on them.
    // Use explicit rgba values for hover tint instead.
    const hoverBg = theme.dark
        ? "rgba(83, 139, 166, 0.10)"   // faint teal glow on dark sidebar
        : "rgba(5, 68, 99, 0.05)";     // whisper navy tint on alice-blue sidebar
    // Hover text is midway between inactive and active — clearly highlighted but not identical to selected
    const hoverText = theme.dark
        ? (colorSet as any).drawerText ?? colorSet.text     // near-white — readable on dark hover bg
        : drawerColors?.activeColor ?? colorSet.primary;    // navy — same as active on light (fine, bg differs)

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
                    // Dark mode: use surrounding border for active/hover feedback.
                    // Light mode: left accent bar handles active — no surrounding border needed.
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
            {/* Light theme active state: 3px left accent bar */}
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
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colorSet.border,
                            borderRadius: 6,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            marginLeft: 6,
                        }}
                    >
                        <FontAwesomeIcon icon={faLock} size={10} color={colorSet.text} style={{ marginRight: 4 }} />
                        <Text style={{ color: colorSet.text, fontSize: 11, fontWeight: '500' }}>
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
        backgroundColor: "transparent"
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
        backgroundColor: "rgb(5, 68, 99)", // always navy — light theme only
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
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
