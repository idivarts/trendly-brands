/**
 * CommentsSection
 *
 * A self-contained comment thread component that subscribes to
 * `brands/{brandId}/contents/{contentId}/comments` via `use-content-comments`.
 *
 * Because this hook uses the exact same Firestore subcollection that
 * QuickCommentModal in the Calendar writes to, comments posted from
 * the Calendar appear here automatically — no separate sync needed.
 *
 * Usage:
 *   <CommentsSection contentId={contentId} />
 */
import { useAuthContext } from "@/contexts/auth-context.provider";
import { ContentComment, useContentComments } from "@/hooks/use-content-comments";
import Colors from "@/shared-uis/constants/Colors";
import { faCheck, faCommentDots, faReply, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

interface CommentRowProps {
    comment: ContentComment;
    replies: ContentComment[];
    currentManagerId: string;
    onReply: (parentId: string) => void;
    onResolve: (id: string, resolved: boolean) => void;
    onDelete: (id: string) => void;
    colors: ReturnType<typeof Colors>;
}

const CommentRow: React.FC<CommentRowProps> = ({
    comment,
    replies,
    currentManagerId,
    onReply,
    onResolve,
    onDelete,
    colors,
}) => {
    const styles = useMemo(() => rowStyles(colors), [colors]);
    const isOwn = comment.authorId === currentManagerId;
    const ts = new Date(comment.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <View style={[styles.row, comment.resolved && styles.rowResolved]}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {comment.authorName.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.body}>
                <View style={styles.meta}>
                    <Text style={styles.author}>{comment.authorName}</Text>
                    <Text style={styles.ts}>{ts}</Text>
                    {comment.resolved && (
                        <View style={styles.resolvedTag}>
                            <Text style={styles.resolvedTagText}>Resolved</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.text}>{comment.text}</Text>
                <View style={styles.actions}>
                    <Pressable
                        style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
                        onPress={() => onReply(comment.id)}
                    >
                        <FontAwesomeIcon icon={faReply} size={10} color={colors.textSecondary} />
                        <Text style={styles.actionText}>Reply</Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
                        onPress={() => onResolve(comment.id, !comment.resolved)}
                    >
                        <FontAwesomeIcon icon={faCheck} size={10} color={comment.resolved ? colors.primary : colors.textSecondary} />
                        <Text style={[styles.actionText, comment.resolved && styles.actionTextActive]}>
                            {comment.resolved ? "Unresolve" : "Resolve"}
                        </Text>
                    </Pressable>
                    {isOwn && (
                        <Pressable
                            style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
                            onPress={() => onDelete(comment.id)}
                        >
                            <FontAwesomeIcon icon={faTrash} size={10} color="#DC2626" />
                        </Pressable>
                    )}
                </View>
                {replies.length > 0 && (
                    <View style={styles.replies}>
                        {replies.map((r) => (
                            <View key={r.id} style={styles.replyRow}>
                                <View style={[styles.avatar, styles.avatarSm]}>
                                    <Text style={[styles.avatarText, styles.avatarTextSm]}>
                                        {r.authorName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.body}>
                                    <Text style={styles.author}>{r.authorName}</Text>
                                    <Text style={styles.text}>{r.text}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface CommentsSectionProps {
    contentId: string | null;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ contentId }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => sectionStyles(colors), [colors]);
    const { manager } = useAuthContext();

    const { comments, loading, addComment, addReply, resolveComment, deleteComment } =
        useContentComments(contentId);

    const [draft, setDraft] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    const topLevel = comments.filter((c) => !c.parentId);
    const repliesMap: Record<string, ContentComment[]> = {};
    comments
        .filter((c) => !!c.parentId)
        .forEach((c) => {
            if (!repliesMap[c.parentId!]) repliesMap[c.parentId!] = [];
            repliesMap[c.parentId!].push(c);
        });

    const handleSend = async () => {
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
    };

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <FontAwesomeIcon icon={faCommentDots} size={13} color={colors.primary} />
                <Text style={styles.sectionLabel}>COMMENTS</Text>
                {comments.length > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{comments.length}</Text>
                    </View>
                )}
            </View>

            {loading ? (
                <ActivityIndicator style={styles.loader} color={colors.primary} />
            ) : topLevel.length === 0 ? (
                <Text style={styles.emptyText}>
                    No comments yet. Notes added from the calendar also appear here.
                </Text>
            ) : (
                <View style={styles.list}>
                    {topLevel.map((c) => (
                        <CommentRow
                            key={c.id}
                            comment={c}
                            replies={repliesMap[c.id] ?? []}
                            currentManagerId={manager?.id ?? ""}
                            onReply={(id) => setReplyingTo(id)}
                            onResolve={resolveComment}
                            onDelete={deleteComment}
                            colors={colors}
                        />
                    ))}
                </View>
            )}

            {/* Compose */}
            {replyingTo && (
                <View style={styles.replyBanner}>
                    <Text style={styles.replyBannerText}>Replying to thread</Text>
                    <Pressable onPress={() => setReplyingTo(null)}>
                        <Text style={styles.replyBannerCancel}>Cancel</Text>
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
        </View>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

function rowStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        row: {
            flexDirection: "row",
            gap: 10,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        rowResolved: { opacity: 0.5 },
        avatar: {
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: colors.aliceBlue,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
        },
        avatarSm: { width: 22, height: 22, borderRadius: 11 },
        avatarText: { fontSize: 12, fontWeight: "700", color: colors.primary },
        avatarTextSm: { fontSize: 9 },
        body: { flex: 1, gap: 3 },
        meta: { flexDirection: "row", alignItems: "center", gap: 8 },
        author: { fontSize: 13, fontWeight: "600", color: colors.text },
        ts: { fontSize: 11, color: colors.textSecondary },
        resolvedTag: {
            paddingHorizontal: 5,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: colors.aliceBlue,
        },
        resolvedTagText: { fontSize: 10, fontWeight: "600", color: colors.primary },
        text: { fontSize: 13, color: colors.text, lineHeight: 18 },
        actions: { flexDirection: "row", gap: 14, marginTop: 2 },
        actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
        actionText: { fontSize: 11, color: colors.textSecondary },
        actionTextActive: { color: colors.primary },
        replies: { marginTop: 8, gap: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: colors.border },
        replyRow: { flexDirection: "row", gap: 8 },
        btnPressed: { opacity: 0.72 },
    });
}

function sectionStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        container: {
            marginBottom: 20,
        },
        sectionHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
        },
        sectionLabel: {
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.1,
            color: colors.textSecondary,
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
        loader: { marginVertical: 16 },
        emptyText: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 18,
            paddingVertical: 8,
        },
        list: { gap: 0 },
        replyBanner: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 7,
            backgroundColor: colors.aliceBlue,
            borderRadius: 8,
            marginBottom: 8,
        },
        replyBannerText: { fontSize: 12, color: colors.primary, fontWeight: "600" },
        replyBannerCancel: { fontSize: 12, color: colors.textSecondary },
        compose: {
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            marginTop: 10,
        },
        input: {
            flex: 1,
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
            color: colors.text,
            maxHeight: 100,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        sendBtn: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        sendBtnDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
        sendBtnText: { fontSize: 13, fontWeight: "700", color: colors.onPrimary },
        btnPressed: { opacity: 0.72 },
    });
}

export default CommentsSection;
