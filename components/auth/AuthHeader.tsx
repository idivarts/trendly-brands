import Colors from "@/shared-uis/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type AuthHeaderProps = {
    title: string;
    subtitle?: string;
    /**
     * When provided, a top-left "Back" affordance is rendered above the title.
     * The header always reserves the back row's height (even without onBack) so
     * the title sits at the same vertical position on every auth screen.
     */
    onBack?: () => void;
};

/**
 * Shared header for every auth screen (pre-signin, login, create-new-account,
 * forgot-password). Owns the single source of truth for auth title/subtitle
 * typography and the top-left back affordance, so the four screens read as one
 * consistent flow.
 */
const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle, onBack }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    return (
        <View style={styles.header}>
            <View style={styles.backRow}>
                {!!onBack && (
                    <Pressable
                        onPress={onBack}
                        accessibilityRole="button"
                        accessibilityLabel="Back"
                        hitSlop={8}
                        style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
                    >
                        <Ionicons name="chevron-back" size={20} color={colors.text} />
                        <Text style={styles.backLabel}>Back</Text>
                    </Pressable>
                )}
            </View>

            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        header: {
            marginBottom: 24,
        },
        backRow: {
            height: 32,
            justifyContent: "center",
            marginBottom: 8,
        },
        backButton: {
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 2,
            paddingVertical: 4,
            paddingRight: 8,
        },
        backPressed: {
            opacity: 0.6,
        },
        backLabel: {
            fontSize: 15,
            fontWeight: "600",
            color: colors.text,
        },
        title: {
            fontSize: 26,
            fontWeight: "700",
            letterSpacing: 0.2,
            textAlign: "center",
            color: colors.text,
        },
        subtitle: {
            marginTop: 8,
            fontSize: 15,
            lineHeight: 22,
            textAlign: "center",
            color: colors.textSecondary,
        },
    });
}

export default AuthHeader;
