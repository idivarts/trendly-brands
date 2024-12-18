import { createContext, PropsWithChildren, useContext } from "react";
import { useAuthContext } from "./auth-context.provider";

interface ChatContextProps {
  createGroupWithMembers: (
    groupName: string,
    members: string[],
  ) => Promise<any>;
  connectUser: () => void;
}

const ChatContext = createContext<ChatContextProps>({
  createGroupWithMembers: async () => { },
  connectUser: async () => { },
});

export const useChatContext = () => useContext(ChatContext);

export const ChatContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const {
    manager: user,
  } = useAuthContext();

  const createGroupWithMembers = async (
    groupName: string,
    members: string[],
  ): Promise<any> => {
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

  const connectUser = async () => {
    return null;
  };

  return (
    <ChatContext.Provider
      value={{
        createGroupWithMembers,
        connectUser,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
