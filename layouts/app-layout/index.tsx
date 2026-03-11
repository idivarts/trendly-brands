import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, { PropsWithChildren, useMemo } from "react";
import { Platform, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
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
    const edges = safeAreaEdges ?? ["right", "bottom", "left"];
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
