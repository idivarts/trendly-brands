import CollaboratorsSection from "@/components/content-strategy/CollaboratorsSection";
import { ContentStrategy, ReviewStatus } from "@/components/content-strategy/types";
import RichTextEditor from "@/components/rich-text-editor";
import ShareModal from "@/components/sharing/ShareModal";
import { useBrandContext } from "@/contexts/brand-context.provider";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
    faBars,
    faCalendarDays,
    faCheck,
    faChevronDown,
    faChevronLeft,
    faCircleCheck,
    faClock,
    faEllipsis,
    faPaperPlane,
    faPen,
    faPlus,
    faRotateLeft,
    faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Modal, NativeSyntheticEvent, Platform, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputKeyPressEventData, View, ViewStyle } from "react-native";

const PlatformEditor: React.ComponentType<EditorProps> = RichTextEditor;

// ── Types ─────────────────────────────────────────────────────────────────────

interface EditorProps {
    content: string;
    onChange: (text: string) => void;
    onSendToChat: (text: string) => void;
    onSnippetComment?: (snippet: string, anchorStart: number, anchorEnd: number) => void;
    strategyId?: string;
    /** Enable real-time co-editing (web Yjs CRDT). Ignored by the native editor. */
    collaborative?: boolean;
    /** Single-writer lock state (Phase 3) — drives read-only / Edit / Done UI. */
    lock?: {
        editable: boolean;
        lockedByName?: string | null;
        onRequestEdit?: () => void;
        onEndEdit?: () => void;
    };
}

export interface ToolbarProps {
    strategy: ContentStrategy;
    currentManagerId: string;
    xl: boolean;
    onApprove: () => void;
    onRequestChanges: () => void;
    onSendForReview: () => void;
    onPushToCalendar: () => void;
    onRename: (name: string) => void;
    onOpenDrawer?: () => void;
    onNewStrategy: () => void;
    /** Navigate back to the strategies listing. Surfaced as a leading back
     *  button on mobile (!xl), where there's otherwise no way out. */
    onBack?: () => void;
}

export interface StrategyEditorPanelProps extends EditorProps {
    toolbar?: ToolbarProps;
}

// ── Status pill config (token-driven, theme-aware) ────────────────────────────

type StatusVisual = { bg: string; text: string; label: string; icon: IconDefinition };

