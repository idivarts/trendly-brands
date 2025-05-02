import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { createContext, PropsWithChildren, useContext, useState } from "react";

interface ChatContextProps {
  createGroupWithMembers: (
    groupName: string,
    userId: string,
    collaborationId: string,
  ) => Promise<any>;
  connectUser: () => Promise<string | undefined>;
  fetchMembers: (channel: any) => Promise<any>;
  addMemberToChannel: (channel: any, member: string) => void;
  sendSystemMessage: (channel: string, message: string) => void;
  fetchChannelCid: (channelId: string) => Promise<string>;
  removeMemberFromChannel: (channel: any, member: string) => Promise<boolean>;
  hasError?: boolean;
}

const ChatContext = createContext<ChatContextProps>({
  createGroupWithMembers: async () => { },
  connectUser: async () => { return undefined },
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
  const [token, setToken] = useState("")

  const createGroupWithMembers = async (
    groupName: string,
    userId: string,
    collaborationId: string,
  ): Promise<any> => {
    const response = await HttpWrapper.fetch("/api/v1/chat/channel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      return data.token
    } catch (error) {
      console.log("Error connecting to chat", error);
    }
    return undefined
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
