import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface BubbleSpec {
    width: string;
    height: number;
    align: "left" | "right";
    marginTop?: number;
}

const BUBBLES: BubbleSpec[] = [
    { width: "70%", height: 56, align: "left", marginTop: 0 },
    { width: "55%", height: 40, align: "right", marginTop: 14 },
    { width: "78%", height: 64, align: "left", marginTop: 14 },
    { width: "48%", height: 36, align: "right", marginTop: 14 },
];

interface ChatLoadingPanelProps {
    animating?: boolean;
}

const ChatLoadingPanel: React.FC<ChatLoadingPanelProps> = ({ animating = true }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const pulse = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        if (!animating) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0.5,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [animating, pulse]);

    const bubbleOpacity = pulse.interpolate({
        inputRange: [0.5, 1],
        outputRange: [0.35, 0.7],
    });

    return (
        <View style={styles.container} accessibilityLabel="Loading conversation">
            <View style={styles.list}>
                {BUBBLES.map((b, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.bubbleRow,
                            { justifyContent: b.align === "left" ? "flex-start" : "flex-end" },
                            { marginTop: b.marginTop },
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.bubble,
                                {
                                    width: b.width as any,
                                    height: b.height,
                                    opacity: bubbleOpacity,
                                    backgroundColor:
                                        b.align === "right" ? colors.primary + "40" : colors.tag,
                                },
                            ]}
                        />
                    </Animated.View>
                ))}
            </View>
            <View style={styles.inputArea}>
                <Animated.View style={[styles.inputBar, { opacity: bubbleOpacity }]} />
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    paddingHorizontal: 18,
                    paddingTop: 24,
                    paddingBottom: 18,
                },
                list: {
                    flex: 1,
                },
                bubbleRow: {
                    flexDirection: "row",
                },
                bubble: {
                    borderRadius: 14,
                },
                inputArea: {
                    paddingTop: 14,
                },
                inputBar: {
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.tag,
                },
            }),
        [colors]
    );
}

export default ChatLoadingPanel;
