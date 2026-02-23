import { ColorsStatic } from "@/shared-uis/constants/Colors";
import { BlurView } from "expo-blur";
import React, { PropsWithChildren } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface GlassCardProps extends PropsWithChildren<Record<string, unknown>> {
    style?: StyleProp<ViewStyle>;
}

const CARD_RADIUS = 28;
const CARD_BORDER_WIDTH = 1;
const CARD_PADDING = 28;
const BLUR_INTENSITY = 90; // stronger frost
const ANDROID_SURFACE = ColorsStatic.surfaceFrost;
const BORDER_COLOR = ColorsStatic.borderFrost;
const BLUR_SURFACE = ColorsStatic.overlayWhite12;
const SHADOW_OFFSET_Y = 12;
const SHADOW_RADIUS = 30;
const SHADOW_OPACITY = 0.4;
const HIGHLIGHT_SURFACE = ColorsStatic.surfaceHighlight;
const HIGHLIGHT_HEIGHT = 120;
const HIGHLIGHT_OPACITY = 0.7;

const GlassCard = ({ children, style }: GlassCardProps) => {
    // BlurView can be unreliable on some Android devices, so use a glassy fallback there.
    const isAndroid = Platform.OS === "android";

    return (
        <View style={[styles.wrapper, style]}>
            {isAndroid ? (
                <View style={styles.androidSurface}>
                    <View style={styles.lightCompression} pointerEvents="none" />
                    <View style={styles.innerStroke} pointerEvents="none" />
                    <View style={styles.highlight} pointerEvents="none" />
                    <View style={styles.outerStroke} pointerEvents="none" />
                    {children}
                </View>
            ) : (
                <BlurView intensity={BLUR_INTENSITY} tint="default" style={styles.blurSurface}>
                    <View style={styles.lightCompression} pointerEvents="none" />
                    <View style={styles.innerStroke} pointerEvents="none" />
                    <View style={styles.highlight} pointerEvents="none" />
                    <View style={styles.outerStroke} pointerEvents="none" />
                    {children}
                </BlurView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: CARD_RADIUS,
        borderWidth: CARD_BORDER_WIDTH,
        borderColor: BORDER_COLOR,
        overflow: "hidden",
        backgroundColor: "transparent",
        shadowColor: ColorsStatic.cardShadow,
        shadowOpacity: SHADOW_OPACITY,
        shadowRadius: SHADOW_RADIUS,
        shadowOffset: { width: 0, height: SHADOW_OFFSET_Y },
    },
    blurSurface: {
        padding: CARD_PADDING,
        borderRadius: CARD_RADIUS,
        backgroundColor: BLUR_SURFACE,
    },
    androidSurface: {
        padding: CARD_PADDING,
        borderRadius: CARD_RADIUS,
        backgroundColor: ANDROID_SURFACE,
    },
    highlight: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: HIGHLIGHT_HEIGHT,
        backgroundColor: HIGHLIGHT_SURFACE,
        opacity: HIGHLIGHT_OPACITY,
    },
    innerStroke: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: CARD_RADIUS,
        borderWidth: 1,
        borderColor: ColorsStatic.borderFrost34,
    },
    lightCompression: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: CARD_RADIUS,
        backgroundColor: ColorsStatic.overlayWhite07,
    },
    outerStroke: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: CARD_RADIUS,
        borderWidth: 1,
        borderColor: ColorsStatic.overlayWhite12,
    },
});

export default GlassCard;
