import { ChatContextProvider, CloudMessagingContextProvider, CollaborationContextProvider, ContractContextProvider, FirebaseStorageContextProvider, NotificationContextProvider, useAuthContext } from "@/contexts";
import { BrandContextProvider } from "@/contexts/brand-context.provider";
import { BrandSocialContextProvider, useBrandSocialContext } from "@/contexts/brand-social-context.provider";
import { streamClient } from "@/contexts/chat-context.provider";
import { createGuideTourStorageAdapter } from "@/contexts/guide-tour-storage-adapter";
import { ScrollProvider } from "@/shared-libs/contexts/scroll-context";
import TrackingProvider from "@/shared-libs/contexts/tracking-provider";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { ConfirmationModalProvider } from "@/shared-uis/components/ConfirmationModal";
import {
    CoachmarkOverlay,
    CoachmarkProvider,
    defaultTheme,
} from "@edwardloopez/react-native-coachmark";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { Linking, Platform, View } from "react-native";
import { AutocompleteDropdownContextProvider } from "react-native-autocomplete-dropdown";

// Handles the trendly-brands://social-connected deep link returned by connect.trendly.now
// Must sit inside BrandSocialContextProvider to access refreshSocials.
const BrandSocialConnectHandler: React.FC = () => {
    const { refreshSocials } = useBrandSocialContext();

    const handleURL = (url: string) => {
        try {
            const parsed = new URL(url);
            const path = parsed.pathname || parsed.hostname;
            if (!path.includes("social-connected")) return;

            const status = parsed.searchParams.get("status");
            const platform = parsed.searchParams.get("platform") || "social";
            const message = parsed.searchParams.get("message");

            if (status === "success") {
                Toaster.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected to your brand!`);
                refreshSocials();
            } else {
                Toaster.error(message || `Failed to connect ${platform}. Please try again.`);
            }
        } catch {
            // ignore malformed URLs
        }
    };

    useEffect(() => {
        if (Platform.OS === "web") {
            const url = window.location.href;
            if (url.includes("social-connected")) {
                handleURL(url);
            }
            return;
        }

        const subscription = Linking.addEventListener("url", ({ url }) => {
            handleURL(url);
        });

        Linking.getInitialURL().then((url) => {
            if (url) handleURL(url);
        });

        return () => subscription.remove();
    }, []);

    return null;
};

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
                                <BrandSocialContextProvider>
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
                                                                <BrandSocialConnectHandler />
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
                                </BrandSocialContextProvider>
                            </BrandContextProvider>
                        </CloudMessagingContextProvider>
                    </NotificationContextProvider>
                </FirebaseStorageContextProvider>
            </ConfirmationModalProvider>
        </TrackingProvider>
    );
};

export default MainLayout;
