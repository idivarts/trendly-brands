import AppLayout from "@/layouts/app-layout";
import { router, Stack } from "expo-router";

const ScreensLayout = () => {
  return (
    <AppLayout>
      <Stack
        screenOptions={{
          animation: "ios",
          headerShown: false,
        }}
      >
        <Stack.Screen name="notifications" />
        <Stack.Screen name="menu" />
        <Stack.Screen name="brand-profile" />
        <Stack.Screen name="CollaborationHistory" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="billing" />
      </Stack>
    </AppLayout>
  );
};

export default ScreensLayout;
