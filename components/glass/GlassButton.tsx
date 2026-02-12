import React, { useRef } from "react";
import { Animated, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

type GlassButtonVariant = "primary" | "secondary";

interface GlassButtonProps {
    label: string;
    onPress: () => void;
    variant?: GlassButtonVariant;
    accentColor: string;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
}

const BUTTON_HEIGHT = 52;
const BUTTON_RADIUS = 16;
const BUTTON_BORDER_WIDTH = 1;
const BUTTON_PADDING_HORIZONTAL = 20;
const LABEL_FONT_SIZE = 16;
const LABEL_LETTER_SPACING = 0.2;
const PRESS_SCALE = 0.98;
const PRESS_OPACITY = 0.9;
const DEFAULT_OPACITY = 1;
const PRESS_DURATION = 120;
const SECONDARY_SURFACE = "rgba(15, 23, 42, 0.16)";
const SECONDARY_BORDER = "rgba(15, 23, 42, 0.28)";
const SECONDARY_TEXT = "#0F172A";
const PRIMARY_TEXT = "#FFFFFF";

const GlassButton = ({
    label,
    onPress,
    variant = "secondary",
    accentColor,
    disabled,
    style,
}: GlassButtonProps) => {
    const isPrimary = variant === "primary";
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: PRESS_SCALE,
                duration: PRESS_DURATION,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: PRESS_OPACITY,
                duration: PRESS_DURATION,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: DEFAULT_OPACITY,
                duration: PRESS_DURATION,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: DEFAULT_OPACITY,
                duration: PRESS_DURATION,
                useNativeDriver: true,
            }),
        ]).start();

        // Execute onPress after animation
        if (!disabled) {
            setTimeout(() => onPress(), 0);
        }
    };

    return (
        <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            activeOpacity={1}
        >
            <Animated.View
                style={[
                    styles.base,
                    isPrimary
                        ? { backgroundColor: accentColor, borderColor: accentColor }
                        : { backgroundColor: SECONDARY_SURFACE, borderColor: SECONDARY_BORDER },
                    disabled && styles.disabled,
                    style,
                    {
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                    },
                ]}
            >
                <Text style={[styles.label, isPrimary ? styles.primaryLabel : { color: SECONDARY_TEXT }]}>
                    {label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        height: BUTTON_HEIGHT,
        borderRadius: BUTTON_RADIUS,
        borderWidth: BUTTON_BORDER_WIDTH,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: BUTTON_PADDING_HORIZONTAL,
    },
    label: {
        fontSize: LABEL_FONT_SIZE,
        fontWeight: "600",
        letterSpacing: LABEL_LETTER_SPACING,
    },
    primaryLabel: {
        color: PRIMARY_TEXT,
    },
    disabled: {
        opacity: 0.6,
    },
});

export default GlassButton;
