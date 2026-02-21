import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import React from "react";
import {
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const TAB_BAR_HEIGHT = 64;
const TAB_BAR_RADIUS = 24;
const TAB_BAR_MARGIN_H = 16;
const TAB_BAR_MARGIN_B = 24;
const BLUR_INTENSITY = 80;
const INDICATOR_SIZE = 5;

const LIGHT_SURFACE = "rgba(245, 245, 248, 0.82)";
const DARK_SURFACE = "rgba(30, 30, 30, 0.65)";
const LIGHT_BORDER = "rgba(0, 0, 0, 0.08)";
const DARK_BORDER = "rgba(255, 255, 255, 0.12)";

const GlassTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const isDark = theme.dark;

    const surface = isDark ? DARK_SURFACE : LIGHT_SURFACE;
    const border = isDark ? DARK_BORDER : LIGHT_BORDER;

    const content = (
        <View style={styles.tabRow}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.title ?? route.name;
                const isFocused = state.index === index;

                const color = isFocused ? colors.primary : colors.text;

                const onPress = () => {
                    const event = navigation.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: "tabLongPress",
                        target: route.key,
                    });
                };

                const icon = options.tabBarIcon?.({
                    focused: isFocused,
                    color,
                    size: 22,
                });

                return (
                    <Pressable
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={styles.tab}
                    >
                        {icon}
                        <Text
                            numberOfLines={1}
                            style={[
                                styles.label,
                                {
                                    color,
                                    fontWeight: isFocused ? "700" : "400",
                                    opacity: isFocused ? 1 : 0.65,
                                },
                            ]}
                        >
                            {label}
                        </Text>
                        {isFocused && (
                            <View
                                style={[
                                    styles.indicator,
                                    { backgroundColor: colors.primary },
                                ]}
                            />
                        )}
                    </Pressable>
                );
            })}
        </View>
    );

    const isAndroid = Platform.OS === "android";

    return (
        <Animated.View
            style={[
                styles.wrapper,
                {
                    borderColor: border,
                    shadowColor: isDark
                        ? "rgba(0,0,0,0.6)"
                        : "rgba(0,0,0,0.15)",
                },
            ]}
        >
            {isAndroid ? (
                <View style={[styles.surface, { backgroundColor: surface }]}>
                    {content}
                </View>
            ) : (
                <BlurView
                    intensity={BLUR_INTENSITY}
                    tint={isDark ? "dark" : "light"}
                    style={[styles.surface, { backgroundColor: surface }]}
                >
                    {content}
                </BlurView>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: "absolute",
        bottom: TAB_BAR_MARGIN_B,
        left: TAB_BAR_MARGIN_H,
        right: TAB_BAR_MARGIN_H,
        borderRadius: TAB_BAR_RADIUS,
        borderWidth: 1,
        shadowOpacity: 1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 6 },
        elevation: 16,
    },
    surface: {
        height: TAB_BAR_HEIGHT,
        borderRadius: TAB_BAR_RADIUS,
        overflow: "hidden",
    },
    tabRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingHorizontal: 4,
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        paddingVertical: 6,
    },
    label: {
        fontSize: 10,
        letterSpacing: 0.2,
    },
    indicator: {
        width: INDICATOR_SIZE,
        height: INDICATOR_SIZE,
        borderRadius: INDICATOR_SIZE / 2,
        marginTop: 2,
    },
});

export default GlassTabBar;
