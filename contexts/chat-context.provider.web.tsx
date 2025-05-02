import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useCloudMessagingContext } from "../shared-libs/contexts/cloud-messaging.provider";
import { useAuthContext } from "./auth-context.provider";

interface ChatContextProps {
  connectUser: () => Promise<string | undefined>;
}

const ChatContext = createContext<ChatContextProps>({
  connectUser: async () => { return undefined },
});

export const streamClient = StreamChat.getInstance(
  process.env.EXPO_PUBLIC_STREAM_API_KEY!
);

export const useChatContext = () => useContext(ChatContext);

export const ChatContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [token, setToken] = useState("")
  const { manager } = useAuthContext()
  const { getToken, registerPushTokenWithStream } = useCloudMessagingContext()
  const connectWithStream = async (token: string | void) => {
    if (token) {
      if (AuthApp.currentUser?.uid)
        streamClient.connectUser({
          id: AuthApp.currentUser?.uid
        }, token)
      registerPushTokenWithStream(await getToken())
    }
  }

  useEffect(() => {
    if (manager) {
      connectUser().then(connectWithStream);
    }
  }, [manager])

  const connectUser = async (): Promise<string | undefined> => {
    if (token) {
      console.log("Already connected to Chat")
      return token
    }
    console.log("Connecting to Chat")
    try {
      const response = await HttpWrapper.fetch("/api/v1/chat/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setToken(data.token)
      connectWithStream()
      return data.token
    } catch (error) {
      console.log("Error connecting to chat", error);
    }
    return undefined
  };

  return (
    <ChatContext.Provider
      value={{
        connectUser
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
