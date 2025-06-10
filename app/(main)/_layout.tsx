import { ChatContextProvider, CloudMessagingContextProvider, CollaborationContextProvider, ContractContextProvider, FirebaseStorageContextProvider, NotificationContextProvider, useAuthContext } from "@/contexts";
import { BrandContextProvider } from "@/contexts/brand-context.provider";
import { streamClient } from "@/contexts/chat-context.provider";
import TrackingProvider from "@/shared-libs/contexts/tracking-provider";
import { Stack } from "expo-router";
import React from "react";
import { AutocompleteDropdownContextProvider } from "react-native-autocomplete-dropdown";


const MainLayout = () => {
  const { manager, updateManager } = useAuthContext()
  return (
    // <AWSContextProvider>
    <TrackingProvider>
      <FirebaseStorageContextProvider>
        <NotificationContextProvider>
          <CloudMessagingContextProvider userOrmanager={manager} updateUserOrManager={updateManager} streamClient={streamClient}>
            <BrandContextProvider>
              <CollaborationContextProvider>
                <ContractContextProvider>
                  <AutocompleteDropdownContextProvider>
                    <ChatContextProvider>
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
                          name="(onboarding)"
                          options={{
                            headerShown: false,
                          }}
                        />
                      </Stack>
                    </ChatContextProvider>
                  </AutocompleteDropdownContextProvider>
                </ContractContextProvider>
              </CollaborationContextProvider>
            </BrandContextProvider>
          </CloudMessagingContextProvider>
        </NotificationContextProvider>
      </FirebaseStorageContextProvider>
    </TrackingProvider>
    // </AWSContextProvider>
  );
};

export default MainLayout;
