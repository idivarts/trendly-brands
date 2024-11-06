
import { Platform } from "react-native";
import { ChatProvider as ChatNativeNative } from "./chat.provider.native";
import { ChatProvider as ChatProviderWeb } from "./chat.provider.web";
import { PropsWithChildren } from "react";

export const ChatProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  if (Platform.OS === 'web') {
    return (
      <ChatProviderWeb>{children}</ChatProviderWeb>
    )
  }

  return (
    <ChatNativeNative>{children}</ChatNativeNative>
  );
};

export default ChatProvider;
