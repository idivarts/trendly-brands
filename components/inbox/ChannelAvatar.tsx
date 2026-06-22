import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { InboxChannel } from "./types";
import { channelColor, channelIcon } from "./utils";

interface Props {
    avatarUrl?: string;
    channel: InboxChannel;
    size?: number;
    /** Name/handle used to render an initials placeholder when there's no photo
     * (e.g. Instagram "no consent to access profile"). */
    name?: string;
    handle?: string;
}

/** First letter to show in the monogram, or "" when we know nothing about them. */
function initialOf(name?: string, handle?: string): string {
    const src = (name || handle || "").trim();
    const ch = [...src].find((c) => /[a-z0-9]/i.test(c));
    return ch ? ch.toUpperCase() : "";
}

const ChannelAvatar: React.FC<Props> = ({ avatarUrl, channel, size = 48, name, handle }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const badge = Math.round(size * 0.42);
    const styles = useStyles(colors, size, badge);
    const initial = initialOf(name, handle);

    return (
        <View style={styles.wrap}>
            {avatarUrl ? (
                <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={150}
                />
            ) : (
                // No photo (or no profile consent) — a calm initials monogram
                // reads as "no photo", never as a broken/loading tile.
                <View
                    style={[styles.avatar, styles.fallback]}
                    accessibilityLabel={name || handle || undefined}
                >
                    {initial ? (
                        <Text style={[styles.initial, { fontSize: Math.round(size * 0.42) }]}>
                            {initial}
                        </Text>
                    ) : (
                        <FontAwesomeIcon
                            icon={faUser}
                            size={Math.round(size * 0.42)}
                            color={colors.textSecondary}
                        />
                    )}
                </View>
            )}
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
                fallback: {
                    alignItems: "center",
                    justifyContent: "center",
                },
                initial: {
                    color: colors.text,
                    fontWeight: "800",
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
