import { ContentStrategy, ReviewStatus } from "@/components/content-strategy/types";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import {
    faCalendarDays,
    faCheck,
    faCircleCheck,
    faEllipsis,
    faLock,
    faPaperPlane,
    faRotateLeft,
    faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import RichTextEditor from "@/components/rich-text-editor";

const PlatformEditor: React.ComponentType<EditorProps> = RichTextEditor;

// ── Types ─────────────────────────────────────────────────────────────────────

interface EditorProps {
    content: string;
    onChange: (text: string) => void;
    onSendToChat: (text: string) => void;
    onSnippetComment?: (snippet: string, anchorStart: number, anchorEnd: number) => void;
    strategyId?: string;
}

export interface ToolbarProps {
    strategy: ContentStrategy;
    currentManagerId: string;
    xl: boolean;
    onApprove: () => void;
    onRequestChanges: () => void;
    onInvite: () => void;
    onSendForReview: () => void;
    onPushToCalendar: () => void;
}

export interface StrategyEditorPanelProps extends EditorProps {
    toolbar?: ToolbarProps;
}

// ── Status pill config (token-driven, theme-aware) ────────────────────────────

type StatusVisual = { bg: string; text: string; label: string };

function statusVisual(
    status: ReviewStatus,
    colors: ReturnType<typeof Colors>
): StatusVisual {
    switch (status) {
        case "in_review":
            return { bg: colors.toastWarningBg, text: colors.toastWarning, label: "Pending Review" };
        case "approved":
            return { bg: colors.toastSuccessBg, text: colors.toastSuccess, label: "Approved" };
        case "changes_requested":
            return { bg: colors.toastErrorBg, text: colors.toastError, label: "Changes Requested" };
        case "draft":
        default:
            return { bg: colors.tag, text: colors.textSecondary, label: "Draft" };
    }
}

// ── Overflow ("⋯") menu — anchored dropdown, cross-platform ───────────────────

interface MenuItem {
    label: string;
    icon: IconDefinition;
    onPress: () => void;
    destructive?: boolean;
}

const MENU_WIDTH = 220;

const OverflowMenu: React.FC<{
    items: MenuItem[];
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof toolbarStyles>;
}> = ({ items, colors, styles }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<View>(null);

    if (items.length === 0) return null;

    const openMenu = () => {
        const node = triggerRef.current;
        if (node && typeof node.measureInWindow === "function") {
            node.measureInWindow((x, y, w, h) => {
                setPos({ top: y + h + 6, left: Math.max(8, x + w - MENU_WIDTH) });
                setOpen(true);
            });
        } else {
            setOpen(true);
        }
    };

    return (
        <>
            <Pressable
                ref={triggerRef}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.btnPressed]}
                onPress={openMenu}
                hitSlop={6}
                accessibilityLabel="More actions"
            >
                <FontAwesomeIcon icon={faEllipsis} size={16} color={colors.textSecondary} />
            </Pressable>

            <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={styles.menuBackdrop} onPress={() => setOpen(false)}>
                    <View style={[styles.menuCard, { top: pos.top, left: pos.left }]}>
                        {items.map((item) => (
                            <Pressable
                                key={item.label}
                                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                                onPress={() => {
                                    setOpen(false);
                                    item.onPress();
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={item.icon}
                                    size={14}
                                    color={item.destructive ? colors.toastError : colors.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.menuItemText,
                                        item.destructive && { color: colors.toastError },
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </>
    );
};

// ── Strategy Toolbar ──────────────────────────────────────────────────────────

const StrategyToolbar: React.FC<ToolbarProps & { colors: ReturnType<typeof Colors> }> = ({
    strategy,
    currentManagerId,
    xl,
    onApprove,
    onRequestChanges,
    onInvite,
    onSendForReview,
    onPushToCalendar,
    colors,
}) => {
    const reviewStatus = strategy.reviewStatus ?? "draft";
    const status = statusVisual(reviewStatus, colors);
    const isReviewer =
        reviewStatus === "in_review" &&
        strategy.collaboratorIds?.includes(currentManagerId) &&
        strategy.reviewRequestedBy !== currentManagerId;
    const canSendForReview = reviewStatus === "draft" || reviewStatus === "changes_requested";

    const inviteCount = strategy.collaboratorIds?.length ?? 0;
    const isShared = inviteCount > 0;

    const styles = toolbarStyles(colors, xl);

    // Autosave is silent and instant — intercept Cmd/Ctrl+S so the manual-save
    // reflex lands on a reassuring toast instead of the browser's save dialog.
    useEffect(() => {
        if (Platform.OS !== "web" || typeof document === "undefined") return;
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
                e.preventDefault();
                Toaster.info(
                    "Already saved",
                    "This strategy autosaves as you type — no need to save manually."
                );
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    const overflowItems: MenuItem[] = [
        { label: "Push to Calendar", icon: faCalendarDays, onPress: onPushToCalendar },
    ];

    return (
        <View style={styles.row}>
            {/* ── Left: identity + autosave assurance ──────────────────────── */}
            <View style={styles.infoCluster}>
                <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusPillText, { color: status.text }]} numberOfLines={1}>
                        {status.label}
                    </Text>
                </View>

                <View style={styles.savedBlock}>
                    <View style={styles.savedRow}>
                        <FontAwesomeIcon icon={faCircleCheck} size={12} color={colors.toastSuccess} />
                        <Text style={styles.savedLabel}>Saved</Text>
                    </View>
                    {xl && <Text style={styles.savedSub}>Autosaves as you type</Text>}
                </View>
            </View>

            {/* ── Right: collaborators + decision + overflow ───────────────── */}
            <View style={styles.actions}>
                <Pressable
                    style={({ pressed }) => [styles.collabChip, pressed && styles.btnPressed]}
                    onPress={onInvite}
                    accessibilityLabel={isShared ? `Shared with ${inviteCount}` : "Private — invite collaborators"}
                >
                    <FontAwesomeIcon
                        icon={isShared ? faUserGroup : faLock}
                        size={12}
                        color={isShared ? colors.primary : colors.textSecondary}
                    />
                    <Text
                        style={[styles.collabChipText, isShared && { color: colors.primary }]}
                        numberOfLines={1}
                    >
                        {isShared ? `${inviteCount} invited` : "Private"}
                    </Text>
                </Pressable>

                {isReviewer && (
                    <Pressable
                        style={({ pressed }) => [styles.ghostBtn, pressed && styles.btnPressed]}
                        onPress={onRequestChanges}
                        accessibilityLabel="Request Changes"
                    >
                        <FontAwesomeIcon icon={faRotateLeft} size={12} color={colors.toastError} />
                        {xl && <Text style={[styles.ghostBtnText, { color: colors.toastError }]}>Request Changes</Text>}
                    </Pressable>
                )}

                {isReviewer && (
                    <Pressable
                        style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                        onPress={onApprove}
                        accessibilityLabel="Approve"
                    >
                        <FontAwesomeIcon icon={faCheck} size={12} color={colors.onPrimary} />
                        <Text style={styles.primaryBtnText}>Approve</Text>
                    </Pressable>
                )}

                {!isReviewer && canSendForReview && (
                    <Pressable
                        style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                        onPress={onSendForReview}
                        accessibilityLabel="Send for Review"
                    >
                        <FontAwesomeIcon icon={faPaperPlane} size={12} color={colors.onPrimary} />
                        {xl && <Text style={styles.primaryBtnText}>Send for Review</Text>}
                    </Pressable>
                )}

                <OverflowMenu items={overflowItems} colors={colors} styles={styles} />
            </View>
        </View>
    );
};

function toolbarStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        row: {
            backgroundColor: colors.card,
            paddingHorizontal: xl ? 16 : 12,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
            zIndex: 2,
        },
        infoCluster: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 0,
        },
        statusPill: {
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 999,
        },
        statusPillText: {
            fontSize: 12,
            fontWeight: "700",
        },
        savedBlock: {
            minWidth: 0,
        },
        savedRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
        },
        savedLabel: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.text,
        },
        savedSub: {
            fontSize: 11,
            color: colors.textSecondary,
            marginTop: 1,
        },
        actions: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginLeft: "auto",
        },
        collabChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        collabChipText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        primaryBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        primaryBtnText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        ghostBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: xl ? 12 : 9,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: colors.toastErrorBg,
        },
        ghostBtnText: {
            fontSize: 13,
            fontWeight: "600",
        },
        iconBtn: {
            width: 34,
            height: 34,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        btnPressed: {
            opacity: 0.72,
        },
        menuBackdrop: {
            flex: 1,
            backgroundColor: colors.transparent,
        },
        menuCard: {
            position: "absolute",
            width: MENU_WIDTH,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 24,
            shadowOpacity: 0.16,
            elevation: 12,
        },
        menuItem: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 14,
            paddingVertical: 11,
        },
        menuItemPressed: {
            backgroundColor: colors.secondarySurface,
        },
        menuItemText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.text,
        },
    });
}

// ── StrategyEditorPanel ───────────────────────────────────────────────────────

const StrategyEditorPanel: React.FC<StrategyEditorPanelProps> = (props) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { toolbar, ...editorProps } = props;

    return (
        <View style={{ flex: 1 }}>
            {toolbar && <StrategyToolbar {...toolbar} colors={colors} />}
            <PlatformEditor {...editorProps} />
        </View>
    );
};

export default StrategyEditorPanel;
