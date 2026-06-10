/**
 * RightSidePanel
 *
 * Shared layout wrapper for the collapsible right-side panel used on the
 * Strategy, Calendar, and Content Detail screens. Manages:
 *
 *  - Left-casting shadow that visually separates the panel from the main content
 *  - Mode switching: 'none' | 'comments' | 'chat'
 *    • 'none'     → panel collapsed to a slim icon strip (24px)
 *    • 'comments' → renders commentsSlot (chevron lives in that panel's header)
 *    • 'chat'     → renders chatSlot (chevron lives in that panel's header)
 *
 * Both slots are optional — pass only what the screen uses. Passing only
 * commentsSlot (no chatSlot) is valid and gives a comments-only panel.
 *
 * The parent screen owns `mode` state and passes `onModeChange`.
 * Each panel slot receives an `onCollapse` callback and renders the chevron
 * inline in its own header — no separate handle column needed when expanded.
 *
 * Usage (both slots):
 *   <RightSidePanel
 *     mode={rightPanelMode}
 *     onModeChange={setRightPanelMode}
 *     commentsSlot={<CommentsPanel onCollapse={...} ... />}
 *     chatSlot={<AIChatPanel onCollapse={...} ... />}
 *   />
 *
 * Usage (comments only):
 *   <RightSidePanel
 *     mode={rightPanelMode}
 *     onModeChange={setRightPanelMode}
 *     commentsSlot={<ContentCommentsPanel onCollapse={...} ... />}
 *   />
 */
import { useBreakpoints } from "@/hooks";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import Colors from "@/shared-uis/constants/Colors";
import { faChevronRight, faCommentDots, faEye, faRobot } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import PanelResizeHandle from "./PanelResizeHandle";

export type RightPanelMode = "none" | "comments" | "chat" | "preview";

interface RightSidePanelProps {
    mode: RightPanelMode;
    onModeChange: (mode: RightPanelMode) => void;
    /** Content to show when mode === 'comments'. The slot should accept
     *  an onCollapse prop and render the chevron in its own header. */
    commentsSlot?: React.ReactNode;
    /** Content to show when mode === 'chat'. Same convention as commentsSlot.
     *  Optional — omit on screens that have no AI chat panel. */
    chatSlot?: React.ReactNode;
    /** Content to show when mode === 'preview'. Same convention as the others. */
    previewSlot?: React.ReactNode;
    /**
     * Width of the surrounding split container (px) — measured by the parent
     * via onLayout. Drives the drag-to-resize bounds (max = 60% of this).
     * Web/xl only; ignored on native.
     */
    containerWidth?: number;
    /**
     * Whether the panel may be user-resized on web/xl. Default true. Set false
     * while a screen is running its own width animation (e.g. the strategy
     * collecting → ready transition) so the two don't fight.
     */
    resizable?: boolean;
}

/**
 * Persistent rail width (desktop). Wide enough for an icon + a 32px active
 * pill + a 6px badge in the top-right corner of an icon. Below 40px these
 * stop fitting cleanly.
 */
export const RIGHT_PANEL_RAIL_WIDTH = 44;

/**
 * Reusable rail button — handles hover state and renders a leftward tooltip.
 * Used by both the collapse chevron and the mode-toggle icons so the hover
 * behaviour stays consistent.
 */
interface RailButtonProps {
    tooltip: string;
    accessibilityLabel?: string;
    selected?: boolean;
    onPress: () => void;
    colors: ReturnType<typeof Colors>;
    children: React.ReactNode;
}

const RailButton: React.FC<RailButtonProps> = ({
    tooltip,
    accessibilityLabel,
    selected,
    onPress,
    colors,
    children,
}) => {
    const [hovered, setHovered] = useState(false);
    return (
        <View style={railStyles.itemWrap}>
            <Pressable
                style={({ pressed }) => [
                    railStyles.iconBtn,
                    pressed && railStyles.iconBtnPressed,
                ]}
                onPress={onPress}
                onHoverIn={() => setHovered(true)}
                onHoverOut={() => setHovered(false)}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel ?? tooltip}
                accessibilityState={selected !== undefined ? { selected } : undefined}
            >
                {children}
            </Pressable>
            {hovered && (
                <View
                    style={[railStyles.tooltip, { backgroundColor: colors.text }]}
                    pointerEvents="none"
                >
                    <Text
                        numberOfLines={1}
                        style={[railStyles.tooltipText, { color: colors.background }]}
                    >
                        {tooltip}
                    </Text>
                </View>
            )}
        </View>
    );
};

