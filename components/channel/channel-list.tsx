import { Channel as ChannelType } from "stream-chat";
import { ChannelList } from "stream-chat-expo";

import { View } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { useAuthContext, useChatContext } from "@/contexts";
import { Console } from "@/shared-libs/utils/console";
import stylesFn from "@/styles/searchbar/Searchbar.styles";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { Searchbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmptyMessageState from "./empty-message-state";

const ChannelListNative = () => {
    const [searchInput, setSearchInput] = useState("");
    const theme = useTheme();
    const styles = stylesFn(theme);
    // This screen is rendered bare by the route — no PageHeader and no
    // top-inset AppLayout above it — so the search row owns the status-bar inset.
    const insets = useSafeAreaInsets();
    const layoutStyles = useLayoutStyles(insets.top);

    const {
        manager: user,
    } = useAuthContext();

    const { hasError, connectUser } = useChatContext()

    useFocusEffect(
        useCallback(() => {
            if (hasError) {
                Console.log("Trying to connect to chat");
                connectUser();
            }
        }, [])
    );

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
            return (channel.data as any)?.name?.toLowerCase().includes(searchInput.toLowerCase());
        });
    };

    return (
        <View style={layoutStyles.root}>
            <View style={layoutStyles.searchRow}>
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
            {hasError ? <EmptyMessageState /> :
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
                />}
        </View>
    );
};

const useLayoutStyles = (topInset: number) =>
    useMemo(
        () =>
            StyleSheet.create({
                root: { flex: 1 },
                searchRow: {
                    padding: 16,
                    paddingTop: 16 + topInset,
                    flexDirection: "row",
                },
            }),
        [topInset]
    );

export default ChannelListNative;
