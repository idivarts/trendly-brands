import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useTheme,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/components/theme/useColorScheme";
import {
  AuthContextProvider,
  CloudMessagingContextProvider,
  CollaborationContextProvider,
  FirebaseStorageContextProvider,
  NotificationContextProvider,
  useAuthContext,
} from "@/contexts";
import { Provider } from "react-native-paper";
import { AutocompleteDropdownContextProvider } from "react-native-autocomplete-dropdown";
import { BrandContextProvider } from "@/contexts/brand-context.provider";
import CustomPaperTheme from "@/constants/Themes/Theme";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
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
      <AuthContextProvider>
        <FirebaseStorageContextProvider>
          <NotificationContextProvider>
            <CloudMessagingContextProvider>
              <BrandContextProvider>
                <CollaborationContextProvider>
                  <AutocompleteDropdownContextProvider>
                    <RootLayoutStack />
                  </AutocompleteDropdownContextProvider>
                </CollaborationContextProvider>
              </BrandContextProvider>
            </CloudMessagingContextProvider>
          </NotificationContextProvider>
        </FirebaseStorageContextProvider>
      </AuthContextProvider>
    </GestureHandlerRootView>
  );
}

const RootLayoutStack = () => {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { isLoading, session, manager } = useAuthContext();

  const appTheme = manager?.settings?.theme || colorScheme;

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    const inMainGroup = segments[0] === "(main)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    if (isLoading) return;

    if (session && (inMainGroup || inOnboardingGroup)) {
      // Redirect to main group path if signed in
      //@ts-ignore
      router.replace(pathname);
    } else if (session) {
      // Redirect to main group if signed in
      router.replace("/explore-influencers");
    } else if (!session && !inAuthGroup) {
      // App should start at pre-signin
      router.replace("/pre-signin");
    } else if (!session && inMainGroup) {
      // User can't access main group if not signed in
      router.replace("/login");
    }
  }, [session, isLoading]);

  return (
    <ThemeProvider value={appTheme === "dark" ? DarkTheme : DefaultTheme}>
      <Provider
        theme={CustomPaperTheme(theme)}
      >
        <Stack
          screenOptions={{
            animation: "ios",
            headerShown: false,
          }}
        >
          <Stack.Screen name="(public)" options={{ headerShown: false }} />
          {session ? (
            <Stack.Screen name="(main)" options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          )}
          <Stack.Screen name="index" />
          <Stack.Screen name="+not-found" />
          <Stack.Screen
            name="(modal)/create-collaboration"
            options={{
              presentation: "modal",
              gestureEnabled: true,
            }}
          />
        </Stack>
      </Provider>
    </ThemeProvider>
  );
};