interface RailIconProps {
    icon: IconDefinition;
    label: string;
    active: boolean;
    onPress: () => void;
    colors: ReturnType<typeof Colors>;
}

const RailIcon: React.FC<RailIconProps> = ({ icon, label, active, onPress, colors }) => {
    const pillStyle = useMemo(
        () => ({
            backgroundColor: active ? colors.tag : "transparent",
        }),
        [active, colors.tag]
    );
    return (
        <RailButton
            tooltip={label}
            selected={active}
            onPress={onPress}
            colors={colors}
        >
            <View style={[railStyles.iconPill, pillStyle]}>
                <FontAwesomeIcon
                    icon={icon}
                    size={16}
                    color={active ? colors.primary : colors.textSecondary}
                />
            </View>
        </RailButton>
    );
};

const railStyles = StyleSheet.create({
    itemWrap: {
        position: "relative",
    },
    iconBtn: {
        width: RIGHT_PANEL_RAIL_WIDTH,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    iconBtnPressed: {
        opacity: 0.7,
    },
    iconPill: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    tooltip: {
        position: "absolute",
        // Anchor the tooltip's right edge at the LEFT edge of the rail item
        // (right: '100%' relative to itemWrap), then offset 8px further left
        // via marginRight. This keeps width intrinsic to the label — using a
        // numeric `right` plus the default `left: 0` would force width to
        // (itemWrap.width - right), collapsing multi-word labels to tiny
        // wrapped boxes inside the 44px rail.
        right: "100%",
        marginRight: 8,
        top: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        shadowOpacity: 0.18,
        elevation: 6,
        zIndex: 100,
    },
    tooltipText: {
        fontSize: 12,
        fontWeight: "500",
    },
});

const RightSidePanel: React.FC<RightSidePanelProps> = ({
    mode,
    onModeChange,
    commentsSlot,
    chatSlot,
    previewSlot,
    containerWidth = 0,
    resizable = true,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => createStyles(colors, xl), [colors, xl]);

    const { widthPx, minPx, maxPx, commitWidth, reset } =
        useResizablePanel(containerWidth);

    type ActiveMode = Exclude<RightPanelMode, "none">;
    // Default to whichever slot is available.
    const defaultMode: ActiveMode = commentsSlot
        ? "comments"
        : chatSlot
            ? "chat"
            : "preview";

    // Remember the last active mode so an external trigger (e.g. mobile header
    // icons that get retained under Option C) can restore the user's last
    // surface preference if it ever decides to.
    const lastModeRef = useRef<ActiveMode>(defaultMode);
    useEffect(() => {
        if (mode !== "none") lastModeRef.current = mode;
    }, [mode]);

    const isExpanded = mode !== "none";

    // Drag-to-resize applies on web/xl while expanded. We apply an explicit
    // width even before the parent has measured the container (the hook falls
    // back to the min width) — otherwise the wrapper, which no longer supplies
    // flex, would let the panel collapse to the rail and render blank.
    const useControlledWidth = xl && resizable && isExpanded;
    // The panel owns its own desktop width now (parents no longer juggle flex):
    //  • collapsed            → the 44px rail
    //  • expanded + resizable → the user-dragged width
    //  • expanded, !resizable → flex:1 fill, so a parent animation drives width
    //
    // We override ONLY `width` and leave the base `flex: 1` intact: outerContainer
    // sits inside a *column* wrapper, so flex:1 fills the height while the explicit
    // `width` (cross-axis) sets the panel's measure. Setting flexGrow/Shrink here
    // would instead kill the vertical fill and let flexBasis:0% collapse the width.
    const widthStyle = useMemo(() => {
        if (!xl) return null;
        if (!isExpanded) return { width: RIGHT_PANEL_RAIL_WIDTH };
        if (useControlledWidth) return { width: widthPx };
        return null;
    }, [xl, isExpanded, useControlledWidth, widthPx]);

    /**
     * VS Code rule: tapping an icon opens to that mode if collapsed, switches
     * to that mode if a different surface is open, and collapses the panel
     * if its own mode is already active. One predictable rule across states.
     */
    const handleToggle = (target: ActiveMode) => {
        if (mode === target) {
            onModeChange("none");
        } else {
            onModeChange(target);
        }
    };

    // On mobile (!xl) the panel floats over the page: the persistent rail is
    // *not* used (Option C keeps the toggle icons in the PageHeader on mobile
    // to avoid eating ~10% of horizontal content width). When closed we render
    // nothing; when open we paint an absolutely-positioned overlay with a
    // scrim. Parent screens still render <RightSidePanel /> in their flex
    // layout, but on mobile it claims zero width and paints via absolute.
    if (!xl) {
        if (!isExpanded) return null;
        return (
            <View style={styles.mobileOverlayRoot} pointerEvents="box-none">
                <Pressable
                    style={styles.mobileScrim}
                    onPress={() => onModeChange("none")}
                    accessibilityRole="button"
                    accessibilityLabel="Close panel"
                />
                <View style={styles.mobileSheet}>
                    {mode === "comments" && commentsSlot}
                    {mode === "chat" && chatSlot}
                    {mode === "preview" && previewSlot}
                </View>
            </View>
        );
    }

    /**
     * Desktop layout: persistent rail on the LEFT of the panel, content area
     * to its right when expanded. When collapsed the panel is just the rail
     * (44px); parent screens detect this via the same `mode === "none"` check
     * and may apply their `rightPanelCollapsed` style to shrink the
     * outer container width to match.
     */
    return (
        <View style={[styles.outerContainer, widthStyle]}>
            {useControlledWidth && (
                <PanelResizeHandle
                    widthPx={widthPx}
                    minPx={minPx}
                    maxPx={maxPx}
                    onResize={commitWidth}
                    onReset={reset}
                />
            )}
            <View style={styles.rail}>
                {isExpanded && (
                    <RailButton
                        tooltip="Collapse panel"
                        onPress={() => onModeChange("none")}
                        colors={colors}
                    >
                        <FontAwesomeIcon
                            icon={faChevronRight}
                            size={12}
                            color={colors.textSecondary}
                        />
                    </RailButton>
                )}
                {commentsSlot && (
                    <RailIcon
                        icon={faCommentDots}
                        label="Comments"
                        active={mode === "comments"}
                        onPress={() => handleToggle("comments")}
                        colors={colors}
                    />
                )}
                {chatSlot && (
                    <RailIcon
                        icon={faRobot}
                        label="AI Chat"
                        active={mode === "chat"}
                        onPress={() => handleToggle("chat")}
                        colors={colors}
                    />
                )}
                {previewSlot && (
                    <RailIcon
                        icon={faEye}
                        label="Preview"
                        active={mode === "preview"}
                        onPress={() => handleToggle("preview")}
                        colors={colors}
                    />
                )}
            </View>
            {isExpanded && (
                <View style={styles.content}>
                    {mode === "comments" && commentsSlot}
                    {mode === "chat" && chatSlot}
                    {mode === "preview" && previewSlot}
                </View>
            )}
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        outerContainer: {
            flex: 1,
            flexDirection: "row",
            position: "relative",
            backgroundColor: colors.card,
            // Left-casting shadow creates depth between the panel and main content.
            // shadowOffset.width is negative to cast LEFT (toward the main panel).
            shadowColor: "#000",
            shadowOffset: { width: -8, height: 0 },
            shadowRadius: 20,
            shadowOpacity: 0.09,
            elevation: 10,
        },
        rail: {
            width: RIGHT_PANEL_RAIL_WIDTH,
            paddingTop: 8,
            alignItems: "center",
            gap: 4,
            backgroundColor: colors.card,
        },
        content: {
            flex: 1,
            overflow: "hidden",
        },
        // ── Mobile (!xl) floating overlay ───────────────────────────────────
        // Root spans the screen but lets touches through to the scrim/sheet.
        mobileOverlayRoot: {
            ...StyleSheet.absoluteFillObject,
            zIndex: 100,
            elevation: 100,
        },
        mobileScrim: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.4)",
        },
        mobileSheet: {
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "92%",
            backgroundColor: colors.card,
            // Left-casting shadow separates the floating sheet from the scrim
            // and the page beneath it.
            shadowColor: "#000",
            shadowOffset: { width: -8, height: 0 },
            shadowRadius: 20,
            shadowOpacity: 0.2,
            elevation: 16,
            overflow: "hidden",
        },
    });
}

export default RightSidePanel;
