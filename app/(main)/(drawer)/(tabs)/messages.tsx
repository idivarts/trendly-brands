import { Platform } from "react-native";
import ChannelListWeb from "@/components/channel/channel-list.web";
import ChannelListNative from "@/components/channel/channel-list";

const ChannelListScreen = () => {
  if (Platform.OS === 'web') {
    return <ChannelListWeb />
  }
  return (
    <ChannelListNative />
  );
};

export default ChannelListScreen;
