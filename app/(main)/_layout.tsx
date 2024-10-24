import { ChatProvider } from "@/contexts";
import { Stack } from "expo-router";

const MainLayout = () => {
  return (
    <ChatProvider>
      <Stack
        screenOptions={{
          animation: "ios",
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="(drawer)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(screens)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </ChatProvider>
  );
};

export default MainLayout;
