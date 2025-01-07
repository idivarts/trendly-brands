import React, { useState } from "react";
import { View } from "@/components/theme/Themed";
import { useTheme } from "@react-navigation/native";

import Button from "@/components/ui/button";
import { CHAT_MESSAGE_TOPBAR_DESCRIPTION } from "@/constants/ChatMessageTopbar";
import MessageTopbar from "@/shared-uis/components/chat-message-bar";
import FeedbackModal from "@/shared-uis/components/feedback-modal";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { useAuthContext, useContractContext } from "@/contexts";
import Toaster from "@/shared-uis/components/toaster/Toaster";

interface ThirdPhaseProps {
  contract: IContracts;
  contractId: string;
  setStatus: React.Dispatch<React.SetStateAction<number>>;
}

const ThirdPhase: React.FC<ThirdPhaseProps> = ({
  contract,
  contractId,
  setStatus,
}) => {
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const theme = useTheme();

  const {
    updateContract,
  } = useContractContext();
  const {
    manager,
  } = useAuthContext();

  const handleFeedbackSubmit = async (
    rating: number,
    feedback: string,
  ) => {
    await updateContract(contractId, {
      ...contract,
      feedbackFromBrand: {
        ratings: rating,
        feedbackReview: feedback,
        timeSubmitted: new Date().getTime(),
        managerId: manager?.id,
      },
    }).then(() => {
      Toaster.success("Feedback submitted successfully");
      setStatus(3);
    });
  }

  return (
    <>
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
              onPress={() => setFeedbackModalVisible(true)}
            >
              Give Feedback
            </Button>
          </View>
        }
        description={CHAT_MESSAGE_TOPBAR_DESCRIPTION.third}
      />
      <FeedbackModal
        onSubmit={(
          rating: number,
          feedback: string,
        ) => {
          handleFeedbackSubmit(rating, feedback).then(() => {
            setFeedbackModalVisible(false);
          });
        }}
        isVisible={feedbackModalVisible}
        setIsVisible={setFeedbackModalVisible}
        theme={theme}
      />
    </>
  );
}

export default ThirdPhase;
