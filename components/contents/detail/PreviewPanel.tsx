import { ContentType } from "@/components/content-calendar/types";
import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import { socialAccountLabel, useBrandSocialContext } from "@/contexts/brand-social-context.provider";
import { isFormatPlatformCompatible } from "@/shared-libs/firestore/trendly-pro/constants/content-format";
import { Platform } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import Colors from "@/shared-uis/constants/Colors";
import {
    faBookmark,
    faChevronRight,
    faComment,
    faHeart,
    faImage,
    faPaperPlane,
    faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type PreviewPlatform = Platform;

interface PreviewPanelProps {
    contentType: ContentType;
    /** The platforms this content is targeting — drives which previews are shown. */
    targetPlatforms: Platform[];
    attachments: Attachment[];
    caption: string;
    hashtags: string;
    onCollapse?: () => void;
}

// Brand colour for a platform's dot / accent (from the central palette).
const platformColor = (platform: PreviewPlatform, colors: ReturnType<typeof Colors>) => {
    const key = SOCIAL_PLATFORM_MAP[platform]?.colorKey;
    return (key && colors[key]) || colors.socialFacebook;
};

const PreviewPanel: React.FC<PreviewPanelProps> = ({
    contentType,
    targetPlatforms,
    attachments,
    caption,
    hashtags,
    onCollapse,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { socialAccounts } = useBrandSocialContext();

    // Only preview the platforms this content actually targets, and only those
    // that can carry the chosen format. Fall back to a single sensible platform
    // when the content has no (compatible) target yet.
    const platforms = useMemo<PreviewPlatform[]>(() => {
        const list = Array.from(new Set(targetPlatforms)).filter((p) =>
            isFormatPlatformCompatible(contentType, p)
        );
        if (list.length) return list;
        return [contentType === "text" ? "facebook" : "instagram"];
    }, [targetPlatforms, contentType]);

    const [platform, setPlatform] = useState<PreviewPlatform>(platforms[0]);
    const active = platforms.includes(platform) ? platform : platforms[0];

    const account = socialAccounts.find((a) => a.platform === active);
    // Facebook stores the page id in `username`; show the page name instead.
    const username = account ? socialAccountLabel(account) : "yourbrand";
    const avatar = account?.profileImageURL;

    const isText = contentType === "text";
    // Portrait 9:16 frame for vertical formats; landscape 16:9 for `video`.
    const isStory = contentType === "story" || contentType === "reel";
    const isLandscape = contentType === "video";
    const firstImage = attachments.find((a) => a.imageUrl)?.imageUrl;
    const isVideo = attachments.some((a) => a.type === "video" || a.type === "reel");
    const slideCount = attachments.length;

    const accentColor = platformColor(active, colors);

    const mediaBox = (shape: "tall" | "square" | "landscape") => (
        <View
            style={[
                styles.media,
                shape === "tall"
                    ? styles.mediaTall
                    : shape === "landscape"
                        ? styles.mediaLandscape
                        : styles.mediaSquare,
            ]}
        >
            {firstImage ? (
                <Image source={{ uri: firstImage }} style={styles.mediaImg} resizeMode="cover" />
            ) : isVideo ? (
                <View style={styles.mediaPlaceholder}>
                    <FontAwesomeIcon icon={faPlay} size={26} color={colors.onPrimary} />
                </View>
            ) : (
                <View style={styles.mediaEmpty}>
                    <FontAwesomeIcon icon={faImage} size={22} color={colors.textSecondary} />
                    <Text style={styles.mediaEmptyText}>Add media to preview</Text>
                </View>
            )}
            {contentType === "carousel" && slideCount > 1 ? (
                <View style={styles.dots}>
                    {attachments.slice(0, 5).map((_, i) => (
                        <View
                            key={i}
                            style={[styles.dot, { backgroundColor: i === 0 ? colors.white : "rgba(255,255,255,0.5)" }]}
                        />
                    ))}
                </View>
            ) : null}
        </View>
    );

    const avatarNode = avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatar} />
    ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{username.charAt(0).toUpperCase()}</Text>
        </View>
    );

    return (
        <View style={styles.root}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Preview</Text>
                {onCollapse ? (
                    <Pressable
                        style={({ pressed }) => [styles.collapseBtn, pressed && styles.pressed]}
                        onPress={onCollapse}
                        accessibilityLabel="Collapse preview"
                    >
                        <FontAwesomeIcon icon={faChevronRight} size={12} color={colors.textSecondary} />
                    </Pressable>
                ) : null}
            </View>

            {/* Platform tabs */}
            {platforms.length > 1 ? (
                <View style={styles.tabs}>
                    {platforms.map((p) => {
                        const on = p === active;
                        const dot = platformColor(p, colors);
                        return (
                            <Pressable
                                key={p}
                                style={({ pressed }) => [
                                    styles.tab,
                                    on && styles.tabActive,
                                    pressed && styles.pressed,
                                ]}
                                onPress={() => setPlatform(p)}
                            >
                                <View style={[styles.tabDot, { backgroundColor: dot }]} />
                                <Text style={[styles.tabText, on && styles.tabTextActive]}>
                                    {SOCIAL_PLATFORM_MAP[p]?.label ?? p}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            ) : null}

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {isText ? (
                    // Text post — plain-text card (Facebook / LinkedIn / X), no media.
                    <View style={styles.postCard}>
                        <View style={styles.postHeader}>
                            {avatarNode}
                            <Text style={styles.postUser} numberOfLines={1}>{username}</Text>
                            <Text style={styles.postDots}>•••</Text>
                        </View>
                        <View style={styles.textBody}>
                            {caption ? (
                                <Text style={styles.textBodyText}>{caption}</Text>
                            ) : (
                                <Text style={styles.textBodyPlaceholder}>
                                    Write your post to preview it here…
                                </Text>
                            )}
                            {hashtags ? (
                                <Text style={[styles.textBodyText, { color: accentColor }]}>
                                    {hashtags}
                                </Text>
                            ) : null}
                        </View>
                        <View style={styles.actions}>
                            <FontAwesomeIcon icon={faHeart} size={18} color={colors.text} />
                            <FontAwesomeIcon icon={faComment} size={18} color={colors.text} />
                            <FontAwesomeIcon icon={faPaperPlane} size={17} color={colors.text} />
                        </View>
                    </View>
                ) : isStory ? (
                    // Story / Reel — full-bleed 9:16 with overlaid chrome
                    <View style={styles.storyFrame}>
                        {mediaBox("tall")}
                        <View style={styles.storyTop}>
                            {avatarNode}
                            <Text style={styles.storyUser} numberOfLines={1}>{username}</Text>
                        </View>
                        {caption ? (
                            <View style={styles.storyCaption}>
                                <Text style={styles.storyCaptionText} numberOfLines={3}>{caption}</Text>
                            </View>
                        ) : null}
                    </View>
                ) : (
                    // Feed post / carousel
                    <View style={styles.postCard}>
                        <View style={styles.postHeader}>
                            {avatarNode}
                            <Text style={styles.postUser} numberOfLines={1}>{username}</Text>
                            <Text style={styles.postDots}>•••</Text>
                        </View>
                        {mediaBox(isLandscape ? "landscape" : "square")}
                        <View style={styles.actions}>
                            <FontAwesomeIcon icon={faHeart} size={18} color={colors.text} />
                            <FontAwesomeIcon icon={faComment} size={18} color={colors.text} />
                            <FontAwesomeIcon icon={faPaperPlane} size={17} color={colors.text} />
                            <View style={styles.actionsSpacer} />
                            <FontAwesomeIcon icon={faBookmark} size={18} color={colors.text} />
                        </View>
                        {caption || hashtags ? (
                            <View style={styles.captionWrap}>
                                <Text style={styles.captionText}>
                                    <Text style={styles.captionUser}>{username} </Text>
                                    {caption}
                                </Text>
                                {hashtags ? (
                                    <Text style={[styles.captionText, { color: accentColor }]}>{hashtags}</Text>
                                ) : null}
                            </View>
                        ) : null}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.card,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.05,
            elevation: 2,
        },
        headerTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
        },
        collapseBtn: {
            width: 30,
            height: 30,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        tabs: {
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: 16,
            paddingTop: 12,
        },
        tab: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 9,
            backgroundColor: colors.tag,
        },
        tabActive: {
            backgroundColor: colors.aliceBlue,
        },
        tabDot: {
            width: 9,
            height: 9,
            borderRadius: 5,
        },
        tabText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        tabTextActive: {
            color: colors.primary,
            fontWeight: "700",
        },
        scroll: {
            padding: 16,
            alignItems: "center",
        },
        // ── Feed post ──────────────────────────────────────────────────────
        postCard: {
            width: "100%",
            maxWidth: 340,
            backgroundColor: colors.background,
            borderRadius: 14,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 10,
            shadowOpacity: 0.08,
            elevation: 3,
        },
        postHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            paddingHorizontal: 12,
            paddingVertical: 10,
        },
        postUser: {
            flex: 1,
            fontSize: 13,
            fontWeight: "700",
            color: colors.text,
        },
        postDots: {
            fontSize: 14,
            color: colors.text,
            fontWeight: "700",
        },
        avatar: {
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: colors.tag,
        },
        avatarFallback: {
            alignItems: "center",
            justifyContent: "center",
        },
        avatarInitial: {
            fontSize: 13,
            fontWeight: "800",
            color: colors.primary,
        },
        media: {
            width: "100%",
            backgroundColor: colors.tag,
        },
        mediaSquare: {
            aspectRatio: 1,
        },
        mediaTall: {
            aspectRatio: 9 / 16,
        },
        mediaLandscape: {
            aspectRatio: 16 / 9,
        },
        mediaImg: {
            width: "100%",
            height: "100%",
        },
        mediaPlaceholder: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
        },
        mediaEmpty: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
        },
        mediaEmptyText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        dots: {
            position: "absolute",
            bottom: 10,
            alignSelf: "center",
            flexDirection: "row",
            gap: 5,
        },
        dot: {
            width: 6,
            height: 6,
            borderRadius: 3,
        },
        actions: {
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            paddingHorizontal: 12,
            paddingVertical: 10,
        },
        actionsSpacer: {
            flex: 1,
        },
        captionWrap: {
            paddingHorizontal: 12,
            paddingBottom: 14,
            gap: 4,
        },
        captionText: {
            fontSize: 13,
            lineHeight: 18,
            color: colors.text,
        },
        captionUser: {
            fontWeight: "700",
        },
        // ── Text post ──────────────────────────────────────────────────────
        textBody: {
            paddingHorizontal: 14,
            paddingTop: 4,
            paddingBottom: 12,
            gap: 6,
        },
        textBodyText: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.text,
        },
        textBodyPlaceholder: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.textSecondary,
        },
        // ── Story / Reel ───────────────────────────────────────────────────
        storyFrame: {
            width: "100%",
            maxWidth: 300,
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 14,
            shadowOpacity: 0.12,
            elevation: 4,
        },
        storyTop: {
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
        },
        storyUser: {
            flex: 1,
            fontSize: 13,
            fontWeight: "700",
            color: colors.white,
            textShadowColor: "rgba(0,0,0,0.5)",
            textShadowRadius: 4,
        },
        storyCaption: {
            position: "absolute",
            bottom: 16,
            left: 12,
            right: 12,
            backgroundColor: "rgba(0,0,0,0.35)",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
        },
        storyCaptionText: {
            fontSize: 13,
            lineHeight: 18,
            color: colors.white,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default PreviewPanel;
