import { ChatContextProvider, CloudMessagingContextProvider, CollaborationContextProvider, ContractContextProvider, FirebaseStorageContextProvider, NotificationContextProvider, useAuthContext } from "@/contexts";
import { BrandContextProvider } from "@/contexts/brand-context.provider";
import { streamClient } from "@/contexts/chat-context.provider";
import { ScrollProvider } from "@/shared-libs/contexts/scroll-context";
import TrackingProvider from "@/shared-libs/contexts/tracking-provider";
import { ConfirmationModalProvider } from "@/shared-uis/components/ConfirmationModal";
import { Stack } from "expo-router";
import React from "react";
import { AutocompleteDropdownContextProvider } from "react-native-autocomplete-dropdown";


const MainLayout = () => {
  const { manager, updateManager } = useAuthContext()
  return (
    // <AWSContextProvider>
    <TrackingProvider>
      <ConfirmationModalProvider>
        <FirebaseStorageContextProvider>
          <NotificationContextProvider>
            <CloudMessagingContextProvider userOrmanager={manager} updateUserOrManager={updateManager} streamClient={streamClient}>
              <BrandContextProvider restrictForPayment={false}>
                <CollaborationContextProvider>
                  <ContractContextProvider>
                    <AutocompleteDropdownContextProvider>
                      <ChatContextProvider>
                        <ScrollProvider>
                          <Stack
                            screenOptions={{
                              animation: "ios",
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
              </BrandContextProvider>
            </CloudMessagingContextProvider>
          </NotificationContextProvider>
        </FirebaseStorageContextProvider>
      </ConfirmationModalProvider>
    </TrackingProvider>
    // </AWSContextProvider>
  );
};

export default MainLayout;
