import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useTheme,
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
  useAuthContext
} from "@/contexts";
import UpdateProvider from "@/shared-libs/contexts/update-provider";
import { ConfirmationModalProvider } from "@/shared-uis/components/ConfirmationModal";
import { resetAndNavigate } from "@/utils/router";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
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
          <RootLayoutStack />
        </AuthContextProvider>
      </UpdateProvider>
    </GestureHandlerRootView>
  );
}

const RootLayoutStack = () => {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const segments = useSegments();
  const { isLoading, session, manager } = useAuthContext();

  const appTheme = manager?.settings?.theme || colorScheme;

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    const inMainGroup = segments[0] === "(main)";

    if (isLoading) return;

    if (
      session
      && (inAuthGroup || pathname === "/")
    ) {
      // On boot up, session exist and user is in auth group or /, redirect to collaborations
      resetAndNavigate("/explore-influencers");
    } else if (
      !session
      && (inMainGroup || pathname === "/")
    ) {
      // On boot up, session doesn't exist and user is in main group or /, redirect to pre-signin
      // resetAndNavigate("/pre-signin");
      resetAndNavigate("/lets-start");
    }
    // Redirect to respective screen
  }, [session, isLoading]);

  return (
    <ThemeProvider value={appTheme === "dark" ? DarkTheme : DefaultTheme}>
      <AWSContextProvider>
        <Provider theme={CustomPaperTheme(theme)}>
          <DownloadApp />
          <ConfirmationModalProvider>
            <BottomSheetModalProvider>
              <Stack screenOptions={{
                animation: "ios",
                headerShown: false,
              }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="+not-found" />
              </Stack>
              <Toast />
            </BottomSheetModalProvider>
          </ConfirmationModalProvider>
        </Provider>
      </AWSContextProvider>
    </ThemeProvider>
  );
};
