import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable } from "react-native";
import { Channel as ChannelType } from "stream-chat";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";

import { View } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import { Channel, MessageInput, MessageList, useChatContext } from "stream-chat-expo";
import ChatMessageTopbar from "./chat-message-topbar";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { useAuthContext, useContractContext } from "@/contexts";
import { Avatar } from "react-native-paper";
import Colors from "@/constants/Colors";
import { imageUrl } from "@/utils/url";
import { User } from "@/types/User";
import { useTheme } from "@react-navigation/native";
import {
  AttachButton,
  AttachmentPickerSelectionBar,
  CommandsButton,
  MoreOptionsButton,
  SendButton,
} from "./components";

const ChannelNative = () => {
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [contract, setContract] = useState<IContracts | null>(null);
  const [influencer, setInfluencer] = useState<User | null>(null);
  const { cid } = useLocalSearchParams<{ cid: string }>();

  const theme = useTheme();

  const { client } = useChatContext();
  const { getContractById } = useContractContext();

  const router = useRouter();

  const {
    getInfluencerById,
  } = useAuthContext();

  const fetchInfluencer = async (
    influencerId: string,
  ) => {
    const influencerData = await getInfluencerById(influencerId);
    setInfluencer(influencerData);
  }

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

  useEffect(() => {
    if (contract?.userId) {
      fetchInfluencer(contract.userId);
    }
  }, [contract]);

  useEffect(() => {
    const resetBadgeCount = async () => {
      if (Platform.OS === "ios" || Platform.OS === "android") {
        try {
          await Notifications.setBadgeCountAsync(0);
        } catch (error) {
          console.error("Failed to reset badge count:", error);
        }
      }
    };

    resetBadgeCount();
  }, []);

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

  const channelName = channel?.data?.name || '';
  const influencerName = influencer?.name ? ` w ${influencer.name}` : '';
  const title = channelName + influencerName || 'Chat';

  return (
    <Channel
      AttachButton={AttachButton}
      audioRecordingEnabled
      channel={channel}
      CommandsButton={CommandsButton}
      MoreOptionsButton={MoreOptionsButton}
      SendButton={SendButton}
    >
      <ScreenHeader
        title={title}
        rightAction
        rightActionButton={
          <Pressable
            style={{
              marginRight: 8,
            }}
            onPress={() => {
              router.push(`/contract-details/${contract.streamChannelId}`);
            }}
          >
            <Avatar.Image
              style={{
                backgroundColor: Colors(theme).transparent,
              }}
              size={40}
              source={imageUrl(influencer?.profileImage)}
            />
          </Pressable>
        }
      />
      <ChatMessageTopbar
        contract={{
          ...contract,
          id: channel?.data?.contractId as string,
        }}
      />
      <MessageList />
      <MessageInput
        AttachmentPickerSelectionBar={AttachmentPickerSelectionBar}
      />
    </Channel>
  );
}

export default ChannelNative;
