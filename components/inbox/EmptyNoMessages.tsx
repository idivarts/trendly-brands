import { faInbox } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { ConnectedInboxAccount } from "./types";
import { channelLabel } from "./utils";

interface Props {
    accounts: ConnectedInboxAccount[];
}

const EmptyNoMessages: React.FC<Props> = ({ accounts }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const names =
        accounts.length > 0
            ? accounts.map((a) => channelLabel(a.channel)).join(" & ")
            : "your accounts";

    return (
        <View style={styles.container}>
            <View style={[styles.iconCircle, { backgroundColor: colors.tag }]}>
                <FontAwesomeIcon icon={faInbox} size={30} color={colors.textSecondary} />
            </View>
            <Text style={styles.title}>You're all caught up</Text>
            <Text style={styles.subtitle}>
                {names} {accounts.length > 1 ? "are" : "is"} connected. New DMs and
                comments will show up here as soon as they arrive.
            </Text>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 32,
                    backgroundColor: colors.background,
                },
                iconCircle: {
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                },
                title: {
                    fontSize: 19,
                    fontWeight: "800",
                    color: colors.text,
                    textAlign: "center",
                    marginBottom: 10,
                },
                subtitle: {
                    fontSize: 14,
                    lineHeight: 21,
                    color: colors.textSecondary,
                    textAlign: "center",
                    maxWidth: 380,
                },
            }),
        [colors]
    );
}

export default EmptyNoMessages;
