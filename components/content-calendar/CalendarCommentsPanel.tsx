/**
 * CalendarCommentsPanel
 *
 * Right-panel comments surface for the Content Calendar screen.
 * Shows two contexts, switchable via a breadcrumb-style header:
 *
 *   1. Month notes   — comments at brands/{brandId}/calendarComments/{YYYY-MM}/comments
 *   2. Item comments — comments at brands/{brandId}/contents/{contentId}/comments
 *      Shown when the user taps the 💬 icon on a content chip.
 *      A "← Month" back button returns to the month view.
 *
 * Replaces QuickCommentModal + MonthCommentModal with an inline panel that
 * matches the strategy screen's CommentsPanel UX.
 */
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useContentComments } from "@/hooks/use-content-comments";
import { useMonthComments } from "@/hooks/use-month-comments";
import Colors from "@/shared-uis/constants/Colors";
import {
    faArrowLeft,
    faCalendarDays,
    faChevronRight,
    faCommentDots,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { CalendarItem } from "./types";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// ─── Shared comment row ────────────────────────────────────────────────────────

interface CommentRowProps {
    authorName: string;
    text: string;
    createdAt: number;
    isOwn: boolean;
    onDelete: () => void;
    colors: ReturnType<typeof Colors>;
}

const CommentRow: React.FC<CommentRowProps> = ({
    authorName,
    text,
    createdAt,
    isOwn,
    onDelete,
    colors,
}) => {
    const styles = useMemo(() => rowStyles(colors), [colors]);
    const ts = new Date(createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <View style={styles.row}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{authorName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.body}>
                <View style={styles.metaRow}>
                    <Text style={styles.authorName}>{authorName}</Text>
                    <Text style={styles.timestamp}>{ts}</Text>
                </View>
                <Text style={styles.commentText}>{text}</Text>
            </View>
            {isOwn && (
                <Pressable
                    style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
                    onPress={onDelete}
                >
                    <FontAwesomeIcon icon={faTrash} size={12} color={colors.textSecondary} />
                </Pressable>
            )}
        </View>
    );
};

// ─── Main panel ───────────────────────────────────────────────────────────────

interface CalendarCommentsPanelProps {
    year: number;
    month: number; // 0-indexed
    /** When set, shows item-level comments; null shows month-level comments. */
    selectedItem: CalendarItem | null;
    /** Called when the user taps "← Month" back button. */
    onClearSelectedItem: () => void;
    /** Called when the user taps the collapse chevron in the panel header. */
    onCollapse?: () => void;
}

const CalendarCommentsPanel: React.FC<CalendarCommentsPanelProps> = ({
    year,
    month,
    selectedItem,
    onClearSelectedItem,
    onCollapse,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => panelStyles(colors), [colors]);
    const { manager } = useAuthContext();

    // Always call both hooks — hooks cannot be conditional.
    const monthHook = useMonthComments(year, month);
    const itemHook = useContentComments(selectedItem?.id ?? null);

    const isItemMode = selectedItem !== null;
    const { comments, loading, addComment, deleteComment } = isItemMode ? itemHook : monthHook;

    const [draft, setDraft] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSend = useCallback(async () => {
        if (!draft.trim() || isSending) return;
        setIsSending(true);
        await addComment(draft.trim());
        setDraft("");
        setIsSending(false);
    }, [draft, isSending, addComment]);

    const monthLabel = `${MONTH_NAMES[month]} ${year}`;

    return (
        <View style={styles.container}>
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <View style={styles.header}>
                {/* Collapse chevron — always first in header */}
                {onCollapse && (
                    <Pressable
                        onPress={onCollapse}
                        style={({ pressed }) => [styles.collapseBtn, pressed && styles.collapseBtnPressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Collapse panel"
                    >
                        <FontAwesomeIcon icon={faChevronRight} size={11} color={colors.textSecondary} />
                    </Pressable>
                )}
                {isItemMode ? (
                    <>
                        <Pressable
                            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
                            onPress={onClearSelectedItem}
                        >
                            <FontAwesomeIcon icon={faArrowLeft} size={12} color={colors.primary} />
                            <Text style={styles.backBtnText}>Month</Text>
                        </Pressable>
                        <FontAwesomeIcon icon={faCommentDots} size={14} color={colors.primary} />
                        <Text style={styles.title} numberOfLines={1}>
                            {selectedItem.title}
                        </Text>
                    </>
                ) : (
                    <>
                        <FontAwesomeIcon icon={faCalendarDays} size={14} color={colors.primary} />
                        <Text style={styles.title}>{monthLabel}</Text>
                    </>
                )}
                {comments.length > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{comments.length}</Text>
                    </View>
                )}
            </View>

            {/* ── Context subtitle ────────────────────────────────────────────── */}
            <View style={styles.subtitleRow}>
                <Text style={styles.subtitle}>
                    {isItemMode
                        ? "Comments on this content item"
                        : "Notes & feedback for this month"}
                </Text>
            </View>

            {/* ── Comment list ─────────────────────────────────────────────────── */}
            {loading ? (
                <ActivityIndicator style={styles.loader} color={colors.primary} />
            ) : (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {comments.length === 0 ? (
                        <Text style={styles.emptyText}>
                            {isItemMode
                                ? "No comments on this item yet."
                                : `No notes for ${monthLabel} yet.`}
                        </Text>
                    ) : (
                        comments.map((c) => (
                            <CommentRow
                                key={c.id}
                                authorName={c.authorName}
                                text={c.text}
                                createdAt={c.createdAt}
                                isOwn={c.authorId === manager?.id}
                                onDelete={() => deleteComment(c.id)}
                                colors={colors}
                            />
                        ))
                    )}
                </ScrollView>
            )}

            {/* ── Compose ─────────────────────────────────────────────────────── */}
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <View style={styles.compose}>
                    <TextInput
                        style={styles.input}
                        placeholder={isItemMode ? "Comment on this item..." : "Add a note for this month..."}
                        placeholderTextColor={colors.textSecondary}
                        value={draft}
                        onChangeText={setDraft}
                        multiline
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <Pressable
                        style={({ pressed }) => [
                            styles.sendBtn,
                            !draft.trim() && styles.sendBtnDisabled,
                            pressed && styles.btnPressed,
                        ]}
                        onPress={handleSend}
                        disabled={!draft.trim() || isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color={colors.onPrimary} />
                        ) : (
                            <Text style={styles.sendBtnText}>Post</Text>
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

function rowStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        row: {
            flexDirection: "row",
            gap: 10,
            alignItems: "flex-start",
            padding: 10,
            backgroundColor: colors.background,
            borderRadius: 10,
            // Shadow lifts each comment card — no border needed
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            shadowOpacity: 0.05,
            elevation: 2,
        },
        avatar: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.aliceBlue,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
        },
        avatarText: {
            fontSize: 11,
            fontWeight: "700",
            color: colors.primary,
        },
        body: { flex: 1, gap: 3 },
        metaRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        authorName: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.text,
        },
        timestamp: {
            fontSize: 11,
            color: colors.textSecondary,
        },
        commentText: {
            fontSize: 13,
            color: colors.text,
            lineHeight: 18,
        },
        deleteBtn: { padding: 6 },
    });
}

function panelStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.card,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingLeft: 8,
            paddingRight: 12,
            paddingVertical: 12,
            backgroundColor: colors.card,
            // Downward shadow separates header from scrolling content below
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
            zIndex: 1,
        },
        collapseBtn: {
            padding: 6,
            borderRadius: 6,
        },
        collapseBtnPressed: {
            backgroundColor: colors.tag,
        },
        backBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingVertical: 2,
            paddingRight: 8,
            marginRight: 2,
            // Padding provides visual separation — no borderRight needed
        },
        backBtnText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.primary,
        },
        title: {
            flex: 1,
            fontSize: 13,
            fontWeight: "600",
            color: colors.text,
        },
        badge: {
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 4,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
        },
        badgeText: {
            fontSize: 10,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        subtitleRow: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: colors.background,
            // Gentle downward shadow — no border needed
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        subtitle: {
            fontSize: 11,
            color: colors.textSecondary,
        },
        loader: { marginVertical: 32 },
        scroll: { flex: 1 },
        scrollContent: {
            padding: 12,
            gap: 8,
        },
        emptyText: {
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: "center",
            paddingVertical: 24,
            lineHeight: 20,
        },
        compose: {
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            padding: 10,
            backgroundColor: colors.card,
            // Upward shadow floats compose area above scroll content
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowRadius: 8,
            shadowOpacity: 0.05,
            elevation: 4,
        },
        input: {
            flex: 1,
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 9,
            fontSize: 13,
            color: colors.text,
            maxHeight: 100,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        sendBtn: {
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 10,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            minWidth: 52,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        sendBtnDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
        sendBtnText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        btnPressed: { opacity: 0.72 },
    });
}

export default CalendarCommentsPanel;
