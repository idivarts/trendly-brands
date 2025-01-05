import { View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import { CHAT_MESSAGE_TOPBAR_DESCRIPTION } from "@/constants/ChatMessageTopbar";
import MessageTopbar from "@/shared-uis/components/chat-message-bar";

const FirstPhase = () => {
  return (
    <MessageTopbar
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
              // TODO: Set status of contract to active
            }}
          >
            Start Collaboration
          </Button>
          <Button
            size="small"
            mode="text"
            onPress={() => {
              // TODO: This should create a system message in this channel. The content I would post in this comment itself.
            }}
          >
            Ask to Revise Quote
          </Button>
        </View>
      }
      description={CHAT_MESSAGE_TOPBAR_DESCRIPTION.first}
    />
  );
}

export default FirstPhase;
