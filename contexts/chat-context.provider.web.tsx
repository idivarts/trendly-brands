import { createContext, PropsWithChildren, useContext } from "react";
import { useAuthContext } from "./auth-context.provider";

interface ChatContextProps {
  createGroupWithMembers: (
    groupName: string,
    userId: string,
    collaborationId: string,
  ) => Promise<any>;
  connectUser: () => void;
  fetchMembers: (channel: any) => Promise<any>;
  addMemberToChannel: (channel: any, member: string) => void;
  sendSystemMessage: (channel: string, message: string) => void;
  fetchChannelCid: (channelId: string) => Promise<string>;
  removeMemberFromChannel: (channel: any, member: string) => Promise<boolean>;
  hasError?: boolean;
}

const ChatContext = createContext<ChatContextProps>({
  createGroupWithMembers: async () => { },
  connectUser: async () => { },
  fetchMembers: async () => { },
  addMemberToChannel: async () => { },
  sendSystemMessage: async () => { },
  fetchChannelCid: async () => "",
  removeMemberFromChannel: async () => false,
});

export const useChatContext = () => useContext(ChatContext);

export const ChatContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const { manager: user } = useAuthContext();

  const createGroupWithMembers = async (
    groupName: string,
    userId: string,
    collaborationId: string,
  ): Promise<any> => {
    const response = await fetch("https://be.trendly.pro/api/v1/chat/channel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.id}`,
      },
      body: JSON.stringify({
        name: groupName,
        userId,
        collaborationId,
      }),
    });

    const data = await response.json();

    return data.channel;
  };

  const fetchMembers = async (channel: any): Promise<any> => { };

  const addMemberToChannel = async (channel: any, member: string) => { };

  const sendSystemMessage = async (channel: string, message: string) => { };

  const fetchChannelCid = async (channelId: string): Promise<string> => {
    return "";
  };

  const removeMemberFromChannel = async (channel: any, member: string) => {
    return false;
  };

  const connectUser = async () => {
    return null;
  };

  return (
    <ChatContext.Provider
      value={{
        createGroupWithMembers,
        connectUser,
        fetchMembers,
        addMemberToChannel,
        sendSystemMessage,
        fetchChannelCid,
        removeMemberFromChannel,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
