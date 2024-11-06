import { createContext, PropsWithChildren, useContext } from "react";

interface ChatContextProps {
  createGroupWithMembers: (
    client: any,
    groupName: string,
    members: string[],
  ) => Promise<void>;
  client: any;
}

const ChatContext = createContext<ChatContextProps>(null!);

export const useChatContext = () => useContext(ChatContext);

export const ChatContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const client: any = null;

  const createGroupWithMembers = async (
    client: any,
    groupName: string,
    members: string[],
  ) => {
    return;
  };

  return (
    <ChatContext.Provider
      value={{
        createGroupWithMembers,
        client: null,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
