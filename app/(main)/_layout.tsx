import { ChatContextProvider, CloudMessagingContextProvider, CollaborationContextProvider, ContractContextProvider, FirebaseStorageContextProvider, NotificationContextProvider, useAuthContext } from "@/contexts";
import { BrandContextProvider } from "@/contexts/brand-context.provider";
import { AnalyticsOrgSync, SubscriptionTransitionWatcher } from "@/contexts/analytics-context.provider";
import { OrganizationProvider } from "@/contexts/organization-context.provider";
import { AIConfigProvider } from "@/contexts/ai-config-context.provider";
import { BrandSocialContextProvider, useBrandSocialContext } from "@/contexts/brand-social-context.provider";
import GBProvider from "@/contexts/growthbook-context-provider";
import { SubscribeNudgeProvider } from "@/contexts/subscribe-nudge-context.provider";
import { streamClient } from "@/contexts/chat-context.provider";
import { createGuideTourStorageAdapter } from "@/contexts/guide-tour-storage-adapter";
import { track } from "@/shared-libs/utils/analytics";
import { followerBucket } from "@/utils/follower-bucket";
import { takeSocialConnectAttempt } from "@/utils/social-connect-attempt";
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
    const { refreshSocials, socialAccounts } = useBrandSocialContext();

    const handleURL = (url: string) => {
        try {
            const parsed = new URL(url);
            const path = parsed.pathname || parsed.hostname;
            if (!path.includes("social-connected")) return;

            const status = parsed.searchParams.get("status");
            const platform = parsed.searchParams.get("platform") || "social";
            const message = parsed.searchParams.get("message");

            // The attempt stashed when the user left for connect.trendly.now.
            // On web this callback lands in a NEW TAB, so it is the only way
            // to know which door they came through or how long the OAuth round
            // trip took. Awaited before reporting rather than alongside it, so
            // the event is never sent twice with and without context.
            void takeSocialConnectAttempt().then((attempt) => {
                const duration = attempt ? Date.now() - attempt.startedAt : undefined;

                if (status === "success") {
                    const account = socialAccounts.find((a) => a.platform === platform);
                    // ⭐ Activation. Tracked here rather than where the connect
                    // flow is launched (hooks/request/use-connect-brand-social.tsx),
                    // because this callback is the first point that knows the
                    // OAuth round-trip actually succeeded.
                    //
                    // platforms_connected is read from the attempt, not from
                    // the context: on web this tab mounted fresh and its
                    // socials have not loaded yet, so the live list would read
                    // as empty and make every connection look like a first.
                    track("social_connected", {
                        platform,
                        account_type: account?.accountType,
                        is_first: attempt ? attempt.platformsConnected === 0 : undefined,
                        entry_point: attempt?.entryPoint,
                        follower_bucket: followerBucket(account?.followerCount),
                        duration_ms: duration,
                    });
                    Toaster.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected to your brand!`);
                    refreshSocials();
                } else {
                    // `message` is trendly-connect's own account of what broke
                    // — permission denied, token exchange failed, no eligible
                    // Page. It was being shown in a toast and then discarded,
                    // and it is the most useful field in this whole flow.
                    track("social_connect_failed", {
                        platform,
                        reason: message || undefined,
                        entry_point: attempt?.entryPoint,
                        duration_ms: duration,
                    });
                    Toaster.error(message || `Failed to connect ${platform}. Please try again.`);
                }
            });
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
                            <GBProvider>
                            <OrganizationProvider>
                                {/* Renders nothing — keeps org/brand/plan on every analytics event. */}
                                <AnalyticsOrgSync />
                                {/* Renders nothing — emits subscription_started / _cancelled. */}
                                <SubscriptionTransitionWatcher />
                                <AIConfigProvider>
                                <SubscribeNudgeProvider>
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
                                </SubscribeNudgeProvider>
                                </AIConfigProvider>
                            </OrganizationProvider>
                            </GBProvider>
                            </BrandContextProvider>
                        </CloudMessagingContextProvider>
                    </NotificationContextProvider>
                </FirebaseStorageContextProvider>
            </ConfirmationModalProvider>
        </TrackingProvider>
    );
};

export default MainLayout;
