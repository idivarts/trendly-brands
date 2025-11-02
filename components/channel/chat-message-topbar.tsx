import { CHAT_MESSAGE_TOPBAR_DESCRIPTION } from "@/constants/ChatMessageTopbar";
import MessageTopbar from "@/shared-uis/components/chat-message-bar";
import { View } from "@/shared-uis/components/theme/Themed";
import { Contract } from "@/types/Contract";
import { useRouter } from "expo-router";
import { useState } from "react";
import Button from "../ui/button";

interface ChatMessageTopbarProps {
  contract: Contract;
}

const ChatMessageTopbar: React.FC<ChatMessageTopbarProps> = ({
  contract,
}) => {
  const [status, setStatus] = useState(contract.status);
  const router = useRouter();

  if (status === 0) {
    return <MessageTopbar
      actions={
        <View
          style={{
            flexDirection: 'row-reverse',
            gap: 16,
            justifyContent: 'space-between',
          }}
        >
          <Button
            size="small"
            mode="text"
            onPress={() => {
              router.push(`/contract-details/${contract.streamChannelId}`)
            }}
          >
            {"Open Application Jerry"}
          </Button>
        </View>
      }
      description={CHAT_MESSAGE_TOPBAR_DESCRIPTION.first}
    />
  } else {
    return null;
  }
}

export default ChatMessageTopbar;
