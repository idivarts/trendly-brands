/**
 * RightPanelFab
 *
 * Mobile-only (!xl) speed-dial floating action button that opens the
 * RightSidePanel surfaces (Comments, AI Chat, Preview). It replaces the
 * cramped icon toggles that used to live in the PageHeader on phones.
 *
 * Behaviour:
 *  - Renders nothing on xl (desktop uses the persistent RightSidePanel rail).
 *  - Renders nothing while a panel is open (mode !== "none") — the floating
 *    sheet already fills the screen, so the trigger would be hidden anyway.
 *  - Tapping the trigger expands a stack of labelled mini-FABs, one per
 *    available surface. Tapping a surface sets the mode (opening the sheet)
 *    and collapses the dial. A faint scrim lets the user tap-away to collapse.
 *
 * The parent screen owns `mode` state and passes `onModeChange` — exactly the
 * same contract as RightSidePanel — so the two stay in lockstep.
 *
 * Usage:
 *   {!xl && (
 *     <RightPanelFab
 *       mode={rightPanelMode}
 *       onModeChange={setRightPanelMode}
 *       actions={[
 *         { mode: "comments", icon: faCommentDots, label: "Comments" },
 *         { mode: "chat", icon: faRobot, label: "AI Chat" },
 *       ]}
 *     />
 *   )}
 */
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faLayerGroup, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RightPanelMode } from "./RightSidePanel";

export interface RightPanelFabAction {
    /** Which RightSidePanel surface this entry opens. */
    mode: Exclude<RightPanelMode, "none">;
    icon: IconDefinition;
    label: string;
}

interface RightPanelFabProps {
    mode: RightPanelMode;
    onModeChange: (mode: RightPanelMode) => void;
    /** Surfaces to expose — one mini-FAB per entry, in render order (top→bottom). */
    actions: RightPanelFabAction[];
    /**
     * Extra gap above the screen's bottom safe area. Bump this on screens that
     * sit above a bottom tab bar so the dial clears it. Defaults to 0.
     */
    bottomOffset?: number;
}

const RightPanelFab: React.FC<RightPanelFabProps> = ({
    mode,
    onModeChange,
    actions,
    bottomOffset = 0,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const insets = useSafeAreaInsets();
    const styles = useMemo(
        () => createStyles(colors, insets.bottom + bottomOffset),
        [colors, insets.bottom, bottomOffset]
    );

    const [open, setOpen] = useState(false);
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: open ? 1 : 0,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            // RN Web ignores the native driver for these props; keep it off so
            // the same code animates cleanly on web (!xl) and native.
            useNativeDriver: false,
        }).start();
    }, [open, anim]);

    // Hardening: the dial must never linger expanded once it's hidden or
    // non-interactive. This fires whenever a panel opens (sheet covers the
    // screen), we switch to the desktop rail (xl), or there are no actions —
    // so the dial always re-appears collapsed instead of restoring a stale
    // expanded state.
    useEffect(() => {
        if (open && (mode !== "none" || xl || actions.length === 0)) {
            setOpen(false);
        }
    }, [open, mode, xl, actions.length]);

    if (xl) return null;
    // Hidden while a surface is open; the sheet owns the screen then.
    if (mode !== "none") return null;
    if (actions.length === 0) return null;

    const handleSelect = (target: Exclude<RightPanelMode, "none">) => {
        setOpen(false);
        onModeChange(target);
    };

    const triggerRotate = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "90deg"],
    });
    const itemTranslate = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [10, 0],
    });

    return (
        <View style={styles.root} pointerEvents="box-none">
            {open && (
                <Pressable
                    style={styles.scrim}
                    onPress={() => setOpen(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Close menu"
                />
            )}

            <View style={styles.cluster} pointerEvents="box-none">
                <Animated.View
                    style={[styles.items, { opacity: anim }]}
                    pointerEvents={open ? "auto" : "none"}
                >
                    {actions.map((action) => (
                        <Animated.View
                            key={action.mode}
                            style={[
                                styles.itemRow,
                                { transform: [{ translateY: itemTranslate }] },
                            ]}
                        >
                            <View style={styles.labelPill}>
                                <Text style={styles.labelText} numberOfLines={1}>
                                    {action.label}
                                </Text>
                            </View>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.miniFab,
                                    pressed && styles.pressed,
                                ]}
                                onPress={() => handleSelect(action.mode)}
                                accessibilityRole="button"
                                accessibilityLabel={action.label}
                            >
                                <FontAwesomeIcon
                                    icon={action.icon}
                                    size={17}
                                    color={colors.primary}
                                />
                            </Pressable>
                        </Animated.View>
                    ))}
                </Animated.View>

                <Pressable
                    style={({ pressed }) => [styles.mainFab, pressed && styles.pressed]}
                    onPress={() => setOpen((o) => !o)}
                    accessibilityRole="button"
                    accessibilityLabel={open ? "Close panel menu" : "Open panel menu"}
                    accessibilityState={{ expanded: open }}
                >
                    <Animated.View style={{ transform: [{ rotate: triggerRotate }] }}>
                        <FontAwesomeIcon
                            icon={open ? faXmark : faLayerGroup}
                            size={20}
                            color={colors.onPrimary}
                        />
                    </Animated.View>
                </Pressable>
            </View>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, bottom: number) {
    return StyleSheet.create({
        // Spans the screen so the scrim can fill it, but lets touches fall
        // through to the page except on the dial controls / scrim.
        root: {
            ...StyleSheet.absoluteFillObject,
            zIndex: 90,
            elevation: 90,
        },
        scrim: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.18)",
        },
        cluster: {
            position: "absolute",
            right: 18,
            bottom: bottom + 18,
            alignItems: "flex-end",
            gap: 12,
        },
        items: {
            alignItems: "flex-end",
            gap: 12,
        },
        itemRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        labelPill: {
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: colors.text,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.18,
            elevation: 4,
        },
        labelText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.background,
        },
        miniFab: {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 10,
            shadowOpacity: 0.18,
            elevation: 6,
        },
        mainFab: {
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 5 },
            shadowRadius: 14,
            shadowOpacity: 0.4,
            elevation: 8,
        },
        pressed: {
            opacity: 0.82,
        },
    });
}

export default RightPanelFab;
