import {
  createContext,
  type PropsWithChildren,
  useContext
} from "react";

import { useCloudMessaging } from "@/shared-libs/utils/cloud-messaging";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { useAuthContext } from "./auth-context.provider";
import { streamClient } from "./chat-context.provider";

const client = streamClient

interface CloudMessagingContextProps {
  getToken: () => Promise<string>;
  registerPushTokenWithStream: (token: string) => Promise<void>
  registerPushTokenWithPlatform: (token: string) => Promise<void>
}

const CloudMessagingContext = createContext<CloudMessagingContextProps>({
  getToken: async () => "",
  registerPushTokenWithPlatform: async (x: string) => { },
  registerPushTokenWithStream: async (x: string) => { },
});

export const useCloudMessagingContext = () => useContext(CloudMessagingContext);

export const CloudMessagingContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const {
    manager,
    updateManager,
  } = useAuthContext();

  const { getToken, registerPushTokenWithStream, registerPushTokenWithPlatform } = useCloudMessaging(streamClient, AuthApp.currentUser?.uid, manager, updateManager)

  return (
    <CloudMessagingContext.Provider
      value={{
        getToken,
        registerPushTokenWithPlatform,
        registerPushTokenWithStream
      }}
    >
      {children}
    </CloudMessagingContext.Provider>
  );
};
