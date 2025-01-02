import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { Channel as ChannelType } from "stream-chat";
import { useLocalSearchParams } from "expo-router";

import { View } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import { useTheme } from "@react-navigation/native";
import { Channel, MessageInput, MessageList, useChatContext } from "stream-chat-expo";
import ProfileIcon from "../explore-influencers/profile-icon";
import ChatMessageBar from "../../shared-uis/components/chat-message-bar";
import Button from "../ui/button";
import FeedbackModal from "@/shared-uis/components/feedback-modal";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import Colors from "@/constants/Colors";
import { CHAT_MESSAGE_BAR_DESCRIPTION } from "@/constants/ChatMessageBar";

const ChannelNative = () => {
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);

  const { client } = useChatContext();

  const theme = useTheme();

  useEffect(() => {
    const fetchChannel = async () => {
      const channels = await client.queryChannels({ cid });
      setChannel(channels[0]);
    };

    fetchChannel();
  }, [cid]);

  if (!channel) {
    return (
      <View
        style={{
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Channel channel={channel} audioRecordingEnabled>
      <ScreenHeader
        title={channel?.data?.name || 'Chat'}
        rightAction
        rightActionButton={
          <View
            style={{
              marginRight: 12,
            }}
          >
            {/* TODO: This user icon should open the contract linked with the message. */}
            <ProfileIcon />
          </View>
        }
      />
      <ChatMessageBar
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
            {/* <Button
              size="small"
              mode="text"
              onPress={() => setFeedbackModalVisible(true)}
              >
              Give Feedback
              </Button> */}
          </View>
        }
        description={CHAT_MESSAGE_BAR_DESCRIPTION.first}
        rightAction={
          <Pressable>
            <FontAwesomeIcon
              icon={faClose}
              color={Colors(theme).primary}
              size={16}
            />
          </Pressable>
        }
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
      <MessageList />
      <MessageInput />
    </Channel>
  );
}

export default ChannelNative;
