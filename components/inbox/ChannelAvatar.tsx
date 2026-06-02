import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import Colors from "@/shared-uis/constants/Colors";
import { InboxChannel } from "./types";
import { channelColor, channelIcon } from "./utils";

interface Props {
    avatarUrl?: string;
    channel: InboxChannel;
    size?: number;
}

const ChannelAvatar: React.FC<Props> = ({ avatarUrl, channel, size = 48 }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const badge = Math.round(size * 0.42);
    const styles = useStyles(colors, size, badge);

    return (
        <View style={styles.wrap}>
            <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
                transition={150}
            />
            <View style={[styles.badge, { backgroundColor: channelColor(channel, colors) }]}>
                <FontAwesomeIcon
                    icon={channelIcon(channel)}
                    size={Math.round(badge * 0.6)}
                    color={colors.white}
                />
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, size: number, badge: number) {
    return useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    width: size,
                    height: size,
                },
                avatar: {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: colors.tag,
                },
                badge: {
                    position: "absolute",
                    right: -2,
                    bottom: -2,
                    width: badge,
                    height: badge,
                    borderRadius: badge / 2,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.18,
                    elevation: 2,
                },
            }),
        [colors, size, badge]
    );
}

export default ChannelAvatar;
