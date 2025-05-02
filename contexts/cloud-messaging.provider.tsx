import {
  createContext,
  type PropsWithChildren,
  useContext
} from "react";

import { useCloudMessaging } from "@/shared-libs/utils/cloud-messaging";
import { useAuthContext } from "./auth-context.provider";
import { streamClient } from "./chat-context.provider";

const client = streamClient

interface CloudMessagingContextProps {
  getToken: () => Promise<string>;
}

const CloudMessagingContext = createContext<CloudMessagingContextProps>({
  getToken: async () => "",
});

export const useCloudMessagingContext = () => useContext(CloudMessagingContext);

export const CloudMessagingContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const {
    session,
    manager: user,
    updateManager,
  } = useAuthContext();

  const { getToken } = useCloudMessaging(streamClient, session, user, updateManager)

  return (
    <CloudMessagingContext.Provider
      value={{
        getToken,
      }}
    >
      {children}
    </CloudMessagingContext.Provider>
  );
};
