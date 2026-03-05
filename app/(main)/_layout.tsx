import { ChatContextProvider, CloudMessagingContextProvider, CollaborationContextProvider, ContractContextProvider, FirebaseStorageContextProvider, NicheProvider, NotificationContextProvider, useAuthContext } from "@/contexts";
import { BrandContextProvider } from "@/contexts/brand-context.provider";
import { GuideTourProvider } from "@/contexts/guide-tour-context.provider";
import { streamClient } from "@/contexts/chat-context.provider";
import GuideTourOverlay from "@/components/guide-tour/GuideTourOverlay";
import { ScrollProvider } from "@/shared-libs/contexts/scroll-context";
import TrackingProvider from "@/shared-libs/contexts/tracking-provider";
import { ConfirmationModalProvider } from "@/shared-uis/components/ConfirmationModal";
import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";
import { AutocompleteDropdownContextProvider } from "react-native-autocomplete-dropdown";


const MainLayout = () => {
    const { manager, updateManager } = useAuthContext()
    return (
        // <AWSContextProvider>
        <TrackingProvider>
            <NicheProvider>
                <ConfirmationModalProvider>
                    <FirebaseStorageContextProvider>
                        <NotificationContextProvider>
                            <CloudMessagingContextProvider userOrmanager={manager} updateUserOrManager={updateManager} streamClient={streamClient}>
                                <BrandContextProvider>
                                    <GuideTourProvider>
                                    <View style={{ flex: 1 }}>
                                    <CollaborationContextProvider>
                                        <ContractContextProvider>
                                            <AutocompleteDropdownContextProvider>
                                                <ChatContextProvider>
                                                    <ScrollProvider>
                                                        <Stack
                                                            screenOptions={{
                                                                headerShown: false,
                                                            }}
                                                        >
                                                            {/* <Stack.Screen
                              name="(drawer)"
                              options={{
                                headerShown: false,
                              }}
                            />
                            <Stack.Screen
                              name="(onboarding)"
                              options={{
                                headerShown: false,
                              }}
                            /> */}
                                                        </Stack>
                                                    </ScrollProvider>
                                                </ChatContextProvider>
                                            </AutocompleteDropdownContextProvider>
                                        </ContractContextProvider>
                                    </CollaborationContextProvider>
                                    <GuideTourOverlay />
                                    </View>
                                    </GuideTourProvider>
                                </BrandContextProvider>
                            </CloudMessagingContextProvider>
                        </NotificationContextProvider>
                    </FirebaseStorageContextProvider>
                </ConfirmationModalProvider>
            </NicheProvider>
        </TrackingProvider>
        // </AWSContextProvider>
    );
};

export default MainLayout;
