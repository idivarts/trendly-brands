import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { Channel as ChannelType } from "stream-chat";
import { useLocalSearchParams } from "expo-router";

import { View } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import { Channel, MessageInput, MessageList, useChatContext } from "stream-chat-expo";
import ProfileIcon from "../explore-influencers/profile-icon";
import ChatMessageTopbar from "./chat-message-topbar";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { useContractContext } from "@/contexts";

const ChannelNative = () => {
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [contract, setContract] = useState<IContracts | null>(null);
  const { cid } = useLocalSearchParams<{ cid: string }>();

  const { client } = useChatContext();
  const { getContractById } = useContractContext();

  const fetchContract = async (
    contractId: string,
  ) => {
    const contractData = await getContractById(contractId);
    setContract(contractData);
  }

  useEffect(() => {
    const fetchChannel = async () => {
      const channels = await client.queryChannels({ cid });
      setChannel(channels[0]);

      if (channels[0]?.data?.contractId) {
        await fetchContract(channels[0]?.data?.contractId as string);
      }
    };

    fetchChannel();
  }, [cid]);

  if (!channel || !contract) {
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
        contract={{
          ...contract,
          id: channel?.data?.contractId as string,
        }}
      />
      <MessageList />
      <MessageInput />
    </Channel>
  );
}

export default ChannelNative;
