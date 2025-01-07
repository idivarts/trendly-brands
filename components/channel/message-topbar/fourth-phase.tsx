import { CHAT_MESSAGE_TOPBAR_DESCRIPTION } from "@/constants/ChatMessageTopbar";
import MessageTopbar from "@/shared-uis/components/chat-message-bar";

const FourthPhase = () => {
  return (
    <MessageTopbar
      description={CHAT_MESSAGE_TOPBAR_DESCRIPTION.fourth}
    />
  );
}

export default FourthPhase;
