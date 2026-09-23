import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, { PropsWithChildren, useContext, useMemo } from "react";
import { Platform, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
interface AppLayoutProps extends PropsWithChildren<Record<string, unknown>> {
    withWebPadding?: boolean;
    setInvisible?: boolean
    safeAreaEdges?: Array<"top" | "bottom" | "left" | "right">;
    backgroundColor?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({
    children,
    withWebPadding = false,
    setInvisible,
    safeAreaEdges,
    backgroundColor,
}) => {
    const theme = useTheme();
    const isAndroid = useMemo(() => Platform.OS === "android", []);
    const { xl } = useBreakpoints()
    // A bottom tab bar is drawn below this screen and already reserves
    // insets.bottom itself, so insetting the screen again stacks a second copy
    // of the same inset (34pt on a home-indicator iPhone, the nav-bar height on
    // edge-to-edge Android) as dead space right above the bar. Only the default
    // edges are adjusted — a screen that asks for specific edges gets exactly
    // those, since it may be one that hides the tab bar (e.g. the strategy
    // editor) and therefore does own the bottom inset.
    const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
    const defaultEdges: AppLayoutProps["safeAreaEdges"] =
        tabBarHeight > 0 ? ["right", "left"] : ["right", "bottom", "left"];
    const edges = safeAreaEdges ?? defaultEdges;
    const colors = Colors(theme);
    return (
        <SafeAreaView
            edges={edges}
            style={[
                styles.container,
                setInvisible && { display: "none" },
                {
                    backgroundColor: backgroundColor ?? colors.background,
                    paddingTop: isAndroid && edges.includes("top")
                        ? StatusBar.currentHeight ?? 0
                        : 0,
                },
                Platform.OS === "web" && withWebPadding && xl && { paddingHorizontal: 120 },
            ]}
        >
            {children}
            <ExpoStatusBar style={!theme.dark ? "dark" : "light"} />
        </SafeAreaView>
    );
};

export default AppLayout;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
