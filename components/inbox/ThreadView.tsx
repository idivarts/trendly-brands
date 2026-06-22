import {
    faArrowLeft,
    faBookOpen,
    faCircleInfo,
    faEye,
    faEyeSlash,
    faFile,
    faImage,
    faLink,
    faMicrophone,
    faPlay,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { UpgradeInline } from "@/components/billing/EntitlementGate";
import { Text } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import { useEntitlements } from "@/hooks/use-entitlements";
import Colors from "@/shared-uis/constants/Colors";
import ChannelAvatar from "./ChannelAvatar";
import MessageComposer from "./MessageComposer";
import { AttachmentType, InboxConversation, InboxMessage } from "./types";
import {
    canReply,
    channelColor,
    channelLabel,
    relativeTime,
    replyWindowLeft,
} from "./utils";

interface Props {
    conversation: InboxConversation;
    showBack: boolean;
    onBack: () => void;
    showDetailsToggle: boolean;
    onToggleDetails: () => void;
    onSendReply: (text: string) => Promise<void>;
    onSetHidden: (hidden: boolean) => Promise<void>;
    onDelete: () => Promise<void>;
}

const ThreadView: React.FC<Props> = ({
    conversation,
    showBack,
    onBack,
    showDetailsToggle,
    onToggleDetails,
    onSendReply,
    onSetHidden,
    onDelete,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    // Track media that failed to load (e.g. expired Meta CDN links) so we can
    // swap in a graceful placeholder instead of a blank/broken tile.
    const [failedMedia, setFailedMedia] = useState<Record<string, boolean>>({});
    const markFailed = (id: string) =>
        setFailedMedia((prev) => (prev[id] ? prev : { ...prev, [id]: true }));

    const { inboxReadOnly } = useEntitlements();
    const isComment = conversation.kind === "comment";
    const replyable = canReply(conversation);
    const windowLeft = replyWindowLeft(conversation);

    const openAttachment = (url?: string) => {
        if (url) Linking.openURL(url).catch(() => {});
    };

    const renderUnavailableMedia = (label: string) => (
        <View style={styles.attachmentFallback}>
            <FontAwesomeIcon icon={faImage} size={26} color={colors.textSecondary} />
            <Text style={styles.attachmentFallbackText}>{label} unavailable</Text>
        </View>
    );

    const renderAttachment = (m: InboxMessage) => {
        if (!m.attachmentUrl && !m.attachmentType) return null;
        const url = m.attachmentUrl;
        const failed = !!failedMedia[m.id];

        // Photo — render inline; fall back to a placeholder if the URL is gone or
        // expired (Meta CDN links are time-limited).
        if (m.attachmentType === "image") {
            if (!url || failed) return renderUnavailableMedia("Photo");
            return (
                <Pressable onPress={() => openAttachment(url)}>
                    <Image
                        source={{ uri: url }}
                        style={styles.attachmentMedia}
                        contentFit="cover"
                        onError={() => markFailed(m.id)}
                    />
                </Pressable>
            );
        }

        // Video / reel — thumbnail (when available) with a play badge, else a card.
        if (m.attachmentType === "video") {
            const thumb = m.attachmentThumbUrl || url;
            if (thumb && !failed) {
                return (
                    <Pressable onPress={() => openAttachment(url)} style={styles.attachmentVideoWrap}>
                        <Image
                            source={{ uri: thumb }}
                            style={styles.attachmentMedia}
                            contentFit="cover"
                            onError={() => markFailed(m.id)}
                        />
                        <View style={styles.attachmentPlayBadge}>
                            <FontAwesomeIcon icon={faPlay} size={16} color={colors.white} />
                        </View>
                    </Pressable>
                );
            }
            if (failed) return renderUnavailableMedia("Video");
        }

        // Audio / file / shared post / story / unsupported — a tappable chip.
        // Card sits on colors.background in both bubble variants so colors.text
        // stays legible regardless of the bubble's own colour.
        const meta = attachmentMeta(m.attachmentType);
        return (
            <Pressable
                onPress={() => openAttachment(url)}
                disabled={!url}
                style={styles.attachmentCard}
            >
                <FontAwesomeIcon icon={meta.icon} size={15} color={colors.text} />
                <Text style={styles.attachmentCardText} numberOfLines={1}>
                    {url ? meta.label : `${meta.label} (unavailable)`}
                </Text>
            </Pressable>
        );
    };

    const renderBubble = (m: InboxMessage) => {
        const mine = m.author === "business";
        const attachment = renderAttachment(m);
        const hasText = !!m.text;
        return (
            <View
                key={m.id}
                style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
            >
                <View
                    style={[
                        styles.bubble,
                        mine
                            ? { backgroundColor: colors.primary }
                            : { backgroundColor: colors.tag },
                        m.pending && styles.bubblePending,
                    ]}
                >
                    {attachment}
                    {hasText ? (
                        <Text
                            style={[
                                styles.bubbleText,
                                attachment ? styles.bubbleTextWithAttachment : null,
                                { color: mine ? colors.onPrimary : colors.text },
                            ]}
                        >
                            {m.text}
                        </Text>
                    ) : null}
                </View>
                <Text style={styles.bubbleTime}>
                    {m.pending ? "Sending…" : relativeTime(m.sentAt)}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                {showBack ? (
                    <Pressable onPress={onBack} style={styles.headerBtn}>
                        <FontAwesomeIcon icon={faArrowLeft} size={18} color={colors.text} />
                    </Pressable>
                ) : null}
                <ChannelAvatar
                    avatarUrl={conversation.participant.avatarUrl}
                    channel={conversation.channel}
                    size={40}
                />
                <View style={styles.headerText}>
                    <Text numberOfLines={1} style={styles.headerName}>
                        {conversation.participant.name}
                    </Text>
                    <View style={styles.headerMeta}>
                        <Text
                            style={[styles.headerChannel, { color: channelColor(conversation.channel, colors) }]}
                        >
                            {channelLabel(conversation.channel)}
                        </Text>
                        <Text style={styles.headerDot}>·</Text>
                        <Text style={styles.headerSub}>
                            {isComment ? "Comment" : "Direct message"}
                        </Text>
                    </View>
                </View>
                {showDetailsToggle ? (
                    <Pressable onPress={onToggleDetails} style={styles.headerBtn}>
                        <FontAwesomeIcon icon={faCircleInfo} size={18} color={colors.text} />
                    </Pressable>
                ) : null}
            </View>

            {/* Body */}
            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
            >
                {isComment && conversation.post ? (
                    <View style={styles.postCard}>
                        <Image
                            source={{ uri: conversation.post.thumbnailUrl }}
                            style={styles.postThumb}
                            contentFit="cover"
                        />
                        <View style={styles.postInfo}>
                            <Text style={styles.postLabel}>COMMENTED ON</Text>
                            <Text numberOfLines={2} style={styles.postCaption}>
                                {conversation.post.caption ?? "Post"}
                            </Text>
                        </View>
                    </View>
                ) : null}

                {isComment && conversation.comment ? (
                    <>
                        <View style={styles.commentCard}>
                            <View style={styles.commentStripe} />
                            <View style={styles.commentBody}>
                                <Text style={styles.commentAuthor}>
                                    @{conversation.participant.handle ?? conversation.participant.name}
                                </Text>
                                <Text style={styles.commentText}>{conversation.comment.text}</Text>
                                <View style={styles.commentMetaRow}>
                                    <Text style={styles.bubbleTime}>
                                        {relativeTime(conversation.comment.authoredAt)}
                                    </Text>
                                    {conversation.comment.hidden ? (
                                        <View style={[styles.hiddenPill, { backgroundColor: colors.tag }]}>
                                            <FontAwesomeIcon icon={faEyeSlash} size={10} color={colors.textSecondary} />
                                            <Text style={styles.hiddenPillText}>Hidden</Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        </View>
                        {conversation.comment.replies.map(renderBubble)}
                    </>
                ) : null}

                {!isComment && conversation.messages
                    ? conversation.messages.map(renderBubble)
                    : null}
            </ScrollView>

            {/* Comment moderation actions */}
            {isComment && conversation.comment ? (
                <View style={styles.actionsRow}>
                    {confirmingDelete ? (
                        <View style={styles.confirmRow}>
                            <Text style={styles.confirmText}>Delete this comment?</Text>
                            <Pressable
                                onPress={() => setConfirmingDelete(false)}
                                style={[styles.confirmBtn, { backgroundColor: colors.tag }]}
                            >
                                <Text style={[styles.confirmBtnText, { color: colors.text }]}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={async () => {
                                    setConfirmingDelete(false);
                                    await onDelete();
                                }}
                                style={[styles.confirmBtn, { backgroundColor: colors.red }]}
                            >
                                <Text style={[styles.confirmBtnText, { color: colors.white }]}>Delete</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <>
                            <Pressable
                                onPress={() => onSetHidden(!conversation.comment!.hidden)}
                                style={[styles.actionBtn, { backgroundColor: colors.tag }]}
                            >
                                <FontAwesomeIcon
                                    icon={conversation.comment.hidden ? faEye : faEyeSlash}
                                    size={13}
                                    color={colors.text}
                                />
                                <Text style={styles.actionText}>
                                    {conversation.comment.hidden ? "Unhide" : "Hide"}
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setConfirmingDelete(true)}
                                style={[styles.actionBtn, { backgroundColor: colors.tag }]}
                            >
                                <FontAwesomeIcon icon={faTrash} size={13} color={colors.red} />
                                <Text style={[styles.actionText, { color: colors.red }]}>Delete</Text>
                            </Pressable>
                        </>
                    )}
                </View>
            ) : null}

            {/* Composer — view-only on the free plan (replying in the Combined
                Social Inbox is a paid feature); else the normal 24h-window composer. */}
            {inboxReadOnly ? (
                <UpgradeInline message="Replying is a Pro feature — upgrade to reply to comments & DMs." />
            ) : (
                <MessageComposer
                    enabled={replyable}
                    disabledReason="You can only reply within 24 hours of the last message."
                    placeholder={isComment ? "Write a public reply…" : "Reply…"}
                    hint={
                        isComment
                            ? "Your reply will be posted publicly under this comment."
                            : windowLeft
                            ? `Reply window: ${windowLeft}`
                            : undefined
                    }
                    onSend={onSendReply}
                />
            )}
        </View>
    );
};

/** Icon + label for non-inline attachment kinds (audio/file/share/story). */
function attachmentMeta(type?: AttachmentType) {
    switch (type) {
        case "audio":
            return { icon: faMicrophone, label: "Voice message" };
        case "share":
            return { icon: faLink, label: "Shared post" };
        case "story":
            return { icon: faBookOpen, label: "Story" };
        case "video":
            return { icon: faPlay, label: "Video" };
        case "image":
            return { icon: faFile, label: "Photo" };
        default:
            return { icon: faFile, label: "Attachment" };
    }
}

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    backgroundColor: colors.background,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: colors.background,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                    zIndex: 2,
                },
                headerBtn: {
                    padding: 6,
                },
                headerText: {
                    flex: 1,
                    minWidth: 0,
                },
                headerName: {
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                },
                headerMeta: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 1,
                },
                headerChannel: {
                    fontSize: 12,
                    fontWeight: "700",
                },
                headerDot: {
                    fontSize: 12,
                    color: colors.textSecondary,
                },
                headerSub: {
                    fontSize: 12,
                    color: colors.textSecondary,
                },
                body: {
                    flex: 1,
                },
                bodyContent: {
                    padding: 16,
                    gap: 4,
                },
                postCard: {
                    flexDirection: "row",
                    gap: 12,
                    padding: 10,
                    borderRadius: 14,
                    backgroundColor: colors.tag,
                    marginBottom: 12,
                    alignItems: "center",
                },
                postThumb: {
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    backgroundColor: colors.background,
                },
                postInfo: {
                    flex: 1,
                    minWidth: 0,
                },
                postLabel: {
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1,
                    color: colors.textSecondary,
                    marginBottom: 3,
                },
                postCaption: {
                    fontSize: 14,
                    color: colors.text,
                    fontWeight: "500",
                },
                commentCard: {
                    flexDirection: "row",
                    overflow: "hidden",
                    borderRadius: 12,
                    backgroundColor: colors.tag,
                    marginBottom: 8,
                },
                commentStripe: {
                    width: 4,
                    backgroundColor: colors.primary,
                },
                commentBody: {
                    flex: 1,
                    padding: 12,
                },
                commentAuthor: {
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 4,
                },
                commentText: {
                    fontSize: 15,
                    color: colors.text,
                    lineHeight: 21,
                },
                commentMetaRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 8,
                },
                hiddenPill: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 10,
                },
                hiddenPillText: {
                    fontSize: 11,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                bubbleRow: {
                    maxWidth: "82%",
                    marginVertical: 4,
                },
                bubbleRowMine: {
                    alignSelf: "flex-end",
                    alignItems: "flex-end",
                },
                bubbleRowTheirs: {
                    alignSelf: "flex-start",
                    alignItems: "flex-start",
                },
                bubble: {
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 18,
                },
                bubblePending: {
                    opacity: 0.6,
                },
                bubbleText: {
                    fontSize: 15,
                    lineHeight: 21,
                },
                bubbleTextWithAttachment: {
                    marginTop: 8,
                },
                attachmentMedia: {
                    width: 230,
                    height: 230,
                    borderRadius: 12,
                    backgroundColor: colors.background,
                },
                attachmentVideoWrap: {
                    position: "relative",
                    alignItems: "center",
                    justifyContent: "center",
                },
                attachmentFallback: {
                    width: 230,
                    height: 160,
                    borderRadius: 12,
                    backgroundColor: colors.background,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                },
                attachmentFallbackText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                attachmentPlayBadge: {
                    position: "absolute",
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.backdropStrong,
                    alignItems: "center",
                    justifyContent: "center",
                },
                attachmentCard: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 9,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: colors.background,
                    maxWidth: 230,
                },
                attachmentCardText: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.text,
                    flexShrink: 1,
                },
                bubbleTime: {
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginTop: 3,
                    marginHorizontal: 4,
                },
                actionsRow: {
                    flexDirection: "row",
                    gap: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: colors.background,
                },
                actionBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    paddingHorizontal: 14,
                    height: 36,
                    borderRadius: 18,
                },
                actionText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.text,
                },
                confirmRow: {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                },
                confirmText: {
                    flex: 1,
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.text,
                },
                confirmBtn: {
                    paddingHorizontal: 16,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                },
                confirmBtnText: {
                    fontSize: 13,
                    fontWeight: "700",
                },
            }),
        [colors]
    );
}

export default ThreadView;
