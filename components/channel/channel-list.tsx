import { ChannelList } from "stream-chat-expo";
import { Channel as ChannelType } from "stream-chat";

import { router } from "expo-router";
import { useAuthContext } from "@/contexts";
import { View } from "@/components/theme/Themed";
import { IconButton } from "react-native-paper";
import AddGroup from "@/components/channel/add-group";
import { useState } from "react";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { Searchbar } from "react-native-paper";

const ChannelListNative = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const theme = useTheme();

  const {
    manager: user,
  } = useAuthContext();

  if (!user?.id) {
    return null;
  }

  const handleSearchChange = (text: string) => {
    setSearchInput(text);
  }

  const customChannelFilterFunction = (channels: ChannelType[]) => {
    if (!channels) {
      return [];
    }

    if (!searchInput) {
      return channels;
    }

    return channels.filter((channel) => {
      return channel.data?.name?.toLowerCase().includes(searchInput.toLowerCase());
    });
  };

  return (
    <View
      style={{
        flex: 1,
        position: "relative",
      }}
    >
      <View
        style={{
          padding: 16,
          paddingTop: 16,
        }}
      >
        <Searchbar
          onChangeText={handleSearchChange}
          placeholder="Search"
          placeholderTextColor={Colors(theme).gray100}
          value={searchInput}
          style={[
            {
              borderRadius: 15,
              backgroundColor: Colors(theme).aliceBlue
            },
          ]}
        />
      </View>
      <ChannelList
        channelRenderFilterFn={customChannelFilterFunction}
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

export default ChannelListNative;
