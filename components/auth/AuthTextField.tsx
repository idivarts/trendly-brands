import TextInput from "@/components/ui/text-input";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { TextInputProps } from "react-native-paper";

type AuthTextFieldProps = Omit<TextInputProps, "label"> & {
    /** Shown as a persistent label above the field (not a floating label). */
    label: string;
};

/**
 * Auth form field with a static label above the input.
 *
 * We deliberately avoid react-native-paper's floating label here: the browser's
 * autofill *preview* paints a value while keeping `input.value` empty and
 * unreadable to JS, so a value-driven floating label never lifts and ends up
 * overlapping the previewed text. A static label + native placeholder is
 * managed by the browser and never collides with autofill.
 */
const AuthTextField: React.FC<AuthTextFieldProps> = ({ label, placeholder, style, ...props }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    // Soft rest border in light mode (the default paper outline is a heavy
    // mid-grey); a visible-but-subtle border in dark mode where a light hairline
    // would glare. Rounded to match the auth buttons (no dated sharp corners).
    const restOutline = theme.dark ? colors.outline : colors.borderLight;

    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                mode="outlined"
                placeholder={placeholder ?? label}
                placeholderTextColor={colors.textSecondary}
                textColor={colors.text}
                outlineColor={restOutline}
                outlineStyle={styles.outline}
                style={[styles.input, style]}
                {...props}
            />
        </View>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        field: {
            gap: 6,
        },
        label: {
            color: colors.text,
            fontSize: 13,
            fontWeight: "700",
        },
        input: {
            backgroundColor: colors.background,
        },
        outline: {
            borderRadius: 12,
        },
    });
}

export default AuthTextField;
