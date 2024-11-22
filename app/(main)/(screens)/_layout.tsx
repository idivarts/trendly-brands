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
        <Stack.Screen name="CollaborationHistory" />
      </Stack>
    </AppLayout>
  );
};

export default ScreensLayout;
