import ChannelNative from "@/components/channel/channel";
import ChannelWeb from "@/components/channel/channel.web";
import { Platform } from "react-native";

const ChannelScreen = () => {
  if (Platform.OS === 'web') {
    return <ChannelWeb />
  }
  return (
    <ChannelNative />
  );
}

export default ChannelScreen;
