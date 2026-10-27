import Colors from "@/shared-uis/constants/Colors";
import AppLayout from "@/layouts/app-layout";
import { useTheme } from "@react-navigation/native";
import { Stack, usePathname } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

const layoutStyles = StyleSheet.create({
    flex1: { flex: 1 },
});

// These routes paint their own full-screen canvas (AmbientBackground), so the
// layout must not inset them — a safe-area padding applied out here sits
// *outside* that canvas and shows up as a plain band of app background along
// the screen edge, below the content.
const FULL_BLEED_AUTH_ROUTES = [
    "/pre-signin",
    "/create-new-account",
    "/login",
    "/forgot-password",
    "/lets-start",
] as const;

const AuthLayout = () => {
    const pathname = usePathname();
    const theme = useTheme();
    const isFullBleedAuth = useMemo(
        () =>
            FULL_BLEED_AUTH_ROUTES.some(
                (route) =>
                    pathname === route || pathname?.endsWith(route)
            ),
        [pathname]
    );
    const layoutProps: any = useMemo(
        () =>
            isFullBleedAuth
                ? {
                    safeAreaEdges: [] as const,
                    backgroundColor:
                        pathname === "/pre-signin" || pathname?.endsWith("/pre-signin")
                            ? theme.dark
                                ? Colors(theme).background
                                : Colors(theme).aliceBlue
                            : theme.dark
                                ? Colors(theme).background
                                : Colors(theme).aliceBlue,
                }
                : undefined,
        [isFullBleedAuth, theme, pathname]
    );

    return (
        <AppLayout {...layoutProps}>
            <View style={layoutStyles.flex1}>
                <Stack
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <Stack.Screen
                        name="pre-signin"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="login"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="create-new-account"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="forgot-password"
                        options={{
                            headerShown: false,
                        }}
                    />
                </Stack>
            </View>
        </AppLayout>
    );
};

export default AuthLayout;