function statusVisual(
    status: ReviewStatus,
    colors: ReturnType<typeof Colors>
): StatusVisual {
    switch (status) {
        case "in_review":
            return { bg: colors.toastWarningBg, text: colors.toastWarning, label: "Pending Review", icon: faClock };
        case "approved":
            return { bg: colors.toastSuccessBg, text: colors.toastSuccess, label: "Approved", icon: faCircleCheck };
        case "changes_requested":
            return { bg: colors.toastErrorBg, text: colors.toastError, label: "Changes Requested", icon: faRotateLeft };
        case "draft":
        default:
            return { bg: colors.tag, text: colors.textSecondary, label: "Draft", icon: faPen };
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

// ── Editable strategy name ────────────────────────────────────────────────────
// Click-to-edit inline title. Display ⇆ edit swap is metric-matched so the
// toolbar height never jumps. Commits on blur / Enter; Escape cancels; empty or
// unchanged input reverts (a strategy is never left blank). Read-only for pure
// reviewers — they still see which strategy they're reviewing.

const EditableTitle: React.FC<{
    name: string;
    editable: boolean;
    onRename: (name: string) => void;
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof toolbarStyles>;
}> = ({ name, editable, onRename, colors, styles }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(name);
    const [hovered, setHovered] = useState(false);
    const inputRef = useRef<TextInput>(null);

    // Mirror upstream renames (e.g. a collaborator changed it) while idle.
    useEffect(() => {
        if (!editing) setDraft(name);
    }, [name, editing]);

    const beginEdit = () => {
        if (!editable) return;
        setDraft(name);
        setEditing(true);
    };

    const commit = () => {
        if (!editing) return;
        setEditing(false);
        const trimmed = draft.trim();
        if (!trimmed || trimmed === name) {
            setDraft(name);
            return;
        }
        onRename(trimmed);
    };

    const cancel = () => {
        setEditing(false);
        setDraft(name);
    };

    // Select-all on focus so the chosen "type to replace" rename flow works.
    const handleFocus = () => {
        const node = inputRef.current as unknown as
            | { setSelection?: (s: number, e: number) => void; select?: () => void }
            | null;
        if (node?.setSelection) node.setSelection(0, draft.length);
        else if (Platform.OS === "web" && node?.select) node.select();
    };

    const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (e.nativeEvent.key === "Escape") cancel();
    };

    if (editing) {
        return (
            <TextInput
                ref={inputRef}
                style={styles.titleInput}
                value={draft}
                onChangeText={setDraft}
                onFocus={handleFocus}
                onBlur={commit}
                onSubmitEditing={commit}
                onKeyPress={handleKeyPress}
                autoFocus
                blurOnSubmit
                multiline={false}
                numberOfLines={1}
                returnKeyType="done"
                selectTextOnFocus
                placeholder="Strategy name"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Strategy name"
            />
        );
    }

    return (
        <Pressable
            onPress={beginEdit}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            disabled={!editable}
            hitSlop={8}
            style={[styles.titleButton, editable && hovered && styles.titleButtonHovered]}
            accessibilityRole={editable ? "button" : "text"}
            accessibilityLabel={editable ? `Rename strategy, ${name}` : name}
        >
            <Text style={styles.titleText} numberOfLines={1}>
                {name || "Untitled strategy"}
            </Text>
            {editable && (
                <FontAwesomeIcon icon={faPen} size={11} color={colors.textSecondary} />
            )}
        </Pressable>
    );
};

// ── Tooltip — hover (web) / tap (touch) hint ──────────────────────────────────
// Lifts on a shadow (no border). The trigger always carries an accessibilityLabel
// so the hint's meaning survives for screen readers and on touch, where there is
// no hover. The card is pointer-transparent so it never eats the next tap.

const TOOLTIP_MAX_WIDTH = 260;

const Tooltip: React.FC<{
    text: string;
    accessibilityLabel: string;
    align: "left" | "right";
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof toolbarStyles>;
    triggerStyle?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}> = ({ text, accessibilityLabel, align, styles, triggerStyle, children }) => {
    const [open, setOpen] = useState(false);

    return (
        <View style={styles.tooltipWrap}>
            <Pressable
                onPress={() => setOpen((o) => !o)}
                onHoverIn={() => setOpen(true)}
                onHoverOut={() => setOpen(false)}
                hitSlop={8}
                style={triggerStyle}
                accessibilityLabel={accessibilityLabel}
            >
                {children}
            </Pressable>
            {open && (
                <View
                    pointerEvents="none"
                    style={[styles.tooltipCard, align === "left" ? styles.tooltipLeft : styles.tooltipRight]}
                >
                    <Text style={styles.tooltipText}>{text}</Text>
                </View>
            )}
        </View>
    );
};

// ── Status badge with dropdown ────────────────────────────────────────────────
// The status pill doubles as the entry point for status transitions
// (Send for Review / Approve / Request Changes). When the current viewer has no
// available transition for the current state, the badge renders as a static
// display — no chevron, no press affordance.

const StatusBadge: React.FC<{
    status: StatusVisual;
    xl: boolean;
    items: MenuItem[];
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof toolbarStyles>;
}> = ({ status, xl, items, colors, styles }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<View>(null);

    const hasMenu = items.length > 0;

    const openMenu = () => {
        if (!hasMenu) return;
        const node = triggerRef.current;
        if (node && typeof node.measureInWindow === "function") {
            node.measureInWindow((x, y, _w, h) => {
                setPos({ top: y + h + 6, left: Math.max(8, x) });
                setOpen(true);
            });
        } else {
            setOpen(true);
        }
    };

    // Always a labeled pill — on mobile too. (The old icon-only circle read as
    // an orphaned glyph, e.g. a bare pencil for "Draft".)
    const pill = (
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusPillText, { color: status.text }]} numberOfLines={1}>
                {status.label}
            </Text>
            {hasMenu && (
                <FontAwesomeIcon icon={faChevronDown} size={10} color={status.text} />
            )}
        </View>
    );

    if (!hasMenu) {
        return pill;
    }

    return (
        <>
            <Pressable
                ref={triggerRef}
                onPress={openMenu}
                hitSlop={6}
                accessibilityLabel={`Status: ${status.label}. Tap to change.`}
                accessibilityRole="button"
            >
                {pill}
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
    onSendForReview,
    onPushToCalendar,
    onRename,
    onOpenDrawer,
    onNewStrategy,
    onBack,
    colors,
}) => {
    const { hasCapability, selectedBrand } = useBrandContext();
    const [shareOpen, setShareOpen] = useState(false);
    const reviewStatus = strategy.reviewStatus ?? "draft";
    const status = statusVisual(reviewStatus, colors);
    const isReviewer =
        reviewStatus === "in_review" &&
        strategy.collaboratorIds?.includes(currentManagerId) &&
        strategy.reviewRequestedBy !== currentManagerId;
    const canSendForReview =
        (reviewStatus === "draft" || reviewStatus === "changes_requested") &&
        hasCapability("manage_content_strategy");
    const canShare =
        hasCapability("manage_content_strategy") && !!selectedBrand?.id && !!strategy.id;

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
        // On mobile, Share collapses into the overflow menu (no room for a
        // dedicated button); on desktop it stays a first-class toolbar icon.
        ...(!xl && canShare
            ? [{ label: "Share", icon: faShareNodes, onPress: () => setShareOpen(true) }]
            : []),
        ...(onOpenDrawer ? [{ label: "All Strategies", icon: faBars, onPress: onOpenDrawer }] : []),
        { label: "New Strategy", icon: faPlus, onPress: onNewStrategy },
        { label: "Push to Calendar", icon: faCalendarDays, onPress: onPushToCalendar },
    ];

    // Status transitions available to this viewer in the current state. The
    // status badge surfaces these as a dropdown — there is no separate set of
    // action buttons. When this list is empty the badge is a static display.
    const statusMenuItems: MenuItem[] = [
        ...(isReviewer
            ? [
                { label: "Approve", icon: faCheck, onPress: onApprove },
                { label: "Request Changes", icon: faRotateLeft, onPress: onRequestChanges, destructive: true },
            ]
            : []),
        ...(canSendForReview
            ? [{ label: "Send for Review", icon: faPaperPlane, onPress: onSendForReview }]
            : []),
    ];

    return (
        <View style={styles.row}>
            {/* ── Leading back button (mobile only) — the detail screen is
                  otherwise a navigational dead-end on !xl. ──────────────────── */}
            {!xl && onBack && (
                <Pressable
                    onPress={onBack}
                    hitSlop={8}
                    style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
                    accessibilityLabel="Back to strategies"
                    accessibilityRole="button"
                >
                    <FontAwesomeIcon icon={faChevronLeft} size={16} color={colors.text} />
                </Pressable>
            )}

            {/* ── Left: identity + autosave assurance ──────────────────────── */}
            <View style={styles.infoCluster}>
                <EditableTitle
                    name={strategy.title}
                    editable={!isReviewer}
                    onRename={onRename}
                    colors={colors}
                    styles={styles}
                />

                <StatusBadge
                    status={status}
                    xl={xl}
                    items={statusMenuItems}
                    colors={colors}
                    styles={styles}
                />
            </View>

            {/* ── Right: autosave status + collaborators + decision + overflow ─ */}
            <View style={styles.actions}>
                {/* Passive autosave status — desktop only. On mobile it's a
                    reassurance that doesn't earn an active-control slot. */}
                {xl && (
                    <Tooltip
                        text="Autosaves as you type — no need to save manually."
                        accessibilityLabel="Saved — autosaves as you type"
                        align="right"
                        colors={colors}
                        styles={styles}
                        triggerStyle={styles.savedTrigger}
                    >
                        <FontAwesomeIcon icon={faCircleCheck} size={16} color={colors.toastSuccess} />
                    </Tooltip>
                )}

                {/* Share is a first-class button on desktop; on mobile it lives
                    in the overflow menu (see overflowItems above). */}
                {xl && canShare && (
                    <Pressable
                        style={({ pressed }) => [styles.iconBtn, pressed && styles.btnPressed]}
                        onPress={() => setShareOpen(true)}
                        hitSlop={6}
                        accessibilityLabel="Share"
                        accessibilityRole="button"
                    >
                        <FontAwesomeIcon icon={faShareNodes} size={15} color={colors.primary} />
                    </Pressable>
                )}

                <OverflowMenu items={overflowItems} colors={colors} styles={styles} />
            </View>

            {/* Controlled share modal — opened from the desktop icon or the
                mobile overflow item. */}
            {canShare && (
                <ShareModal
                    visible={shareOpen}
                    target={{
                        type: "strategy",
                        brandId: selectedBrand!.id,
                        resourceId: strategy.id,
                    }}
                    title={strategy.title || "Untitled strategy"}
                    onClose={() => setShareOpen(false)}
                    extraSection={
                        <CollaboratorsSection
                            strategyId={strategy.id}
                            collaboratorIds={strategy.collaboratorIds ?? []}
                        />
                    }
                />
            )}
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
        titleButton: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            flexShrink: 1,
            minWidth: 0,
            paddingVertical: 4,
            paddingHorizontal: 6,
            borderRadius: 6,
        },
        titleButtonHovered: {
            backgroundColor: colors.tag,
        },
        titleText: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
            lineHeight: 20,
            flexShrink: 1,
        },
        titleInput: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
            lineHeight: 20,
            paddingVertical: 4,
            paddingHorizontal: 6,
            borderRadius: 6,
            backgroundColor: colors.tag,
            flexGrow: 1,
            flexShrink: 1,
            minWidth: 80,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            shadowOpacity: 0.25,
            elevation: 2,
            ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null),
        },
        statusPill: {
            flexShrink: 0,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 999,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
        },
        statusPillText: {
            fontSize: 12,
            fontWeight: "700",
        },
        savedTrigger: {
            flexShrink: 0,
            width: 34,
            height: 34,
            alignItems: "center",
            justifyContent: "center",
        },
        tooltipWrap: {
            position: "relative",
            flexShrink: 0,
        },
        tooltipCard: {
            position: "absolute",
            top: "100%",
            marginTop: 6,
            width: TOOLTIP_MAX_WIDTH,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            shadowOpacity: 0.16,
            elevation: 12,
            zIndex: 50,
        },
        tooltipLeft: {
            left: 0,
        },
        tooltipRight: {
            right: 0,
        },
        tooltipText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.text,
            lineHeight: 16,
        },
        actions: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginLeft: "auto",
        },
        backBtn: {
            width: 34,
            height: 34,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
            flexShrink: 0,
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
