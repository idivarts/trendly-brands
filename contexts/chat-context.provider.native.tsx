import {
  useContext,
  createContext,
  type PropsWithChildren,
} from "react";
import { DefaultGenerics, StreamChat } from "stream-chat";

import Toaster from "@/shared-uis/components/toaster/Toaster";

interface ChatContextProps {
  createGroupWithMembers: (
    client: StreamChat<DefaultGenerics>,
    groupName: string,
    members: string[],
  ) => Promise<void>;
}

const ChatContext = createContext<ChatContextProps>(null!);

export const useChatContext = () => useContext(ChatContext);

export const ChatContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
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
  }

  return (
    <ChatContext.Provider
      value={{
        createGroupWithMembers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
