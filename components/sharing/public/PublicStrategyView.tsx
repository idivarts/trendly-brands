import SharedCommentsPanel, { PanelComment } from "@/components/shared/CommentsPanel";
import { usePublicComments } from "@/hooks/use-public-comments";
import { ShareTier } from "@/hooks/use-public-share";
import { IShareLink } from "@/shared-libs/firestore/trendly-pro/models/share-links";
import { IStrategy } from "@/shared-libs/firestore/trendly-pro/models/strategies";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import { marked } from "marked";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import RenderHTML from "react-native-render-html";

interface Props {
    share: IShareLink & { token: string };
    tier: ShareTier;
    viewerId: string | null;
    viewerName: string | null;
}

const PublicStrategyView: React.FC<Props> = ({ share, tier, viewerId, viewerName }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { width } = useWindowDimensions();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [strategy, setStrategy] = useState<IStrategy | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!share.resourceId) return;
        const ref = doc(FirestoreDB, "brands", share.brandId, "strategies", share.resourceId);
        const unsub = onSnapshot(
            ref,
            (snap) => {
                if (!snap.exists()) {
                    setNotFound(true);
                } else {
                    setStrategy(snap.data() as IStrategy);
                }
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
        resource: "strategies",
        resourceId: share.resourceId,
        viewerId,
        viewerName,
    });

    const html = useMemo(() => {
        const body = strategy?.markdownContent ?? "";
        try {
            return marked.parse(body, { async: false }) as string;
        } catch {
            return body;
        }
    }, [strategy?.markdownContent]);

    const contentWidth = Math.min(width, 760) - 48;

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }
    if (notFound || !strategy) {
        return (
            <View style={styles.center}>
                <Text style={styles.notFound}>This strategy is no longer available.</Text>
            </View>
        );
    }

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
                <Text style={styles.title}>{strategy.name}</Text>
                <RenderHTML
                    contentWidth={contentWidth}
                    source={{ html: html || "<p></p>" }}
                    baseStyle={{ color: colors.text, fontSize: 15, lineHeight: 23 }}
                    tagsStyles={{
                        h1: { color: colors.text },
                        h2: { color: colors.text },
                        h3: { color: colors.text },
                        a: { color: colors.primary },
                        li: { color: colors.text },
                        p: { color: colors.text },
                    }}
                />

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
            marginBottom: 16,
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

export default PublicStrategyView;
