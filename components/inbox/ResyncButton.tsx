import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import Colors from "@/shared-uis/constants/Colors";

interface Props {
    onPress: () => void;
    busy?: boolean;
    size?: number;
    /** Accessibility label, e.g. "Resync profile". */
    label: string;
    /** Override the icon tint (defaults to the quiet textSecondary). */
    color?: string;
}

/**
 * The single, consistent resync control used across every inbox/analytics
 * surface. Quiet by default (textSecondary, no background), spins while busy,
 * with a generous hit area. Reveal/placement is the caller's concern; this is
 * just the affordance.
 */
const ResyncButton: React.FC<Props> = ({ onPress, busy, size = 15, label, color }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const tint = color ?? colors.textSecondary;

    return (
        <Pressable
            onPress={onPress}
            disabled={busy}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
            {busy ? (
                <ActivityIndicator size="small" color={tint} />
            ) : (
                <FontAwesomeIcon icon={faArrowsRotate} size={size} color={tint} />
            )}
        </Pressable>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                btn: {
                    width: 30,
                    height: 30,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                },
                pressed: {
                    backgroundColor: colors.tag,
                },
            }),
        [colors]
    );
}

export default ResyncButton;
