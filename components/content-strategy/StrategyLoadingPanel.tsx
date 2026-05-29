import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface BarSpec {
    width: string;
    height: number;
    marginTop?: number;
}

const EDITOR_BARS: BarSpec[] = [
    { width: "55%", height: 22, marginTop: 0 },
    { width: "100%", height: 12, marginTop: 22 },
    { width: "96%", height: 12, marginTop: 10 },
    { width: "88%", height: 12, marginTop: 10 },
    { width: "42%", height: 12, marginTop: 10 },
    { width: "38%", height: 16, marginTop: 28 },
    { width: "100%", height: 12, marginTop: 18 },
    { width: "92%", height: 12, marginTop: 10 },
    { width: "70%", height: 12, marginTop: 10 },
    { width: "44%", height: 16, marginTop: 28 },
    { width: "98%", height: 12, marginTop: 18 },
    { width: "84%", height: 12, marginTop: 10 },
];

interface StrategyLoadingPanelProps {
    /** When false, the bars don't shimmer — used while the panel is fading out. */
    animating?: boolean;
}

const StrategyLoadingPanel: React.FC<StrategyLoadingPanelProps> = ({ animating = true }) => {
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

    const barOpacity = pulse.interpolate({
        inputRange: [0.5, 1],
        outputRange: [0.35, 0.7],
    });

    return (
        <View style={styles.container} accessibilityLabel="Loading your strategy">
            <View style={styles.inner}>
                {EDITOR_BARS.map((bar, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.bar,
                            {
                                width: bar.width as any,
                                height: bar.height,
                                marginTop: bar.marginTop,
                                opacity: barOpacity,
                            },
                        ]}
                    />
                ))}
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
                    paddingHorizontal: 28,
                    paddingVertical: 32,
                },
                inner: {
                    flex: 1,
                    maxWidth: 760,
                    width: "100%",
                    alignSelf: "center",
                },
                bar: {
                    borderRadius: 6,
                    backgroundColor: colors.tag,
                },
            }),
        [colors]
    );
}

export default StrategyLoadingPanel;
