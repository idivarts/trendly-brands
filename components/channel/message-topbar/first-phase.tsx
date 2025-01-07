import { View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import { CHAT_MESSAGE_TOPBAR_DESCRIPTION } from "@/constants/ChatMessageTopbar";
import { useChatContext, useContractContext } from "@/contexts";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import MessageTopbar from "@/shared-uis/components/chat-message-bar";
import Toaster from "@/shared-uis/components/toaster/Toaster";

interface FirstPhaseProps {
  contractId: string;
  contract: IContracts;
  setStatus: React.Dispatch<React.SetStateAction<number>>;
}

const FirstPhase: React.FC<FirstPhaseProps> = ({
  contractId,
  contract,
  setStatus,
}) => {
  const {
    updateContract,
  } = useContractContext();

  const {
    sendSystemMessage,
  } = useChatContext();

  const startContract = async () => {
    await updateContract(contractId, {
      ...contract,
      status: 1,
    }).then(() => {
      Toaster.success("Contract started");
      setStatus(1);
    });
  }

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
            onPress={startContract}
          >
            Start Collaboration
          </Button>
          <Button
            size="small"
            mode="text"
            onPress={() => {
              sendSystemMessage(contractId, "Brand has requested to revise the quote.");
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
