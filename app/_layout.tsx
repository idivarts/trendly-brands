import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
    Stack,
    useLocalSearchParams,
    usePathname,
    useRouter,
    useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import DownloadApp from "@/components/download";
import { useColorScheme } from "@/components/theme/useColorScheme";
import CustomPaperTheme from "@/constants/Themes/Theme";
import {
    AuthContextProvider,
    AWSContextProvider,
    ThemeOverrideProvider,
    useAuthContext,
    useThemeOverride,
} from "@/contexts";
import UpdateProvider from "@/shared-libs/contexts/update-provider";
import { ConfirmationModalProvider } from "@/shared-uis/components/ConfirmationModal";
import { toastConfig } from "@/shared-uis/components/toaster/Toaster";
import { resetAndNavigate } from "@/utils/router";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Platform } from "react-native";
import { Provider } from "react-native-paper";
import Toast from "react-native-toast-message";

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from "expo-router";

export const unstable_settings = {
    // Ensure that reloading on `/modal` keeps a back button present.
    initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
        ...(Platform.OS === 'web' ? { Figtree: require("../assets/fonts/Figtree-Regular.ttf") } : {}),
        ...FontAwesome.font,
    });

    // Expo Router uses Error Boundaries to catch errors in the navigation tree.
    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <GestureHandlerRootView>
            <UpdateProvider force={true}>
                <AuthContextProvider>
                    <ThemeOverrideProvider>
                        <RootLayoutStack />
                    </ThemeOverrideProvider>
                </AuthContextProvider>
            </UpdateProvider>
        </GestureHandlerRootView>
    );
}

const RootLayoutStack = () => {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const pathname = usePathname();
    const params = useLocalSearchParams();
    const segments = useSegments();
    const { isLoading, session, manager } = useAuthContext();
    const { themeOverride, setThemeOverride } = useThemeOverride();

    const appTheme = themeOverride ?? manager?.settings?.theme ?? colorScheme;
    const navigationTheme = appTheme === "dark" ? DarkTheme : DefaultTheme;

    if (Platform.OS === 'web') {
        const WEB_FONT_STACK = 'Figtree';
        navigationTheme.fonts = {
            regular: {
                fontFamily: WEB_FONT_STACK,
                fontWeight: '400',
            },
            medium: {
                fontFamily: WEB_FONT_STACK,
                fontWeight: '500',
            },
            bold: {
                fontFamily: WEB_FONT_STACK,
                fontWeight: '600',
            },
            heavy: {
                fontFamily: WEB_FONT_STACK,
                fontWeight: '700',
            },
        }
    }


    useEffect(() => {
        if (themeOverride && manager?.settings?.theme === themeOverride) {
            setThemeOverride(null);
        }
    }, [themeOverride, manager?.settings?.theme, setThemeOverride]);

    useEffect(() => {
        const inAuthGroup = segments[0] === "(auth)";
        const inMainGroup = segments[0] === "(main)";

        if (isLoading) return;

        if (session && (inAuthGroup || pathname === "/")) {
            // On boot up, session exist and user is in auth group or /, redirect to collaborations
            resetAndNavigate("/discover");
        } else if (!session && (inMainGroup || pathname === "/")) {
            // On boot up, session doesn't exist and user is in main group or /, redirect to pre-signin
            // resetAndNavigate("/pre-signin");
            resetAndNavigate("/lets-start");
        }
        // Redirect to respective screen
    }, [session, isLoading]);

    return (
        <ThemeProvider value={navigationTheme}>
            <AWSContextProvider>
                <Provider theme={CustomPaperTheme(navigationTheme)}>
                    <DownloadApp />
                    <ConfirmationModalProvider>
                        <BottomSheetModalProvider>
                            <Stack
                                screenOptions={{
                                    headerShown: false,
                                }}
                            >
                                <Stack.Screen name="index" />
                                <Stack.Screen name="+not-found" />
                            </Stack>
                            <Toast config={toastConfig} />
                        </BottomSheetModalProvider>
                    </ConfirmationModalProvider>
                </Provider>
            </AWSContextProvider>
        </ThemeProvider>
    );
};
