/**
 * RightSidePanel
 *
 * Shared layout wrapper for the collapsible right-side panel used on the
 * Strategy and Calendar screens. Manages:
 *
 *  - Left-casting shadow that visually separates the panel from the main content
 *  - Mode switching: 'none' | 'comments' | 'chat'
 *    • 'none'     → panel collapsed to a slim icon strip (24px)
 *    • 'comments' → renders commentsSlot (chevron lives in that panel's header)
 *    • 'chat'     → renders chatSlot (chevron lives in that panel's header)
 *
 * The parent screen owns `mode` state and passes `onModeChange`.
 * Each panel slot receives an `onCollapse` callback and renders the chevron
 * inline in its own header — no separate handle column needed when expanded.
 *
 * Usage:
 *   <RightSidePanel
 *     mode={rightPanelMode}
 *     onModeChange={setRightPanelMode}
 *     commentsSlot={<CommentsPanel onCollapse={...} ... />}
 *     chatSlot={<AIChatPanel onCollapse={...} ... />}
 *   />
 */
import Colors from "@/shared-uis/constants/Colors";
import { faChevronLeft, faCommentDots, faRobot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export type RightPanelMode = "none" | "comments" | "chat";

interface RightSidePanelProps {
    mode: RightPanelMode;
    onModeChange: (mode: RightPanelMode) => void;
    /** Content to show when mode === 'comments'. The slot should accept
     *  an onCollapse prop and render the chevron in its own header. */
    commentsSlot?: React.ReactNode;
    /** Content to show when mode === 'chat'. Same convention as commentsSlot. */
    chatSlot: React.ReactNode;
}

const RightSidePanel: React.FC<RightSidePanelProps> = ({
    mode,
    onModeChange,
    commentsSlot,
    chatSlot,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Remember the last active mode so the collapsed strip can restore it on tap.
    const lastModeRef = useRef<"comments" | "chat">("chat");
    useEffect(() => {
        if (mode !== "none") lastModeRef.current = mode;
    }, [mode]);

    const isExpanded = mode !== "none";

    const handleExpand = () => {
        // Expand to last mode, falling back to 'chat' if comments slot not provided.
        const target = lastModeRef.current === "comments" && commentsSlot
            ? "comments"
            : "chat";
        onModeChange(target);
    };

    return (
        <View style={styles.outerContainer}>
            {isExpanded ? (
                /* ── Expanded: full-width content, chevron lives in each panel's header */
                <View style={styles.content}>
                    {mode === "comments" && commentsSlot}
                    {mode === "chat" && chatSlot}
                </View>
            ) : (
                /* ── Collapsed: slim 24px strip — mode icon signals what will reopen */
                <Pressable
                    style={({ pressed }) => [styles.collapsedStrip, pressed && styles.stripPressed]}
                    onPress={handleExpand}
                    accessibilityRole="button"
                    accessibilityLabel="Expand panel"
                >
                    <FontAwesomeIcon icon={faChevronLeft} size={10} color={colors.textSecondary} />
                    <FontAwesomeIcon
                        icon={lastModeRef.current === "comments" ? faCommentDots : faRobot}
                        size={14}
                        color={colors.primary}
                    />
                </Pressable>
            )}
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        outerContainer: {
            flex: 1,
            backgroundColor: colors.card,
            // Left-casting shadow creates depth between the panel and main content.
            // shadowOffset.width is negative to cast LEFT (toward the main panel).
            shadowColor: "#000",
            shadowOffset: { width: -8, height: 0 },
            shadowRadius: 20,
            shadowOpacity: 0.09,
            elevation: 10,
        },
        content: {
            flex: 1,
            overflow: "hidden",
        },
        // Shown only when collapsed — 24px slim strip with the mode icon.
        collapsedStrip: {
            flex: 1,
            width: 24,
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: colors.card,
        },
        stripPressed: {
            backgroundColor: colors.tag,
        },
    });
}

export default RightSidePanel;
