import { ChannelList } from "stream-chat-expo";

import { router } from "expo-router";
import { useAuthContext } from "@/contexts";

const ChannelListScreen = () => {
  const {
    manager: user,
  } = useAuthContext();

  if (!user?.id) {
    return null;
  }

  return (
    <ChannelList
      filters={{
        members: { $in: [user?.id as string] },
      }}
      onSelect={(channel) => {
        router.push(`/channel/${channel.cid}`);
      }}
    />
  );
};

export default ChannelListScreen;
