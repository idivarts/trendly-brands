import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import React from "react";
import { StyleSheet, View } from "react-native";

// KEY CHANGE: introduce mid-tone contrast so blur has something to refract
const GRADIENT_COLORS: readonly [string, string, string] = [
    "#0A0E13",
    "#12263A", // mid-tone blue for glass refraction
    "#08141F",
];

const GLOW_ALPHA = 0.32;
const GLOW_SCALE_FROM = 0.92;
const GLOW_SCALE_TO = 1.06;
const GLOW_SCALE_TO_SECONDARY = 1.12;
const GLOW_SIZE = 420;
const GLOW_OFFSET = 180;
const GLOW_CENTER_SIZE = 520;
const GLOW_TRANSLATE_PRIMARY = 14;
const GLOW_TRANSLATE_SECONDARY = 10;
const GLOW_ANIMATION_DURATION = 9000;
const GLOW_ANIMATION_DELAY = 1200;
const GLOW_SHADOW_OPACITY = 0.45;
const GLOW_SHADOW_RADIUS = 80;

// Slightly brighter glows so they survive blur
const GLOW_COLOR = "rgba(120, 180, 220, 0.45)";
const GLOW_COLOR_SECONDARY = "rgba(80, 160, 170, 0.38)";
const GLOW_COLOR_CENTER = "rgba(60, 140, 180, 0.28)";
const GLOW_SHADOW_COLOR = "rgba(120, 180, 220, 0.6)";

const GLOW_OPACITY_PRIMARY = 0.75;
const GLOW_OPACITY_SECONDARY = 0.6;
const GLOW_OPACITY_SECONDARY_FROM = 0.85;

const GlassBackground = () => {
    return (
        <View style={styles.container} pointerEvents="none">
            {/* Base gradient */}
            <LinearGradient colors={GRADIENT_COLORS} style={StyleSheet.absoluteFillObject} />

            {/* Top ambient glow */}
            <MotiView
                from={{ opacity: GLOW_ALPHA, scale: GLOW_SCALE_FROM, translateY: -GLOW_TRANSLATE_PRIMARY }}
                animate={{
                    opacity: GLOW_ALPHA * GLOW_OPACITY_PRIMARY,
                    scale: GLOW_SCALE_TO,
                    translateY: GLOW_TRANSLATE_PRIMARY,
                }}
                transition={{ type: "timing", duration: GLOW_ANIMATION_DURATION, loop: true }}
                style={[styles.glow, styles.glowTop]}
            />

            {/* Bottom ambient glow */}
            <MotiView
                from={{ opacity: GLOW_ALPHA * GLOW_OPACITY_SECONDARY_FROM, scale: 1, translateY: GLOW_TRANSLATE_SECONDARY }}
                animate={{
                    opacity: GLOW_ALPHA * GLOW_OPACITY_SECONDARY,
                    scale: GLOW_SCALE_TO_SECONDARY,
                    translateY: -GLOW_TRANSLATE_SECONDARY,
                }}
                transition={{ type: "timing", duration: GLOW_ANIMATION_DURATION, loop: true, delay: GLOW_ANIMATION_DELAY }}
                style={[styles.glow, styles.glowBottom]}
            />

            {/* Central light pool – critical for glass perception */}
            <MotiView
                from={{ opacity: 0.25, scale: 0.96 }}
                animate={{ opacity: 0.45, scale: 1.04 }}
                transition={{ type: "timing", duration: 7000, loop: true }}
                style={styles.cardGlow}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    glow: {
        position: "absolute",
        width: GLOW_SIZE,
        height: GLOW_SIZE,
        borderRadius: GLOW_SIZE / 2,
        backgroundColor: GLOW_COLOR,
        opacity: GLOW_ALPHA,
        shadowColor: GLOW_SHADOW_COLOR,
        shadowOpacity: GLOW_SHADOW_OPACITY,
        shadowRadius: GLOW_SHADOW_RADIUS,
    },
    glowTop: {
        top: -GLOW_OFFSET,
        right: -GLOW_OFFSET,
    },
    glowBottom: {
        bottom: -GLOW_OFFSET,
        left: -GLOW_OFFSET,
        backgroundColor: GLOW_COLOR_SECONDARY,
    },
    cardGlow: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: GLOW_CENTER_SIZE,
        height: GLOW_CENTER_SIZE,
        marginLeft: -(GLOW_CENTER_SIZE / 2),
        marginTop: -(GLOW_CENTER_SIZE / 2),
        borderRadius: GLOW_CENTER_SIZE / 2,
        backgroundColor: GLOW_COLOR_CENTER,
        shadowColor: GLOW_SHADOW_COLOR,
        shadowOpacity: 0.6,
        shadowRadius: 90,
    },
});

export default GlassBackground;