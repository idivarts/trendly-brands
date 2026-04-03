import Colors from "@/shared-uis/constants/Colors";
import { Theme, useTheme } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

interface IntroSplashProps {
    onComplete: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

    return (
        <View style={styles.container}>
            <LottieView
                source={require("../../assets/lottie/hi-brands.json")}
                autoPlay
                loop={false}
                onAnimationFinish={onComplete}
                style={styles.lottie}
                webStyle={styles.lottie}
                resizeMode="contain"
            />
        </View>
    );
}

function createStyles(colors: ReturnType<typeof Colors>, theme: Theme) {
    return StyleSheet.create({
        container: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.dark ? colors.primary : colors.background,
            zIndex: 9999,
        },
        lottie: {
            width: "100%",
            height: "100%",
        },
    });
}
