import {
    faChevronLeft,
    faComment,
    faEye,
    faEyeSlash,
    faImages,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import { Text } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";

import MessageComposer from "./MessageComposer";
import { useInboxMedia } from "./data/use-inbox-media";
import { InboxMedia, InboxMediaComment } from "./types";
import { channelColor, channelIcon, channelLabel, relativeTime } from "./utils";

const COMMENTS_WIDTH = 420;

const MediaView: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);

    const {
        loading,
        media,
        loadComments,
        replyToComment,
        setCommentHidden,
        deleteComment,
    } = useInboxMedia();

    const [selected, setSelected] = useState<InboxMedia | undefined>(undefined);
    const [comments, setComments] = useState<InboxMediaComment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<InboxMediaComment | undefined>(undefined);
    const [busyId, setBusyId] = useState<string | undefined>(undefined);

    // Keep a post selected by default on desktop.
    useEffect(() => {
        if (xl && !selected && media.length > 0) setSelected(media[0]);
    }, [xl, selected, media]);

    const openMedia = useCallback(
        async (m: InboxMedia) => {
            setSelected(m);
            setReplyingTo(undefined);
            setComments([]);
            setCommentsLoading(true);
            const list = await loadComments(m);
            setComments(list);
            setCommentsLoading(false);
        },
        [loadComments]
    );

    const handleReply = useCallback(
        async (text: string) => {
            if (!selected || !replyingTo) return;
            await replyToComment(selected, replyingTo.id, text);
            setReplyingTo(undefined);
        },
        [selected, replyingTo, replyToComment]
    );

    const handleHide = useCallback(
        async (c: InboxMediaComment) => {
            if (!selected) return;
            const next = !c.hidden;
            setBusyId(c.id);
            setComments((prev) =>
                prev.map((x) => (x.id === c.id ? { ...x, hidden: next } : x))
            );
            try {
                await setCommentHidden(selected, c.id, next);
            } catch {
                setComments((prev) =>
                    prev.map((x) => (x.id === c.id ? { ...x, hidden: c.hidden } : x))
                );
            } finally {
                setBusyId(undefined);
            }
        },
        [selected, setCommentHidden]
    );

    const handleDelete = useCallback(
        async (c: InboxMediaComment) => {
            if (!selected) return;
            setBusyId(c.id);
            const prevList = comments;
            setComments((prev) => prev.filter((x) => x.id !== c.id));
            if (replyingTo?.id === c.id) setReplyingTo(undefined);
            try {
                await deleteComment(selected, c.id);
            } catch {
                setComments(prevList);
            } finally {
                setBusyId(undefined);
            }
        },
        [selected, comments, replyingTo, deleteComment]
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (media.length === 0) {
        return (
            <View style={styles.center}>
                <FontAwesomeIcon icon={faImages} size={40} color={colors.tag} />
                <Text style={styles.emptyText}>No published posts yet</Text>
                <Text style={styles.emptySub}>
                    Posts and reels from your connected accounts will appear here.
                </Text>
            </View>
        );
    }

    const grid = (
        <ScrollView contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
                {media.map((m) => {
                    const active = selected?.id === m.id;
                    return (
                        <Pressable
                            key={`${m.channel}_${m.id}`}
                            style={styles.tile}
                            onPress={() => openMedia(m)}
                        >
                            <Image
                                source={{ uri: m.thumbnailUrl }}
                                style={styles.tileImage}
                                contentFit="cover"
                                transition={150}
                            />
                            <View
                                style={[
                                    styles.tileBadge,
                                    { backgroundColor: channelColor(m.channel, colors) },
                                ]}
                            >
                                <FontAwesomeIcon
                                    icon={channelIcon(m.channel)}
                                    size={11}
                                    color={colors.white}
                                />
                            </View>
                            <View style={styles.tileCount}>
                                <FontAwesomeIcon icon={faComment} size={11} color={colors.white} />
                                <Text style={styles.tileCountText}>{m.commentsCount}</Text>
                            </View>
                            {active && xl ? <View style={styles.tileActive} /> : null}
                        </Pressable>
                    );
                })}
            </View>
        </ScrollView>
    );

    const commentsPanel = selected ? (
        <View style={styles.commentsPane}>
            <View style={styles.postHeader}>
                {!xl ? (
                    <Pressable onPress={() => setSelected(undefined)} style={styles.backBtn} hitSlop={8}>
                        <FontAwesomeIcon icon={faChevronLeft} size={18} color={colors.text} />
                    </Pressable>
                ) : null}
                <Image
                    source={{ uri: selected.thumbnailUrl }}
                    style={styles.postThumb}
                    contentFit="cover"
                />
                <View style={styles.postMeta}>
                    <Text style={styles.postCaption} numberOfLines={2}>
                        {selected.caption || "(no caption)"}
                    </Text>
                    <Text style={styles.postSub}>
                        {channelLabel(selected.channel)} · {selected.commentsCount} comments
                    </Text>
                </View>
            </View>

            {commentsLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : comments.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptySub}>No comments on this post yet.</Text>
                </View>
            ) : (
                <ScrollView style={styles.commentsList} contentContainerStyle={styles.commentsListContent}>
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
                                <Pressable
                                    onPress={() => setReplyingTo(c)}
                                    style={styles.actionBtn}
                                    hitSlop={6}
                                >
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
                placeholder={replyingTo ? `Reply to @${replyingTo.author.handle || replyingTo.author.name}` : "Reply"}
                hint="Replies are public and posted from your connected account."
                onSend={handleReply}
            />
        </View>
    ) : null;

    // ---- Mobile (drill-down) ----
    if (!xl) {
        return <View style={styles.container}>{selected ? commentsPanel : grid}</View>;
    }

    // ---- Desktop (grid + comments) ----
    return (
        <View style={styles.row}>
            <View style={styles.gridPane}>{grid}</View>
            <View style={[styles.commentsPaneWrap, { width: COMMENTS_WIDTH }]}>
                {commentsPanel ?? (
                    <View style={styles.center}>
                        <Text style={styles.emptySub}>Select a post to see its comments.</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: { flex: 1, backgroundColor: colors.background },
                row: { flex: 1, flexDirection: "row", backgroundColor: colors.background },
                gridPane: { flex: 1, backgroundColor: colors.background },
                commentsPaneWrap: {
                    backgroundColor: colors.background,
                    // Shadow leftward to separate from the grid (no border).
                    shadowColor: "#000",
                    shadowOffset: { width: -6, height: 0 },
                    shadowRadius: 16,
                    shadowOpacity: 0.06,
                    elevation: 8,
                    zIndex: 2,
                },
                center: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: 24,
                },
                emptyText: { fontSize: 16, fontWeight: "600", color: colors.text },
                emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },

                // Grid
                gridContent: { padding: 12 },
                grid: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    rowGap: 10,
                },
                tile: {
                    width: "32%",
                    aspectRatio: 1,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: colors.tag,
                },
                tileImage: { width: "100%", height: "100%" },
                tileBadge: {
                    position: "absolute",
                    top: 6,
                    left: 6,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                },
                tileCount: {
                    position: "absolute",
                    bottom: 6,
                    right: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 11,
                    backgroundColor: "rgba(0,0,0,0.55)",
                },
                tileCountText: { color: colors.white, fontSize: 11, fontWeight: "600" },
                tileActive: {
                    ...StyleSheet.absoluteFillObject,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    opacity: 0.18,
                },

                // Comments panel
                commentsPane: { flex: 1, backgroundColor: colors.background },
                postHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    backgroundColor: colors.background,
                    // Downward shadow over the comment list (sticky-header feel).
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                    zIndex: 2,
                },
                backBtn: { padding: 4 },
                postThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.tag },
                postMeta: { flex: 1, gap: 2 },
                postCaption: { fontSize: 14, fontWeight: "600", color: colors.text },
                postSub: { fontSize: 12, color: colors.textSecondary },

                commentsList: { flex: 1 },
                commentsListContent: { padding: 14, gap: 14 },
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

export default MediaView;
