import { Platform } from "react-native";
import { useChatHookNative } from "./use-chat.native";
import { useChatHookWeb } from "./use-chat.web";

export const useChatHook = () => {
  const {
    client: clientNative,
    createGroupWithMembers: createGroupWithMembersNative
  } = useChatHookNative();

  const {
    client: clientWeb,
    createGroupWithMembers: createGroupWithMembersWeb
  } = useChatHookWeb();

  if (Platform.OS === 'web') {
    return {
      client: clientWeb,
      createGroupWithMembers: createGroupWithMembersWeb,
    }
  }

  return {
    client: clientNative,
    createGroupWithMembers: createGroupWithMembersNative,
  }
};
