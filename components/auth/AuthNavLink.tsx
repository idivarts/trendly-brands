import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, Text } from "react-native";

type AuthNavLinkProps = {
    /** Optional leading prompt, e.g. "Already have an account?". */
    prompt?: string;
    /** The tappable action text, e.g. "Log in". */
    action: string;
    onPress: () => void;
};

/**
 * One consistent inline cross-nav link for the auth screens (switch to login /
 * sign up / forgot password / back to log in). Always rendered inside
 * `authLayoutStyles.navStack`, directly under the primary button.
 */
const AuthNavLink: React.FC<AuthNavLinkProps> = ({ prompt, action, onPress }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    return (
        <Text style={styles.prompt}>
            {!!prompt && `${prompt} `}
            <Text
                style={styles.action}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={action}
            >
                {action}
            </Text>
        </Text>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        prompt: {
            fontSize: 14,
            textAlign: "center",
            color: colors.textSecondary,
        },
        action: {
            fontWeight: "700",
            color: colors.primary,
        },
    });
}

export default AuthNavLink;
