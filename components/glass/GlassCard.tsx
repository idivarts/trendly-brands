import { BlurView } from "expo-blur";
import React, { PropsWithChildren, useMemo } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@react-navigation/native";
import Colors from "@/shared-uis/constants/Colors";

interface GlassCardProps extends PropsWithChildren<Record<string, unknown>> {
    style?: StyleProp<ViewStyle>;
}

const CARD_RADIUS = 28;
const CARD_BORDER_WIDTH = 1;
const CARD_PADDING = 28;
const BLUR_INTENSITY = 90; // stronger frost
const SHADOW_OFFSET_Y = 12;
const SHADOW_RADIUS = 30;
const SHADOW_OPACITY = 0.4;
const HIGHLIGHT_HEIGHT = 120;
const HIGHLIGHT_OPACITY = 0.7;

const GlassCard = ({ children, style }: GlassCardProps) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const isAndroid = Platform.OS === "android";

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrapper: {
                    borderRadius: CARD_RADIUS,
                    borderWidth: CARD_BORDER_WIDTH,
                    borderColor: colors.glassBorder,
                    overflow: "hidden",
                    backgroundColor: colors.transparent,
                    shadowColor: colors.glassShadow,
                    shadowOpacity: SHADOW_OPACITY,
                    shadowRadius: SHADOW_RADIUS,
                    shadowOffset: { width: 0, height: SHADOW_OFFSET_Y },
                },
                blurSurface: {
                    padding: CARD_PADDING,
                    borderRadius: CARD_RADIUS,
                    backgroundColor: colors.glassSurface,
                },
                androidSurface: {
                    padding: CARD_PADDING,
                    borderRadius: CARD_RADIUS,
                    backgroundColor: colors.glassAndroidSurface,
                },
                highlight: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: HIGHLIGHT_HEIGHT,
                    backgroundColor: colors.glassHighlight,
                    opacity: HIGHLIGHT_OPACITY,
                },
                innerStroke: {
                    ...StyleSheet.absoluteFillObject,
                    borderRadius: CARD_RADIUS,
                    borderWidth: 1,
                    borderColor: colors.glassInnerStroke,
                },
                lightCompression: {
                    ...StyleSheet.absoluteFillObject,
                    borderRadius: CARD_RADIUS,
                    backgroundColor: colors.glassLightCompression,
                },
                outerStroke: {
                    ...StyleSheet.absoluteFillObject,
                    borderRadius: CARD_RADIUS,
                    borderWidth: 1,
                    borderColor: colors.glassOuterStroke,
                },
            }),
        [colors]
    );

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

export default GlassCard;
