import { ChatProvider } from "@/contexts";
import { BrandContextProvider } from "@/contexts/brand-context.provider";
import { Stack } from "expo-router";

const MainLayout = () => {
  return (
    <BrandContextProvider>
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
    </BrandContextProvider>
  );
};

export default MainLayout;
