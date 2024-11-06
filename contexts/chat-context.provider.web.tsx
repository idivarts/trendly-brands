import { createContext, PropsWithChildren, useContext } from "react";

interface ChatContextProps {
  createGroupWithMembers: (
    client: any,
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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
