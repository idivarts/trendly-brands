/**
 * SharedCommentsPanel
 *
 * Unified comment panel used across Strategy, Calendar, and Content Detail
 * screens. All features are opt-in via props — only what you pass is rendered.
 *
 * Feature flags (controlled by which props are provided):
 *  - Threading/replies   → `onAddReply` provided
 *  - Resolve/unresolve   → `onResolveComment` provided
 *  - Snippet quote       → `comment.snippet` is set
 *  - Back navigation     → `onBack` + `backLabel` provided (calendar breadcrumb)
 *  - Collapse chevron    → `onCollapse` provided
 *
 * UI rules:
 *  - Zero structural borders — shadows for depth
 *  - Accent stripes via <View width={N}> child, not borderLeftWidth
 */
import Colors from "@/shared-uis/constants/Colors";
import {
    faArrowLeft,
    faCheck,
    faChevronRight,
    faReply,
    faRobot,
    faTrash,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBreakpoints } from "@/hooks";
import { useBrandMembers } from "@/hooks/use-brand-members";
import MentionInput from "@/components/shared/MentionInput";

// ─── Public Types ─────────────────────────────────────────────────────────────

/**
 * Normalised comment shape accepted by the panel.
 * Compatible with StrategyComment, ContentComment, and MonthComment — all
 * extend IComment which has these fields.
 */
export interface PanelComment {
    id: string;
    authorId: string;
    authorName: string;
    text: string;
    createdAt: number;
    parentId?: string | null;
    resolved?: boolean;
    /** Strategy inline snippet — shown as a quoted block above the text. */
    snippet?: string;
}

export interface SharedCommentsPanelProps {
    // ── Data ─────────────────────────────────────────────────────────────────
    comments: PanelComment[];
    loading: boolean;
    // ── CRUD ─────────────────────────────────────────────────────────────────
    onAddComment: (text: string) => Promise<void>;
    onDeleteComment: (id: string) => Promise<void>;
    /** Omit to disable threading — all comments render as a flat list. */
    onAddReply?: (parentId: string, text: string) => Promise<void>;
    /** Omit to hide the Resolve/Unresolve action. */
    onResolveComment?: (id: string, resolved: boolean) => Promise<void>;
    /** Omit to hide the "Send to AI" action (pushes the comment into the AI chat). */
    onSendToAI?: (comment: PanelComment) => void;
    // ── Header ───────────────────────────────────────────────────────────────
    title: string;
    titleIcon: IconDefinition;
    /** Shows a `›` chevron before the title — calls this when tapped. */
    onCollapse?: () => void;
    /** Shows a back arrow before the mode icon — calls this when tapped. */
    onBack?: () => void;
    backLabel?: string;
    // ── User ─────────────────────────────────────────────────────────────────
    currentUserId: string;
    // ── Compose / Empty ──────────────────────────────────────────────────────
    placeholder?: string;
    maxLength?: number;
    emptyText?: string;
}

// ─── Comment Bubble ───────────────────────────────────────────────────────────

interface CommentBubbleProps {
    comment: PanelComment;
    replies: PanelComment[];
    currentUserId: string;
    threaded: boolean;
    onReply?: (parentId: string) => void;
    onResolve?: (id: string, resolved: boolean) => void;
    onDelete: (id: string) => void;
    onSendToAI?: (comment: PanelComment) => void;
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof bubbleStyles>;
}

