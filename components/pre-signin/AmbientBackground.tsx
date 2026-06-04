import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { PropsWithChildren, useMemo } from "react";
import { StyleSheet, View } from "react-native";

/**
 * Shared, full-bleed ambient canvas used by both the lets-start AI page and the
 * pre-signin screen. Using the same calm background on both lets the pre-signin
 * auth card read as a *modal over the same page* rather than a hard route change.
 *
 * Deliberately quiet: a near-flat surface with two very faint brand-tinted
 * washes tucked into opposite corners for a touch of depth. No motion, no
 * saturated shapes — nothing that competes with the foreground.
 */
const AmbientBackground: React.FC<PropsWithChildren<{ dim?: boolean }>> = ({ children, dim }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            {/* Faint corner washes (kept off to the edges, behind nothing important) */}
            <View pointerEvents="none" style={styles.washLayer}>
                <View style={[styles.wash, styles.washTopLeft, { backgroundColor: colors.primary }]} />
                <View style={[styles.wash, styles.washBottomRight, { backgroundColor: colors.secondary }]} />
            </View>

            {/* Optional dim veil — used when a modal floats above the canvas */}
            {dim && <View pointerEvents="none" style={[styles.dim, { backgroundColor: colors.backdrop }]} />}

            {/* Foreground content */}
            <View style={styles.content}>{children}</View>
        </View>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        root: {
            flex: 1,
            overflow: "hidden",
            position: "relative",
            minHeight: 640,
        },
        washLayer: {
            ...StyleSheet.absoluteFillObject,
        },
        wash: {
            position: "absolute",
            width: 700,
            height: 700,
            borderRadius: 350,
            opacity: 0.05,
        },
        washTopLeft: {
            top: -360,
            left: -260,
        },
        washBottomRight: {
            bottom: -380,
            right: -240,
        },
        dim: {
            ...StyleSheet.absoluteFillObject,
        },
        content: {
            flex: 1,
        },
    });
}

export default AmbientBackground;
