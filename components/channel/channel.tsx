import AddMember from "@/components/channel/add-member";
import { View } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import Colors from "@/constants/Colors";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { Channel as ChannelType } from "stream-chat";
import { Channel, MessageInput, MessageList, useChatContext } from "stream-chat-expo";

const ChannelNative = () => {
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const [modalVisible, setModalVisible] = useState(false);
  const theme = useTheme();

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
          <Pressable
            onPress={() => setModalVisible(true)}
          >
            <FontAwesomeIcon
              icon={faPlus}
              size={20}
              color={Colors(theme).text}
            />
          </Pressable>
        }
      />
      <MessageList />
      <MessageInput />
      <AddMember
        channel={channel}
        setVisible={setModalVisible}
        visible={modalVisible}
      />
    </Channel>
  );
}

export default ChannelNative;
