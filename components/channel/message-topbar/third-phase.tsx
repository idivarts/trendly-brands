import React, { useState } from "react";
import { View } from "@/components/theme/Themed";
import { useTheme } from "@react-navigation/native";

import Button from "@/components/ui/button";
import { CHAT_MESSAGE_TOPBAR_DESCRIPTION } from "@/constants/ChatMessageTopbar";
import MessageTopbar from "@/shared-uis/components/chat-message-bar";
import FeedbackModal from "@/shared-uis/components/feedback-modal";

const ThirdPhase = () => {
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const theme = useTheme();

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
          console.log(rating, feedback);
          setFeedbackModalVisible(false);
        }}
        isVisible={feedbackModalVisible}
        setIsVisible={setFeedbackModalVisible}
        theme={theme}
      />
    </>
  );
}

export default ThirdPhase;
