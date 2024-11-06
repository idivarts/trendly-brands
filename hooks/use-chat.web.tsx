import {
  useChatContext as useChat,
} from "@/contexts";

export const useChatHookWeb = () => {
  const client = '';
  const {
    createGroupWithMembers,
  } = useChat();

  return {
    client,
    createGroupWithMembers,
  }
}