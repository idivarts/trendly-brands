import Colors from "@/shared-uis/constants/Colors";
import { faComments, faFileLines, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

interface StrategyShimmerPanelProps {
    /** Optional escape hatch — when provided, renders a secondary "Write
     *  manually" button beneath the hint text. Lets the user bypass the AI
     *  conversation and seed the editor with an empty paragraph. */
    onWriteManually?: () => void;
}

const StrategyShimmerPanel: React.FC<StrategyShimmerPanelProps> = ({ onWriteManually }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const pulse = useRef(new Animated.Value(1)).current;
    const dot1 = useRef(new Animated.Value(0.3)).current;
    const dot2 = useRef(new Animated.Value(0.3)).current;
    const dot3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        const dotAnim = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0.3, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.delay(800 - delay),
                ])
            );

        dotAnim(dot1, 0).start();
        dotAnim(dot2, 267).start();
        dotAnim(dot3, 534).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.iconRing, { transform: [{ scale: pulse }] }]}>
                <View style={styles.iconInner}>
                    <FontAwesomeIcon icon={faFileLines} size={28} color={colors.primary} />
                </View>
                <View style={styles.chatBadge}>
                    <FontAwesomeIcon icon={faComments} size={13} color={colors.onPrimary} />
                </View>
            </Animated.View>

            <View style={styles.textBlock}>
                <Text style={styles.heading}>Your strategy is taking shape</Text>
                <Text style={styles.body}>
                    The more you share, the sharper your strategy gets. Keep answering questions in the chat and your plan will appear here automatically.
                </Text>
            </View>

            <View style={styles.hint}>
                <Text style={styles.hintText}>Waiting for more context</Text>
                <View style={styles.dots}>
                    <Animated.View style={[styles.dot, { opacity: dot1 }]} />
                    <Animated.View style={[styles.dot, { opacity: dot2 }]} />
                    <Animated.View style={[styles.dot, { opacity: dot3 }]} />
                </View>
            </View>

            {onWriteManually && (
                <Pressable
                    style={({ pressed }) => [
                        styles.secondaryBtn,
                        pressed && styles.secondaryBtnPressed,
                    ]}
                    onPress={onWriteManually}
                    accessibilityRole="button"
                    accessibilityLabel="Write the strategy manually"
                >
                    <FontAwesomeIcon icon={faPenToSquare} size={13} color={colors.primary} />
                    <Text style={styles.secondaryBtnText}>Write the strategy manually</Text>
                </Pressable>
            )}
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
                    gap: 28,
                },
                iconRing: {
                    width: 88,
                    height: 88,
                    borderRadius: 44,
                    backgroundColor: colors.primary + "18",
                    alignItems: "center",
                    justifyContent: "center",
                },
                iconInner: {
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: colors.primary + "22",
                    alignItems: "center",
                    justifyContent: "center",
                },
                chatBadge: {
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 6,
                    shadowOpacity: 0.4,
                    elevation: 4,
                },
                textBlock: {
                    alignItems: "center",
                    gap: 10,
                    maxWidth: 320,
                },
                heading: {
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.text,
                    textAlign: "center",
                    letterSpacing: -0.3,
                },
                body: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 21,
                },
                hint: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                },
                hintText: {
                    fontSize: 12,
                    fontWeight: "500",
                    color: colors.textSecondary,
                    letterSpacing: 0.3,
                },
                dots: {
                    flexDirection: "row",
                    gap: 4,
                    alignItems: "center",
                },
                dot: {
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: colors.primary,
                },
            }),
        [colors]
    );
}

export default StrategyShimmerPanel;
