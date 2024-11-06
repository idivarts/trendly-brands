
import { Platform } from "react-native";
import {
  useChatContext as useChatContextWeb,
  ChatContextProvider as ChatContextProviderWeb
} from "./chat-context.provider.web";
import {
  useChatContext as useChatContextNative,
  ChatContextProvider as ChatContextProviderNative
} from "./chat-context.provider.native";
import { PropsWithChildren } from "react";

export const useChatContext = () => {
  if (Platform.OS === 'web') {
    return useChatContextWeb();
  }

  return useChatContextNative();
};

export const ChatContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  if (Platform.OS === 'web') {
    return (
      <ChatContextProviderWeb>{children}</ChatContextProviderWeb>
    )
  }

  return (
    <ChatContextProviderNative>{children}</ChatContextProviderNative>
  );
};

export default ChatContextProvider;
