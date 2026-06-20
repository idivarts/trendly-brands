import { CHAT_MESSAGE_TOPBAR_DESCRIPTION } from "@/constants/ChatMessageTopbar";
import MessageTopbar from "@/shared-uis/components/chat-message-bar";
import { View } from "@/shared-uis/components/theme/Themed";
import { Contract } from "@/types/Contract";
import { ContractStatus } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { useRouter } from "expo-router";
import { useState } from "react";
import Button from "../ui/button";

interface ChatMessageTopbarProps {
    contract: Contract;
}

const BUTTON_LABELS: Partial<Record<ContractStatus, string>> = {
    [ContractStatus.Pending]: "Open Application",
    [ContractStatus.ShipmentPending]: "Add Shipment Details",
    [ContractStatus.ReviewPending]: "Review Deliverable",
    [ContractStatus.SettlementPending]: "Give Feedback",
};

const ChatMessageTopbar: React.FC<ChatMessageTopbarProps> = ({ contract }) => {
    const [status] = useState(contract.status);
    const router = useRouter();

    const description = CHAT_MESSAGE_TOPBAR_DESCRIPTION[status as ContractStatus];
    if (!description) return null;

    const buttonLabel = BUTTON_LABELS[status as ContractStatus];

    return (
        <MessageTopbar
            actions={
                buttonLabel ? (
                    <View
                        style={{
                            flexDirection: "row-reverse",
                            gap: 16,
                            justifyContent: "space-between",
                        }}
                    >
                        <Button
                            size="small"
                            mode="text"
                            onPress={() => {
                                router.push(`/contract-details/${contract.streamChannelId}`);
                            }}
                        >
                            {buttonLabel}
                        </Button>
                    </View>
                ) : undefined
            }
            description={description}
        />
    );
};

export default ChatMessageTopbar;
