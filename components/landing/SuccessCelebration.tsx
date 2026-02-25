import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type SuccessCelebrationProps = {
    visible: boolean;
    onDone?: () => void;
    message?: string;
    durationMs?: number;
};

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
    visible,
    onDone,
    message = "Success!",
    durationMs = 1400,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const scale = useRef(new Animated.Value(0.6)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const ring = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!visible) return;

        // Reset values each time it's shown
        scale.setValue(0.6);
        opacity.setValue(0);
        ring.setValue(0);

        // Main pop-in + slight pulse
        Animated.sequence([
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1.05, duration: 220, useNativeDriver: true }),
            ]),
            Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
            // Subtle expanding ring
            Animated.timing(ring, { toValue: 1, duration: 360, useNativeDriver: true }),
        ]).start();

        const doneTimer = setTimeout(() => {
            Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
                onDone && onDone();
            });
        }, durationMs);

        return () => clearTimeout(doneTimer);
    }, [visible]);

    if (!visible) return null;

    const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
    const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] });

    return (
        <View style={styles.overlay}>
            <Animated.View
                style={[styles.backdrop, { opacity }]}
                pointerEvents="auto"
            />

            <Animated.View
                style={[
                    styles.ring,
                    {
                        transform: [{ scale: ringScale }],
                        opacity: ringOpacity,
                    },
                ]}
            />

            <Animated.View
                style={[styles.badge, { transform: [{ scale }], opacity }]}
            >
                <View style={styles.badgeInner}>
                    <Text style={styles.checkText}>✓</Text>
                </View>
                <Text style={styles.messageText}>{message}</Text>
            </Animated.View>
        </View>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        overlay: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
        },
        backdrop: {
            position: "absolute",
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors.backdrop,
        },
        ring: {
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: 80,
            borderWidth: 3,
            borderColor: colors.primary,
        },
        badge: {
            justifyContent: "center",
            alignItems: "center",
            width: 200,
            height: 200,
            borderRadius: 70,
            backgroundColor: colors.card,
            shadowColor: colors.text,
            shadowOpacity: 0.18,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 10 },
        },
        badgeInner: {
            width: 92,
            height: 92,
            borderRadius: 46,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
        },
        checkText: {
            color: colors.onPrimary,
            fontSize: 56,
            fontWeight: "900",
            lineHeight: 60,
        },
        messageText: {
            marginTop: 10,
            color: colors.text,
            fontSize: 14,
            fontWeight: "800",
        },
    });
}