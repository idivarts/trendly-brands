import { useChatContext } from "stream-chat-expo";
import {
  useChatContext as useChat,
} from "@/contexts";

export const useChatHookNative = () => {
  const {
    client,
  } = useChatContext();
  const {
    createGroupWithMembers,
  } = useChat();

  return {
    client,
    createGroupWithMembers,
  }
}