import { PublicContextProvider } from "@/contexts/public-context-provider";
import AppLayout from "@/layouts/app-layout";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

const layoutStyles = StyleSheet.create({
    flex1: { flex: 1 },
});

const PublicLayout = () => {
    return (
        <PublicContextProvider>
            <AppLayout>
                <View style={layoutStyles.flex1}>
                    <Stack
                        screenOptions={{
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
