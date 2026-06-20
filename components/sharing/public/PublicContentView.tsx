import SharedCommentsPanel, { PanelComment } from "@/components/shared/CommentsPanel";
import { usePublicComments } from "@/hooks/use-public-comments";
import { ShareTier } from "@/hooks/use-public-share";
import { IContent } from "@/shared-libs/firestore/trendly-pro/models/contents";
import { IShareLink } from "@/shared-libs/firestore/trendly-pro/models/share-links";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface Props {
    share: IShareLink & { token: string };
    tier: ShareTier;
    viewerId: string | null;
    viewerName: string | null;
}

const Field: React.FC<{ label: string; value?: string; styles: ReturnType<typeof createStyles> }> = ({
    label,
    value,
    styles,
}) =>
    value ? (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={styles.fieldValue}>{value}</Text>
        </View>
    ) : null;

const PublicContentView: React.FC<Props> = ({ share, tier, viewerId, viewerName }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [content, setContent] = useState<IContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!share.resourceId) return;
        const ref = doc(FirestoreDB, "brands", share.brandId, "contents", share.resourceId);
        const unsub = onSnapshot(
            ref,
            (snap) => {
                if (!snap.exists()) setNotFound(true);
                else setContent(snap.data() as IContent);
                setLoading(false);
            },
            () => {
                setNotFound(true);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [share.brandId, share.resourceId]);

    const comments = usePublicComments({
        brandId: share.brandId,
        resource: "contents",
        resourceId: share.resourceId,
        viewerId,
        viewerName,
    });

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }
    if (notFound || !content) {
        return (
            <View style={styles.center}>
                <Text style={styles.notFound}>This content is no longer available.</Text>
            </View>
        );
    }

    const heroImage =
        content.attachments?.find((a) => a.imageUrl)?.imageUrl ?? undefined;

    const panelComments: PanelComment[] = comments.comments.map((c) => ({
        id: c.id,
        authorId: c.authorId,
        authorName: c.authorName,
        text: c.text,
        createdAt: c.createdAt,
        parentId: c.parentId,
        resolved: c.resolved,
        snippet: c.snippet,
    }));

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.doc}>
                <Text style={styles.title}>{content.title}</Text>
                <Text style={styles.meta}>
                    {[
                        content.contentFormat,
                        content.platforms?.length
                            ? content.platforms.join(", ")
                            : content.platform,
                    ]
                        .filter(Boolean)
                        .join(" · ")}
                </Text>

                {heroImage ? (
                    <Image source={{ uri: heroImage }} style={styles.hero} resizeMode="cover" />
                ) : null}

                <Field label="Brief" value={content.description} styles={styles} />
                <Field label="Caption" value={content.caption} styles={styles} />
                <Field label="Hashtags" value={content.hashtags} styles={styles} />
                <Field label="Script" value={content.script} styles={styles} />

                {tier !== "anon" && (
                    <View style={styles.commentsWrap}>
                        <SharedCommentsPanel
                            comments={panelComments}
                            loading={comments.loading}
                            onAddComment={comments.addComment}
                            onAddReply={comments.addReply}
                            onDeleteComment={comments.deleteComment}
                            title="Comments"
                            titleIcon={faComments}
                            currentUserId={viewerId ?? ""}
                            emptyText="No comments yet. Start the conversation."
                            placeholder="Add a comment…"
                        />
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        scroll: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            alignItems: "center",
            paddingVertical: 24,
            paddingHorizontal: 16,
        },
        doc: {
            width: "100%",
            maxWidth: 760,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 12,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        title: {
            fontSize: 24,
            fontWeight: "800",
            color: colors.text,
        },
        meta: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
            marginTop: 4,
        },
        hero: {
            width: "100%",
            height: 320,
            borderRadius: 12,
            marginTop: 16,
            backgroundColor: colors.tag,
        },
        field: {
            marginTop: 18,
        },
        fieldLabel: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            marginBottom: 6,
        },
        fieldValue: {
            fontSize: 15,
            lineHeight: 22,
            color: colors.text,
        },
        commentsWrap: {
            marginTop: 28,
            height: 480,
        },
        center: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
        },
        notFound: {
            fontSize: 15,
            color: colors.textSecondary,
        },
    });
}

export default PublicContentView;
