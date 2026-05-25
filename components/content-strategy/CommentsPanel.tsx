/**
 * CommentsPanel
 *
 * Strategy document comment threads rendered as a flex content component.
 * Lives inside RightSidePanel's commentsSlot — parent manages visibility.
 *
 * UI rules applied:
 *  - Zero structural borders (no borderWidth/Top/Bottom/Left for separation)
 *  - Shadows for depth: header casts downward, compose casts upward, bubbles lift
 *  - Accent stripes use a <View width={3}> child, not borderLeftWidth
 */
import { useAuthContext } from "@/contexts/auth-context.provider";
import { StrategyComment, useStrategyComments } from "@/hooks/use-strategy-comments";
import Colors from "@/shared-uis/constants/Colors";
import { faCheck, faChevronRight, faCommentDots, faReply, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
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

// ─── Comment Bubble ───────────────────────────────────────────────────────────

interface CommentBubbleProps {
    comment: StrategyComment;
    replies: StrategyComment[];
    onReply: (parentId: string) => void;
    onResolve: (id: string, resolved: boolean) => void;
    onDelete: (id: string) => void;
    currentManagerId: string;
    colors: ReturnType<typeof Colors>;
}

const CommentBubble: React.FC<CommentBubbleProps> = ({
    comment,
    replies,
    onReply,
    onResolve,
    onDelete,
    currentManagerId,
    colors,
}) => {
    const styles = useMemo(() => bubbleStyles(colors), [colors]);
    const isOwn = comment.authorId === currentManagerId;
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
                <Pressable
                    style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
                    onPress={() => onReply(comment.id)}
                >
                    <FontAwesomeIcon icon={faReply} size={11} color={colors.textSecondary} />
                    <Text style={styles.actionText}>Reply</Text>
                </Pressable>
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
                {isOwn && (
                    <Pressable
                        style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
                        onPress={() => onDelete(comment.id)}
                    >
                        <FontAwesomeIcon icon={faTrash} size={11} color="#DC2626" />
                    </Pressable>
                )}
            </View>

            {/* Replies — accent stripe via sibling View, not borderLeftWidth */}
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

interface CommentsPanelProps {
    strategyId: string | null;
    /** Called when the user taps the collapse chevron in the panel header. */
    onCollapse?: () => void;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ strategyId, onCollapse }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => panelStyles(colors), [colors]);
    const { manager } = useAuthContext();

    const { comments, loading, addComment, addReply, resolveComment, deleteComment } =
        useStrategyComments(strategyId);

    const [draft, setDraft] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    const handleSend = useCallback(async () => {
        if (!draft.trim() || isSending) return;
        setIsSending(true);
        if (replyingTo) {
            await addReply(replyingTo, draft.trim());
        } else {
            await addComment(draft.trim());
        }
        setDraft("");
        setReplyingTo(null);
        setIsSending(false);
    }, [draft, replyingTo, isSending, addComment, addReply]);

    const topLevel = comments.filter((c) => !c.parentId);
    const repliesMap: Record<string, StrategyComment[]> = {};
    comments.filter((c) => !!c.parentId).forEach((c) => {
        if (!repliesMap[c.parentId!]) repliesMap[c.parentId!] = [];
        repliesMap[c.parentId!].push(c);
    });

    return (
        <View style={styles.container}>
            {/* Header — collapse chevron + title, downward shadow */}
            <View style={styles.header}>
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
                <FontAwesomeIcon icon={faCommentDots} size={14} color={colors.primary} />
                <Text style={styles.title}>Comments</Text>
                {comments.length > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{comments.length}</Text>
                    </View>
                )}
            </View>

            {loading ? (
                <ActivityIndicator style={styles.loader} color={colors.primary} />
            ) : (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {topLevel.length === 0 ? (
                        <Text style={styles.emptyText}>
                            No comments yet. Select text in the editor to leave an inline note, or add one below.
                        </Text>
                    ) : (
                        topLevel.map((c) => (
                            <CommentBubble
                                key={c.id}
                                comment={c}
                                replies={repliesMap[c.id] ?? []}
                                onReply={(id) => setReplyingTo(id)}
                                onResolve={resolveComment}
                                onDelete={deleteComment}
                                currentManagerId={manager?.id ?? ""}
                                colors={colors}
                            />
                        ))
                    )}
                </ScrollView>
            )}

            {/* Compose — upward shadow over scroll content */}
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                {replyingTo && (
                    <View style={styles.replyBanner}>
                        <Text style={styles.replyBannerText}>Replying to thread</Text>
                        <Pressable onPress={() => setReplyingTo(null)}>
                            <FontAwesomeIcon icon={faXmark} size={12} color={colors.textSecondary} />
                        </Pressable>
                    </View>
                )}
                <View style={styles.compose}>
                    <TextInput
                        style={styles.input}
                        placeholder="Add a comment..."
                        placeholderTextColor={colors.textSecondary}
                        value={draft}
                        onChangeText={setDraft}
                        multiline
                        maxLength={1000}
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

// ─── Styles ──────────────────────────────────────────────────────────────────

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
            paddingRight: 14,
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

export default CommentsPanel;
