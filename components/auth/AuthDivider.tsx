import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type AuthDividerProps = {
    /** Centered label between the two rules. Defaults to "or continue with". */
    label?: string;
};

/**
 * Horizontal "or continue with" separator between the email-first primary path
 * and the social provider options on the pre-signin screen. The rules are thin
 * background-coloured Views (not borders) per the project's shadows-over-borders
 * rule, and read correctly in both themes.
 */
const AuthDivider: React.FC<AuthDividerProps> = ({ label = "or continue with" }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    return (
        <View style={styles.row}>
            <View style={styles.rule} />
            <Text style={styles.label}>{label}</Text>
            <View style={styles.rule} />
        </View>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        rule: {
            flex: 1,
            height: 1,
            backgroundColor: colors.tag,
        },
        label: {
            fontSize: 13,
            fontWeight: "500",
            color: colors.textSecondary,
        },
    });
}

export default AuthDivider;
