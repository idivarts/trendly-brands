import ChannelListNative from "@/components/channel/channel-list";
import ChannelListWeb from "@/components/channel/channel-list.web";
import { Platform } from "react-native";

const ChannelScreen = () => {
  if (Platform.OS === 'web') {
    return <ChannelListWeb />
  }
  return (
    <ChannelListNative />
  );
}

export default ChannelScreen;
