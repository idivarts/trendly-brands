import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { DefaultGenerics, StreamChat } from "stream-chat";
import { Chat, OverlayProvider } from "stream-chat-expo";
import { useAuthContext } from "./auth-context.provider";
import { useTheme } from "@react-navigation/native";
import { useStreamTheme } from "@/hooks";

const streamClient = StreamChat.getInstance(process.env.EXPO_PUBLIC_STREAM_API_KEY!);
interface ChatContextProps {
  createGroupWithMembers: (
    client: StreamChat<DefaultGenerics>,
    groupName: string,
    members: string[],
  ) => Promise<void>;
  client: StreamChat<DefaultGenerics> | null;
}

const ChatContext = createContext<ChatContextProps>(null!);

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

  useEffect(() => {
    const connect = async () => {
      await streamClient.connectUser(
        {
          id: user?.id as string,
          name: user?.name as string,
          image: user?.profileImage as string || '',
        },
        streamClient.devToken(user?.id as string),
      ).then(() => {
        setClient(streamClient);
        setIsReady(true);
      });
    }

    connect();

    return () => {
      if (isReady && client) {
        streamClient.disconnectUser();
        setIsReady(false);
      }
    };
  }, [user?.id]);

  const createGroupWithMembers = async (
    client: StreamChat<DefaultGenerics>,
    groupName: string,
    members: string[],
  ) => {
    const channel = client.channel(
      'messaging',
      groupName.toLowerCase().replace(/\s+/g, '-'),
      {
        name: groupName,
        members,
      },
    );

    await channel.create();
    await channel.watch();
  };

  return (
    <OverlayProvider value={{ style: streamChatTheme }}>
      <Chat client={streamClient}>
        <ChatContext.Provider
          value={{
            createGroupWithMembers,
            client,
          }}
        >
          {children}
        </ChatContext.Provider>
      </Chat>
    </OverlayProvider>
  );
};
