
import { Platform } from "react-native";
import {
  ChatContextProvider as ChatProviderNative,
  useChatContext as useChatContextNative,
} from "./chat-context.provider.native";
import {
  ChatContextProvider as ChatProviderWeb,
  useChatContext as useChatContextWeb,
} from "./chat-context.provider.web";
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
      <ChatProviderWeb>{children}</ChatProviderWeb>
    )
  }

  return (
    <ChatProviderNative>{children}</ChatProviderNative>
  );
};

export default ChatContextProvider;