const CommentBubble: React.FC<CommentBubbleProps> = ({
    comment,
    replies,
    currentUserId,
    threaded,
    onReply,
    onResolve,
    onDelete,
    onSendToAI,
    colors,
    styles,
}) => {
    const isOwn = comment.authorId === currentUserId;
    const ts = new Date(comment.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <View style={[styles.bubble, comment.resolved && styles.bubbleResolved]}>
            {/* Snippet quote — accent stripe via child View, not borderLeftWidth */}
            {comment.snippet && (
                <View style={styles.snippetQuote}>
                    <View style={styles.snippetAccent} />
                    <Text style={styles.snippetText} numberOfLines={2}>
                        "{comment.snippet}"
                    </Text>
                </View>
            )}

            {/* Author row */}
            <View style={styles.metaRow}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {comment.authorName.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.authorName}>{comment.authorName}</Text>
                <Text style={styles.timestamp}>{ts}</Text>
                {comment.resolved && (
                    <View style={styles.resolvedBadge}>
                        <Text style={styles.resolvedText}>Resolved</Text>
                    </View>
                )}
            </View>

            <Text style={styles.commentText}>{comment.text}</Text>

            {/* Actions */}
            <View style={styles.actionsRow}>
                {threaded && onReply && (
                    <Pressable
                        style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
                        onPress={() => onReply(comment.id)}
                    >
                        <FontAwesomeIcon icon={faReply} size={11} color={colors.textSecondary} />
                        <Text style={styles.actionText}>Reply</Text>
                    </Pressable>
                )}
                {onSendToAI && (
                    <Pressable
                        style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
                        onPress={() => onSendToAI(comment)}
                        accessibilityLabel="Send comment to AI chat"
                    >
                        <FontAwesomeIcon icon={faRobot} size={11} color={colors.primary} />
                        <Text style={[styles.actionText, styles.actionTextActive]}>Send to AI</Text>
                    </Pressable>
                )}
                {onResolve && (
                    <Pressable
                        style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
                        onPress={() => onResolve(comment.id, !comment.resolved)}
                    >
                        <FontAwesomeIcon
                            icon={faCheck}
                            size={11}
                            color={comment.resolved ? colors.primary : colors.textSecondary}
                        />
                        <Text style={[styles.actionText, comment.resolved && styles.actionTextActive]}>
                            {comment.resolved ? "Unresolve" : "Resolve"}
                        </Text>
                    </Pressable>
                )}
                {isOwn && (
                    <Pressable
                        style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
                        onPress={() => onDelete(comment.id)}
                    >
                        <FontAwesomeIcon icon={faTrash} size={11} color="#DC2626" />
                    </Pressable>
                )}
            </View>

            {/* Threaded replies — accent stripe via sibling View, not borderLeftWidth */}
            {replies.length > 0 && (
                <View style={styles.repliesContainer}>
                    <View style={styles.repliesAccent} />
                    <View style={styles.repliesContent}>
                        {replies.map((reply) => (
                            <View key={reply.id} style={styles.replyBubble}>
                                <View style={styles.metaRow}>
                                    <View style={[styles.avatar, styles.avatarSmall]}>
                                        <Text style={[styles.avatarText, styles.avatarTextSmall]}>
                                            {reply.authorName.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={styles.authorName}>{reply.authorName}</Text>
                                </View>
                                <Text style={styles.commentText}>{reply.text}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

const SharedCommentsPanel: React.FC<SharedCommentsPanelProps> = ({
    comments,
    loading,
    onAddComment,
    onDeleteComment,
    onAddReply,
    onResolveComment,
    onSendToAI,
    title,
    titleIcon,
    onCollapse,
    onBack,
    backLabel,
    currentUserId,
    placeholder = "Add a comment...",
    maxLength = 1000,
    emptyText = "No comments yet.",
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const insets = useSafeAreaInsets();
    // On mobile (!xl) the panel mounts edge-to-edge inside the floating sheet,
    // so it insets for the notch/home-indicator. Desktop relies on AppLayout.
    const safeTop = xl ? 0 : insets.top;
    const rawSafeBottom = xl ? 0 : insets.bottom;

    // KeyboardAvoidingView's `padding` math is `frame.y + frame.height - keyboardY`,
    // where `frame.y` is parent-relative but `keyboardY` is screen-space. When a
    // parent pushes this panel down (e.g. a host AppLayout's top safe-area inset),
    // the avoided height comes up short and the keyboard overlaps the composer.
    // We measure our own on-screen Y and feed it back as keyboardVerticalOffset so
    // it self-corrects in every mount context. iOS-only — Android/web use `height`
    // behaviour + system resize and don't need it.
    const rootRef = useRef<View>(null);
    const [kbVerticalOffset, setKbVerticalOffset] = useState(0);
    const measureKbOffset = useCallback(() => {
        if (Platform.OS !== "ios") return;
        rootRef.current?.measureInWindow((_x, y) => {
            if (typeof y === "number" && Number.isFinite(y)) {
                setKbVerticalOffset((prev) => (Math.abs(prev - y) > 1 ? y : prev));
            }
        });
    }, []);

    // While the keyboard is open it already covers the home-indicator area, so the
    // composer's own bottom safe-area inset would just float the input above the
    // keyboard — a visible double-padded gap. Collapse it whenever the keyboard is
    // up; restore it when hidden so the composer still clears the home indicator.
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    useEffect(() => {
        if (Platform.OS === "web") return;
        const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const showSub = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);
    const safeBottom = keyboardVisible ? 0 : rawSafeBottom;
    const panelSty = useMemo(
        () => panelStyles(colors, safeTop, safeBottom),
        [colors, safeTop, safeBottom]
    );
    const bubbleSty = useMemo(() => bubbleStyles(colors), [colors]);

    const [draft, setDraft] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const mentionMembers = useBrandMembers();

    const threaded = !!onAddReply;

    // Group into top-level + replies map (only in threaded mode)
    const topLevel = useMemo(
        () => threaded ? comments.filter((c) => !c.parentId) : comments,
        [comments, threaded]
    );
    const repliesMap = useMemo<Record<string, PanelComment[]>>(() => {
        if (!threaded) return {};
        const map: Record<string, PanelComment[]> = {};
        comments.filter((c) => !!c.parentId).forEach((c) => {
            if (!map[c.parentId!]) map[c.parentId!] = [];
            map[c.parentId!].push(c);
        });
        return map;
    }, [comments, threaded]);

    const handleSend = useCallback(async () => {
        if (!draft.trim() || isSending) return;
        setIsSending(true);
        if (replyingTo && onAddReply) {
            await onAddReply(replyingTo, draft.trim());
        } else {
            await onAddComment(draft.trim());
        }
        setDraft("");
        setReplyingTo(null);
        setIsSending(false);
    }, [draft, isSending, replyingTo, onAddReply, onAddComment]);

    return (
        <View ref={rootRef} style={panelSty.container} onLayout={measureKbOffset}>
        <KeyboardAvoidingView
            style={panelSty.fill}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={kbVerticalOffset}
        >
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <View style={panelSty.header}>
                {onCollapse && (
                    <Pressable
                        onPress={onCollapse}
                        style={({ pressed }) => [
                            panelSty.collapseBtn,
                            pressed && panelSty.collapseBtnPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Collapse panel"
                    >
                        <FontAwesomeIcon icon={faChevronRight} size={11} color={colors.textSecondary} />
                    </Pressable>
                )}
                {onBack && (
                    <Pressable
                        style={({ pressed }) => [panelSty.backBtn, pressed && { opacity: 0.6 }]}
                        onPress={onBack}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} size={12} color={colors.primary} />
                        {backLabel && <Text style={panelSty.backBtnText}>{backLabel}</Text>}
                    </Pressable>
                )}
                <FontAwesomeIcon icon={titleIcon} size={14} color={colors.primary} />
                <Text style={panelSty.title} numberOfLines={1}>{title}</Text>
                {comments.length > 0 && (
                    <View style={panelSty.badge}>
                        <Text style={panelSty.badgeText}>{comments.length}</Text>
                    </View>
                )}
            </View>

            {/* ── Comment list ────────────────────────────────────────────────── */}
            {loading ? (
                <ActivityIndicator style={panelSty.loader} color={colors.primary} />
            ) : (
                <ScrollView
                    style={panelSty.scroll}
                    contentContainerStyle={panelSty.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {topLevel.length === 0 ? (
                        <Text style={panelSty.emptyText}>{emptyText}</Text>
                    ) : (
                        topLevel.map((c) => (
                            <CommentBubble
                                key={c.id}
                                comment={c}
                                replies={repliesMap[c.id] ?? []}
                                currentUserId={currentUserId}
                                threaded={threaded}
                                onReply={threaded ? setReplyingTo : undefined}
                                onResolve={onResolveComment}
                                onDelete={onDeleteComment}
                                onSendToAI={onSendToAI}
                                colors={colors}
                                styles={bubbleSty}
                            />
                        ))
                    )}
                </ScrollView>
            )}

            {/* ── Compose ─────────────────────────────────────────────────────── */}
            {replyingTo && (
                    <View style={panelSty.replyBanner}>
                        <Text style={panelSty.replyBannerText}>Replying to thread</Text>
                        <Pressable onPress={() => setReplyingTo(null)}>
                            <FontAwesomeIcon icon={faXmark} size={12} color={colors.textSecondary} />
                        </Pressable>
                    </View>
                )}
                <View style={panelSty.compose}>
                    <MentionInput
                        containerStyle={panelSty.inputWrap}
                        inputStyle={panelSty.input}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textSecondary}
                        value={draft}
                        onChangeText={setDraft}
                        members={mentionMembers}
                        maxLength={maxLength}
                        dropdownPlacement="top"
                    />
                    <Pressable
                        style={({ pressed }) => [
                            panelSty.sendBtn,
                            !draft.trim() && panelSty.sendBtnDisabled,
                            pressed && panelSty.btnPressed,
                        ]}
                        onPress={handleSend}
                        disabled={!draft.trim() || isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color={colors.onPrimary} />
                        ) : (
                            <Text style={panelSty.sendBtnText}>Post</Text>
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

function panelStyles(
    colors: ReturnType<typeof Colors>,
    safeTop: number,
    safeBottom: number
) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.card,
        },
        fill: { flex: 1 },
        header: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingLeft: 8,
            paddingRight: 14,
            paddingTop: 12 + safeTop,
            paddingBottom: 12,
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
        loader: { marginTop: 32 },
        scroll: { flex: 1 },
        scrollContent: {
            padding: 12,
            gap: 10,
        },
        emptyText: {
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: "center",
            paddingVertical: 24,
            lineHeight: 20,
        },
        replyBanner: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: colors.aliceBlue,
        },
        replyBannerText: {
            fontSize: 12,
            color: colors.primary,
            fontWeight: "600",
        },
        compose: {
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            padding: 10,
            paddingBottom: 10 + safeBottom,
            backgroundColor: colors.card,
            // Upward shadow floats compose area above scroll content
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowRadius: 8,
            shadowOpacity: 0.05,
            elevation: 4,
        },
        inputWrap: {
            flex: 1,
        },
        input: {
            width: "100%",
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

function bubbleStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        bubble: {
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 12,
            gap: 6,
            // Shadow lifts card off surface — no border needed
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        bubbleResolved: { opacity: 0.55 },
        // Snippet accent: <View width={3}> child, not borderLeftWidth
        snippetQuote: {
            flexDirection: "row",
            borderRadius: 6,
            overflow: "hidden",
            marginBottom: 2,
            backgroundColor: colors.aliceBlue,
        },
        snippetAccent: {
            width: 3,
            backgroundColor: colors.primary,
        },
        snippetText: {
            flex: 1,
            fontSize: 11,
            color: colors.textSecondary,
            fontStyle: "italic",
            lineHeight: 16,
            paddingLeft: 8,
            paddingVertical: 6,
        },
        metaRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        avatar: {
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: colors.aliceBlue,
            alignItems: "center",
            justifyContent: "center",
        },
        avatarSmall: { width: 18, height: 18, borderRadius: 9 },
        avatarText: {
            fontSize: 10,
            fontWeight: "700",
            color: colors.primary,
        },
        avatarTextSmall: { fontSize: 9 },
        authorName: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.text,
        },
        timestamp: {
            fontSize: 11,
            color: colors.textSecondary,
            marginLeft: "auto",
        },
        resolvedBadge: {
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: colors.aliceBlue,
        },
        resolvedText: {
            fontSize: 10,
            fontWeight: "600",
            color: colors.primary,
        },
        commentText: {
            fontSize: 13,
            color: colors.text,
            lineHeight: 18,
        },
        actionsRow: {
            flexDirection: "row",
            gap: 12,
            marginTop: 2,
        },
        actionBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
        },
        actionText: {
            fontSize: 11,
            color: colors.textSecondary,
        },
        actionTextActive: { color: colors.primary },
        // Reply thread: accent stripe via sibling View, not borderLeftWidth
        repliesContainer: {
            marginTop: 4,
            flexDirection: "row",
        },
        repliesAccent: {
            width: 2,
            borderRadius: 1,
            backgroundColor: colors.border,
            marginRight: 10,
        },
        repliesContent: {
            flex: 1,
            gap: 8,
        },
        replyBubble: { gap: 4 },
        btnPressed: { opacity: 0.72 },
    });
}

export default SharedCommentsPanel;
