import { ChatContextProvider, CloudMessagingContextProvider, CollaborationContextProvider, ContractContextProvider, FirebaseStorageContextProvider, NotificationContextProvider, useAuthContext } from "@/contexts";
import { BrandContextProvider } from "@/contexts/brand-context.provider";
import { streamClient } from "@/contexts/chat-context.provider";
import { createGuideTourStorageAdapter } from "@/contexts/guide-tour-storage-adapter";
import { ScrollProvider } from "@/shared-libs/contexts/scroll-context";
import TrackingProvider from "@/shared-libs/contexts/tracking-provider";
import { ConfirmationModalProvider } from "@/shared-uis/components/ConfirmationModal";
import {
    CoachmarkOverlay,
    CoachmarkProvider,
    defaultTheme,
} from "@edwardloopez/react-native-coachmark";
import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";
import { AutocompleteDropdownContextProvider } from "react-native-autocomplete-dropdown";

const MainLayout = () => {
    const { manager, updateManager } = useAuthContext();
    const storage = React.useMemo(
        () => createGuideTourStorageAdapter(manager?.id),
        [manager?.id]
    );

    return (
        <TrackingProvider>
            <ConfirmationModalProvider>
                <FirebaseStorageContextProvider>
                    <NotificationContextProvider>
                        <CloudMessagingContextProvider
                            userOrmanager={manager}
                            updateUserOrManager={updateManager}
                            streamClient={streamClient}
                        >
                            <BrandContextProvider>
                                <CoachmarkProvider
                                    storage={storage}
                                    theme={defaultTheme}
                                >
                                    <View style={{ flex: 1 }}>
                                        <CollaborationContextProvider>
                                            <ContractContextProvider>
                                                <AutocompleteDropdownContextProvider>
                                                    <ChatContextProvider>
                                                        <ScrollProvider>
                                                            <Stack
                                                                screenOptions={{
                                                                    headerShown:
                                                                        false,
                                                                }}
                                                            />
                                                        </ScrollProvider>
                                                    </ChatContextProvider>
                                                </AutocompleteDropdownContextProvider>
                                            </ContractContextProvider>
                                        </CollaborationContextProvider>
                                        <CoachmarkOverlay />
                                    </View>
                                </CoachmarkProvider>
                            </BrandContextProvider>
                        </CloudMessagingContextProvider>
                    </NotificationContextProvider>
                </FirebaseStorageContextProvider>
            </ConfirmationModalProvider>
        </TrackingProvider>
    );
};

export default MainLayout;
