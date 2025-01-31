import { ChannelList } from "stream-chat-expo";
import { Channel as ChannelType } from "stream-chat";

import { router } from "expo-router";
import { useAuthContext } from "@/contexts";
import { View } from "@/components/theme/Themed";
import { useState } from "react";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { Searchbar } from "react-native-paper";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import stylesFn from "@/styles/searchbar/Searchbar.styles";
import EmptyMessageState from "./empty-message-state";

const ChannelListNative = () => {
  const [searchInput, setSearchInput] = useState("");
  const theme = useTheme();
  const styles = stylesFn(theme);

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
      }}
    >
      <View
        style={{
          padding: 16,
          paddingTop: 16,
          flexDirection: "row",
        }}
      >
        <Searchbar
          icon={() => (
            <FontAwesomeIcon
              color={Colors(theme).gray100}
              icon={faMagnifyingGlass}
              size={18}
            />
          )}
          iconColor={Colors(theme).gray100}
          inputStyle={styles.searchbarInput}
          onChangeText={handleSearchChange}
          placeholder="Search"
          placeholderTextColor={Colors(theme).gray100}
          style={styles.searchbar}
          value={searchInput}
        />
      </View>
      <ChannelList
        EmptyStateIndicator={EmptyMessageState}
        LoadingErrorIndicator={EmptyMessageState}
        channelRenderFilterFn={customChannelFilterFunction}
        filters={{
          members: { $in: [user?.id as string] },
        }}
        onSelect={(channel) => {
          router.push(`/channel/${channel.cid}`);
        }}
      />
    </View>
  );
};

export default ChannelListNative;
