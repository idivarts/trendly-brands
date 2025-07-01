import { PublicContextProvider } from "@/contexts/public-context-provider";
import AppLayout from "@/layouts/app-layout";
import { Stack } from "expo-router";
import { View } from "react-native";

const PublicLayout = () => {
    return (
        <PublicContextProvider>
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
                            name="collaboration-application"
                            options={{
                                headerShown: false,
                            }}
                        />
                    </Stack>
                </View>
            </AppLayout>
        </PublicContextProvider>
    );
};

export default PublicLayout;
