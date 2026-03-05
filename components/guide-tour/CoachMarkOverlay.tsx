import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { Theme, useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import type { CoachMarkLayout } from "@/contexts/guide-tour-context.provider";

type StepOffsets = Record<number, { offsetX: number; offsetY: number }>;

/** Pointer alignment per step: "center" | "flex-end" (right) */
const STEP_POINTER_ALIGN: Partial<Record<number, "center" | "flex-end">> = {
    3: "flex-end",
};
/** Extra marginRight for step 3 pointer (shifts tip left from right edge) */
const STEP_POINTER_MARGIN_RIGHT: Partial<Record<number, number>> = {
    3: 24,
};

/**
 * Per-step, per-platform position offsets for fine-tuning coach mark placement.
 * Step 0: Influencer card | 1: Filter button | 2: Campaigns | 3: Credits/My Brand | 4: Discover header
 * Positive = move right (X) / down (Y), Negative = move left (X) / up (Y)
 */
const STEP_OFFSETS_WEB: StepOffsets = {
    0: { offsetX: -210, offsetY: -20 },
    1: { offsetX: 0, offsetY: -10 },
    2: { offsetX: 0, offsetY: -12 },
    3: { offsetX: 0, offsetY: -10 },
    4: { offsetX: -600, offsetY: -10 },
};

const STEP_OFFSETS_MOBILE: StepOffsets = {
    0: { offsetX: 0, offsetY: -20 },
    1: { offsetX: 0, offsetY: 0 },
    2: { offsetX: 16, offsetY: -30 },
    3: { offsetX: 0, offsetY: -30 },
    4: { offsetX: -70, offsetY: -70 },
};

interface CoachMarkOverlayProps {
    visible: boolean;
    highlightLayout: CoachMarkLayout | null;
    onRequestClose?: () => void;
    /** Step index (0-4) for per-step offset lookup. Omit for default (0,0). */
    stepIndex?: number;
    children: React.ReactNode;
}

const CoachMarkOverlay: React.FC<CoachMarkOverlayProps> = ({
    visible,
    highlightLayout,
    stepIndex = 0,
    children,
}) => {
    const theme = useTheme();
    const { xl } = useBreakpoints();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const styles = useMemo(
        () => createStyles(theme, screenWidth, screenHeight, highlightLayout, stepIndex, xl),
        [theme, screenWidth, screenHeight, highlightLayout, stepIndex, xl]
    );

    if (!visible) return null;

    const hasTarget = highlightLayout && highlightLayout.width > 0 && highlightLayout.height > 0;
    const pointerAtTop = hasTarget && highlightLayout
        ? (screenHeight - (highlightLayout.y + highlightLayout.height + 12)) >= 100
        : true;

    const calloutWithPointer = (
        <View style={styles.calloutWrapper} pointerEvents="box-none">
            {hasTarget && pointerAtTop && <View style={styles.pointerUp} />}
            <View style={styles.calloutContent}>{children}</View>
            {hasTarget && !pointerAtTop && <View style={styles.pointerDown} />}
        </View>
    );

    return (
        <View
            style={styles.container}
            pointerEvents="box-none"
            collapsable={false}
        >
            {hasTarget ? (
                <View style={styles.positionedCallout}>{calloutWithPointer}</View>
            ) : (
                <View style={styles.fallbackCallout}>{calloutWithPointer}</View>
            )}
        </View>
    );
};

const createStyles = (
    theme: Theme,
    screenWidth: number,
    screenHeight: number,
    layout: CoachMarkLayout | null,
    stepIndex: number,
    xl: boolean
) => {
    const colors = Colors(theme);
    const offsets = xl ? STEP_OFFSETS_WEB : STEP_OFFSETS_MOBILE;
    const { offsetX, offsetY } = offsets[stepIndex] ?? { offsetX: 0, offsetY: 0 };
    const x = layout?.x ?? 0;
    const y = layout?.y ?? 0;
    const w = layout?.width ?? 0;
    const h = layout?.height ?? 0;
    const calloutWidth = Math.min(280, screenWidth - 48);
    const gap = 12;

    const hasTarget = layout && w > 0 && h > 0;

    let calloutLeft = 24;
    let calloutTop = screenHeight * 0.4;

    if (hasTarget) {
        const targetCenterX = x + w / 2;
        const spaceBelow = screenHeight - (y + h + gap);
        if (spaceBelow >= 100) {
            calloutTop = y + h + gap;
        } else {
            calloutTop = Math.max(16, y - 100 - gap);
        }
        calloutLeft = Math.max(16, Math.min(screenWidth - calloutWidth - 16, targetCenterX - calloutWidth / 2));
    }

    calloutLeft += offsetX;
    calloutTop += offsetY;

    const pointerAlign = (STEP_POINTER_ALIGN[stepIndex] ?? "center") as "center" | "flex-end";
    const pointerMarginRight = STEP_POINTER_MARGIN_RIGHT[stepIndex] ?? 0;
    const pointerUp = {
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 12,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: colors.primary,
        alignSelf: pointerAlign,
        marginBottom: -1,
        ...(pointerMarginRight > 0 && { marginRight: pointerMarginRight }),
    };
    const pointerDown = {
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 12,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: colors.primary,
        alignSelf: pointerAlign,
        marginTop: -1,
        ...(pointerMarginRight > 0 && { marginRight: pointerMarginRight }),
    };

    return StyleSheet.create({
        container: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "transparent",
            pointerEvents: "box-none",
            zIndex: 99999,
            elevation: 99999,
        },
        positionedCallout: {
            position: "absolute",
            left: calloutLeft,
            top: calloutTop,
            width: calloutWidth,
            minWidth: 200,
        },
        fallbackCallout: {
            position: "absolute",
            left: 24 + offsetX,
            right: 24 - offsetX,
            top: screenHeight * 0.4 + offsetY,
            alignItems: "center",
            justifyContent: "center",
        },
        calloutWrapper: {
            flexDirection: "column",
            alignItems: "stretch",
        },
        pointerUp,
        pointerDown,
        calloutContent: {
            minWidth: 0,
        },
    });
};

export default CoachMarkOverlay;
