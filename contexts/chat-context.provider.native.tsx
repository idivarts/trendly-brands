import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { Channel, DefaultGenerics, StreamChat } from "stream-chat";
import { Chat, OverlayProvider } from "stream-chat-expo";
import { useAuthContext } from "./auth-context.provider";
import { useTheme } from "@react-navigation/native";
import { useStreamTheme } from "@/hooks";

const streamClient = StreamChat.getInstance(process.env.EXPO_PUBLIC_STREAM_API_KEY!);

interface ChatContextProps {
  createGroupWithMembers: (
    groupName: string,
    members: string[],
  ) => Promise<Channel>;
  connectUser: () => void;
}

const ChatContext = createContext<ChatContextProps>({
  createGroupWithMembers: async () => Promise.resolve({} as Channel),
  connectUser: async () => { },
});

export const useChatContext = () => useContext(ChatContext);

export const ChatContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [isReady, setIsReady] = useState(false);
  const theme = useTheme();
  const {
    getTheme,
  } = useStreamTheme(theme);
  const [streamChatTheme, setStreamChatTheme] = useState(getTheme());
  const [client, setClient] = useState<StreamChat<DefaultGenerics> | null>(null);

  useEffect(() => {
    setStreamChatTheme(getTheme());
  }, [theme]);

  const {
    manager: user,
  } = useAuthContext();

  const connect = async (
    streamToken: string,
  ) => {
    await streamClient.connectUser(
      {
        id: user?.id as string,
        name: user?.name as string,
        image: user?.profileImage as string || '',
      },
      streamToken,
    ).then(() => {
      setClient(streamClient);
      setIsReady(true);
    });
  }

  const connectUser = async () => {
    const response = await fetch('https://be.trendly.pro/api/v1/chat/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.id}`,
      },
    });

    const data = await response.json();

    if (data.token !== '') {
      await connect(data.token);
    }
  }

  useEffect(() => {
    if (user?.id) {
      connectUser();
    }

    return () => {
      if (isReady && client) {
        streamClient.disconnectUser();
        setIsReady(false);
      }
    };
  }, [user?.id]);

  const createGroupWithMembers = async (
    groupName: string,
    members: string[],
  ): Promise<Channel> => {
    const response = await fetch('https://be.trendly.pro/api/v1/chat/channel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.id}`,
      },
      body: JSON.stringify({
        name: groupName,
        userIds: members,
      }),
    });

    const data = await response.json();

    return data.channel;
  };

  return (
    <OverlayProvider value={{ style: streamChatTheme }}>
      <Chat client={streamClient}>
        <ChatContext.Provider
          value={{
            createGroupWithMembers,
            connectUser,
          }}
        >
          {children}
        </ChatContext.Provider>
      </Chat>
    </OverlayProvider>
  );
};
