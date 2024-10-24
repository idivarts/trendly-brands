import { ChannelList } from "stream-chat-expo";

import { router } from "expo-router";
import { useAuthContext } from "@/contexts";
import { View } from "@/components/theme/Themed";
import { IconButton } from "react-native-paper";
import AddGroup from "@/components/channel/add-group";
import { useState } from "react";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";

const ChannelListScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const theme = useTheme();

  const {
    manager: user,
  } = useAuthContext();

  if (!user?.id) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        position: "relative",
      }}
    >
      <ChannelList
        filters={{
          members: { $in: [user?.id as string] },
        }}
        onSelect={(channel) => {
          router.push(`/channel/${channel.cid}`);
        }}
      />
      <IconButton
        icon="plus"
        onPress={() => setModalVisible(true)}
        size={32}
        style={{
          position: "absolute",
          right: 10,
          bottom: 10,
          backgroundColor: Colors(theme).aliceBlue,
        }}
      />
      <AddGroup
        visible={modalVisible}
        setVisible={setModalVisible}
      />
    </View>
  );
};

export default ChannelListScreen;
