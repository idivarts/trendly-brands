import AppLayout from "@/layouts/app-layout";
import { Stack } from "expo-router";
import { View } from "react-native";

const AuthLayout = () => {
  return (
    <AppLayout>
      <View
        style={{
          flex: 1,
        }}
      >
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
