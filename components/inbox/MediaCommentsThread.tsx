/**
 * Self-contained comment thread for a single piece of media.
 *
 * Loads the post's top-level comments on demand and supports public reply,
 * hide/unhide, and delete — all via the shared `media-comments-api` layer, so
 * this is the one comment-thread implementation reused by both the Inbox Media
 * tab and the Content details page's post-performance section.
 */
import { faEye, faEyeSlash, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/theme/Themed";
import { useBrandContext } from "@/contexts/brand-context.provider";
import Colors from "@/shared-uis/constants/Colors";

import MessageComposer from "./MessageComposer";
import {
    deleteMediaComment,
    fetchMediaComments,
    replyToMediaComment,
    setMediaCommentHidden,
} from "./data/media-comments-api";
import { InboxMedia, InboxMediaComment } from "./types";
import { relativeTime } from "./utils";

interface Props {
    media: InboxMedia;
    /** Optional fixed height for the scrollable list (e.g. when embedded). */
    listMaxHeight?: number;
}

const MediaCommentsThread: React.FC<Props> = ({ media, listMaxHeight }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    const [comments, setComments] = useState<InboxMediaComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<InboxMediaComment | undefined>(undefined);
    const [busyId, setBusyId] = useState<string | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setReplyingTo(undefined);
        setComments([]);
        if (!brandId) {
            setLoading(false);
            return;
        }
        fetchMediaComments(brandId, media).then((list) => {
            if (!cancelled) {
                setComments(list);
                setLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [brandId, media]);

    const handleReply = useCallback(
        async (text: string) => {
            if (!brandId || !replyingTo) return;
            await replyToMediaComment(brandId, media, replyingTo.id, text);
            setReplyingTo(undefined);
        },
        [brandId, media, replyingTo]
    );

    const handleHide = useCallback(
        async (c: InboxMediaComment) => {
            if (!brandId) return;
            const next = !c.hidden;
            setBusyId(c.id);
            setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, hidden: next } : x)));
            try {
                await setMediaCommentHidden(brandId, media, c.id, next);
            } catch {
                setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, hidden: c.hidden } : x)));
            } finally {
                setBusyId(undefined);
            }
        },
        [brandId, media]
    );

    const handleDelete = useCallback(
        async (c: InboxMediaComment) => {
            if (!brandId) return;
            setBusyId(c.id);
            const prevList = comments;
            setComments((prev) => prev.filter((x) => x.id !== c.id));
            if (replyingTo?.id === c.id) setReplyingTo(undefined);
            try {
                await deleteMediaComment(brandId, media, c.id);
            } catch {
                setComments(prevList);
            } finally {
                setBusyId(undefined);
            }
        },
        [brandId, media, comments, replyingTo]
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : comments.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptySub}>No comments on this post yet.</Text>
                </View>
            ) : (
                <ScrollView
                    style={[styles.list, listMaxHeight ? { maxHeight: listMaxHeight } : null]}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {comments.map((c) => (
                        <View key={c.id} style={styles.comment}>
                            <View style={styles.commentBody}>
                                <Text style={styles.commentAuthor}>
                                    {c.author.handle ? `@${c.author.handle}` : c.author.name}
                                    {c.timestamp ? (
                                        <Text style={styles.commentTime}>  {relativeTime(c.timestamp)}</Text>
                                    ) : null}
                                </Text>
                                <Text style={[styles.commentText, c.hidden && styles.commentHidden]}>
                                    {c.text}
                                </Text>
                            </View>
                            <View style={styles.commentActions}>
                                <Pressable onPress={() => setReplyingTo(c)} style={styles.actionBtn} hitSlop={6}>
                                    <Text style={styles.actionText}>Reply</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => handleHide(c)}
                                    style={styles.actionIconBtn}
                                    hitSlop={6}
                                    disabled={busyId === c.id}
                                >
                                    <FontAwesomeIcon
                                        icon={c.hidden ? faEye : faEyeSlash}
                                        size={14}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>
                                <Pressable
                                    onPress={() => handleDelete(c)}
                                    style={styles.actionIconBtn}
                                    hitSlop={6}
                                    disabled={busyId === c.id}
                                >
                                    <FontAwesomeIcon icon={faTrash} size={14} color={colors.red} />
                                </Pressable>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            <MessageComposer
                enabled={!!replyingTo}
                disabledReason="Tap Reply on a comment to respond."
                placeholder={
                    replyingTo ? `Reply to @${replyingTo.author.handle || replyingTo.author.name}` : "Reply"
                }
                hint="Replies are public and posted from your connected account."
                onSend={handleReply}
            />
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: { flex: 1, backgroundColor: colors.background },
                center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
                emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },

                list: { flex: 1 },
                listContent: { padding: 14, gap: 14 },
                comment: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: colors.tag,
                },
                commentBody: { flex: 1, gap: 3 },
                commentAuthor: { fontSize: 13, fontWeight: "600", color: colors.text },
                commentTime: { fontSize: 11, fontWeight: "400", color: colors.textSecondary },
                commentText: { fontSize: 14, color: colors.text },
                commentHidden: { color: colors.textSecondary, fontStyle: "italic", opacity: 0.6 },
                commentActions: { flexDirection: "row", alignItems: "center", gap: 12 },
                actionBtn: { paddingVertical: 2 },
                actionText: { fontSize: 13, fontWeight: "600", color: colors.primary },
                actionIconBtn: { padding: 2 },
            }),
        [colors]
    );
}

export default MediaCommentsThread;
