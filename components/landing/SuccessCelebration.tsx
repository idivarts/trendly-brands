import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { BLUE, TEXT } from "./const";

type SuccessCelebrationProps = {
    visible: boolean;
    onDone?: () => void;
    message?: string;
    durationMs?: number; // total time before calling onDone
};

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
    visible,
    onDone,
    message = "Success!",
    durationMs = 1400,
}) => {
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
        <View style={[StyleSheet.absoluteFillObject, { justifyContent: "center", alignItems: "center", zIndex: 9999 }]}>
            <Animated.View
                style={{
                    // @ts-ignore
                    position: "absolute",
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: "rgba(0,0,0,0.25)",
                    opacity,
                }}
                pointerEvents="auto"
            />

            {/* Expanding ring */}
            <Animated.View
                style={{
                    position: "absolute",
                    width: 160,
                    height: 160,
                    borderRadius: 80,
                    borderWidth: 3,
                    borderColor: BLUE,
                    transform: [{ scale: ringScale }],
                    opacity: ringOpacity,
                }}
            />

            {/* Core badge */}
            <Animated.View
                style={{
                    justifyContent: "center",
                    alignItems: "center",
                    width: 200,
                    height: 200,
                    borderRadius: 70,
                    backgroundColor: "#FFFFFF",
                    shadowColor: "#000",
                    shadowOpacity: 0.18,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 10 },
                    transform: [{ scale }],
                    opacity,
                }}
            >
                <View
                    style={{
                        width: 92,
                        height: 92,
                        borderRadius: 46,
                        backgroundColor: BLUE,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Text style={{ color: "#fff", fontSize: 56, fontWeight: "900", lineHeight: 60 }}>✓</Text>
                </View>
                <Text style={{ marginTop: 10, color: TEXT, fontSize: 14, fontWeight: "800" }}>{message}</Text>
            </Animated.View>
        </View>
    );
};