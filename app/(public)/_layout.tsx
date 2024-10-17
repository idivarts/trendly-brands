import { View } from "react-native";
import AppLayout from "@/layouts/app-layout";
import { Stack } from "expo-router";

const PublicLayout = () => {
  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
        }}
      >
        <Stack
          screenOptions={{
            animation: "ios",
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="pre-signin"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </View>
    </AppLayout>
  );
};

export default PublicLayout;
