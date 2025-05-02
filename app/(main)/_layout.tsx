import { AWSContextProvider, ChatContextProvider, CloudMessagingContextProvider, CollaborationContextProvider, ContractContextProvider, FirebaseStorageContextProvider, NotificationContextProvider } from "@/contexts";
import { BrandContextProvider } from "@/contexts/brand-context.provider";
import { Stack } from "expo-router";
import React from "react";
import { AutocompleteDropdownContextProvider } from "react-native-autocomplete-dropdown";

const MainLayout = () => {
  return (
    <AWSContextProvider>
      <FirebaseStorageContextProvider>
        <NotificationContextProvider>
          <CloudMessagingContextProvider>
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
    </AWSContextProvider>
  );
};

export default MainLayout;
