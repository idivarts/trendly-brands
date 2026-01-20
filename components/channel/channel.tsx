import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable } from "react-native";
import { Channel as ChannelType } from "stream-chat";

import { View } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import Colors from "@/constants/Colors";
import { useAuthContext, useChatContext, useContractContext } from "@/contexts";
import { streamClient } from "@/contexts/streamClient";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { Console } from "@/shared-libs/utils/console";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import FirstMessageThreadModal from "@/shared-uis/components/FirstMessageThreadModal";
import { User } from "@/types/User";
import { imageUrl } from "@/utils/url";
import { useTheme } from "@react-navigation/native";
import { Avatar } from "react-native-paper";
import { Channel, MessageInput, MessageList } from "stream-chat-expo";
import ChatMessageTopbar from "./chat-message-topbar";
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
    const [showFirstMessageModal, setShowFirstMessageModal] = useState(false);
    const { cid } = useLocalSearchParams<{ cid: string }>();

    const theme = useTheme();

    const client = streamClient
    const { connectUser } = useChatContext()

    const { getContractById } = useContractContext();

    const router = useRouter();

    const {
        getInfluencerById,
        manager
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

    const { isStreamConnected } = useChatContext()
    const fetchChannel = async () => {
        await connectUser()
        const channels = await client.queryChannels({ cid });
        setChannel(channels[0]);

        // @ts-ignore
        if (channels[0]?.data?.contractId) {
            // @ts-ignore
            await fetchContract(channels[0]?.data?.contractId as string);
        }
    };

    useEffect(() => {
        if (channel && cid) {
            // Check if modal has been shown for this channel before
            const checkAndShowModal = async () => {
                const modalShownKey = `firstMessageModal_${cid}`;
                const hasShown = await PersistentStorage.get(modalShownKey);

                if (!hasShown) {
                    setShowFirstMessageModal(true);
                    // Mark as shown for this channel
                    await PersistentStorage.set(modalShownKey, 'true');
                }
            };

            checkAndShowModal();
        }
    }, [channel, cid]);

    useEffect(() => {
        if (cid && isStreamConnected)
            fetchChannel();
    }, [cid, isStreamConnected]);

    useEffect(() => {
        if (contract?.userId && manager) {
            fetchInfluencer(contract.userId);
        }
    }, [contract, manager]);

    useEffect(() => {
        const resetBadgeCount = async () => {
            if (Platform.OS === "ios" || Platform.OS === "android") {
                try {
                    await Notifications.setBadgeCountAsync(0);
                } catch (error) {
                    Console.error(error, "Failed to reset badge count");
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

    // @ts-ignore
    const channelName = channel?.data?.name || '';
    const influencerName = influencer?.name ? ` ${influencer.name}` : '';
    const title = channelName + influencerName || 'Chat';

    return (
        <View style={{ flex: 1 }}>
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
                        // @ts-ignore
                        id: channel?.data?.contractId as string,
                    }}
                />
                <MessageList />
                <MessageInput
                    AttachmentPickerSelectionBar={AttachmentPickerSelectionBar}
                />
            </Channel>
            <FirstMessageThreadModal
                visible={showFirstMessageModal}
                setVisible={setShowFirstMessageModal}
                onClose={() => {
                    setShowFirstMessageModal(false);
                }}
            />
        </View>
    );
}

export default ChannelNative;
