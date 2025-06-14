import { useCloudMessagingContext } from "@/shared-libs/contexts/cloud-messaging.provider";
import { Console } from "@/shared-libs/utils/console";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { DefaultGenerics, StreamChat } from "stream-chat";
import { useAuthContext } from "./auth-context.provider";
import StreamWrapper from "./stream-wrapper";
import { streamClient } from "./streamClient";

export { streamClient };
interface ChatContextProps {
  isStreamConnected: boolean,
  connectUser: () => Promise<string>;
  fetchMembers: (channel: string) => Promise<any>;
  addMemberToChannel: (channel: string, member: string) => void;
  fetchChannelCid: (channelId: string) => Promise<string>;
  removeMemberFromChannel: (
    channel: string,
    member: string
  ) => Promise<boolean>;
  hasError?: boolean;
  deregisterTokens?: Function;
}

const ChatContext = createContext<ChatContextProps>({
  // createGroupWithMembers: async () => Promise.resolve({} as Channel),
  isStreamConnected: false,
  connectUser: async () => "",
  fetchMembers: async () => { },
  addMemberToChannel: async () => { },
  // sendSystemMessage: async () => { },
  fetchChannelCid: async () => "",
  removeMemberFromChannel: async () => false,
  hasError: false,
  deregisterTokens: () => { Console.log("No deregister function provided") },
});

export const useChatContext = () => useContext(ChatContext);

export const ChatContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [token, setToken] = useState("");
  const [hasError, setHasError] = useState(false)
  const [isStreamConnected, setIsStreamConnected] = useState(false)

  const [client, setClient] = useState<StreamChat<DefaultGenerics> | null>(null);

  const { getToken, registerPushTokenWithStream, updatedTokens } = useCloudMessagingContext()

  const { manager: user } = useAuthContext();

  const connectStream = async (streamToken: string) => {
    await streamClient.connectUser({
      id: user?.id as string,
      name: user?.name as string,
      image: (user?.profileImage as string) || "",
    }, streamToken).then(async () => {
      setClient(streamClient);
      setToken(streamToken);
      setHasError(false);
      setIsStreamConnected(true)
      registerPushTokenWithStream(await getToken())
    });
  };

  const connectUser = async () => {
    if (token) {
      Console.log("Already connected to Chat")
      return token
    }
    Console.log("Connecting to Chat")
    try {
      const response = await HttpWrapper.fetch("/api/v1/chat/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!!data.token) {
        await connectStream(data.token);
        return (data.token as string)
      } else {
        throw { message: "No token provided" }
      }
    } catch (error) {
      Console.log("Error connecting to chat", error);
      setToken("")
      setHasError(true)
    }
    return ""
  };

  useEffect(() => {
    if (user) {
      connectUser();
    }

    return () => {
      if (token && client) {
        streamClient.disconnectUser();
        setToken("");
      }
    };
  }, [user]);

  const fetchMembers = async (channel: string) => {
    const channelToWatch = streamClient.channel("messaging", channel);
    await channelToWatch.watch();
    const membersList = Object.values(channelToWatch.state.members);

    return membersList;
  };

  const addMemberToChannel = async (channel: string, member: string) => {
    try {
      const channelToWatch = streamClient.channel("messaging", channel);
      await channelToWatch
        .addMembers([member])
        .then(() => { })
        .catch((error) => {
          Console.error(error);
        });
    } catch (error) {
      Console.error(error);
    }
  };

  const removeMemberFromChannel = async (channel: string, member: string) => {
    try {
      const channelToWatch = streamClient.channel("messaging", channel);
      await channelToWatch
        .removeMembers([member])
        .then(() => {
          return true;
        })
        .catch((error) => {
          Console.error(error);
          return false;
        });

      return false;
    } catch (error) {
      Console.error(error);
      return false;
    }
  };

  const fetchChannelCid = async (channelId: string) => {
    const channel = streamClient.channel("messaging", channelId);
    await channel.watch();
    return channel.cid;
  };

  return (
    <ChatContext.Provider
      value={{
        isStreamConnected,
        connectUser,
        fetchMembers,
        addMemberToChannel,
        fetchChannelCid,
        removeMemberFromChannel,
        hasError,
        deregisterTokens: updatedTokens
      }}
    >
      <StreamWrapper>
        {children}
      </StreamWrapper>
    </ChatContext.Provider>
  );
};
