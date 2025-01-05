import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { Channel as ChannelType } from "stream-chat";
import { useLocalSearchParams } from "expo-router";

import { View } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import { Channel, MessageInput, MessageList, useChatContext } from "stream-chat-expo";
import ProfileIcon from "../explore-influencers/profile-icon";
import ChatMessageTopbar from "./chat-message-topbar";

const ChannelNative = () => {
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const { cid } = useLocalSearchParams<{ cid: string }>();

  const { client } = useChatContext();

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
              marginRight: 18,
              marginLeft: 12,
            }}
          >
            {/* TODO: This user icon should open the contract linked with the message. */}
            <ProfileIcon />
          </View>
        }
      />
      <ChatMessageTopbar
        status={0}
      />
      <MessageList />
      <MessageInput />
    </Channel>
  );
}

export default ChannelNative;
