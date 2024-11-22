import { ChatContextProvider } from "@/contexts";
import { Stack } from "expo-router";

const MainLayout = () => {
  return (
    <ChatContextProvider>
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
    </ChatContextProvider>
  );
};

export default MainLayout;
