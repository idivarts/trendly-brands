import { ContentType } from "@/components/content-calendar/types";
import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import { socialAccountLabel, useBrandSocialContext } from "@/contexts/brand-social-context.provider";
import { isFormatPlatformCompatible } from "@/shared-libs/firestore/trendly-pro/constants/content-format";
import { Platform, PlatformEnum } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import { variationSpecForPlatform } from "@/shared-libs/firestore/trendly-pro/constants/platform-fields";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { IPlatformOptions } from "@/shared-libs/firestore/trendly-pro/models/contents";
import {
    effectiveContentForPlatform,
    IContentVariation,
    variationHasCustomizations,
} from "@/shared-libs/firestore/trendly-pro/models/variations";
import { splitIntoThread } from "@/utils/twitter-thread";
import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import {
    faArrowDown,
    faArrowUp,
    faBookmark,
    faChevronLeft,
    faChevronRight,
    faComment,
    faGlobe,
    faHeart,
    faImage,
    faLocationDot,
    faLock,
    faPaperPlane,
    faPlay,
    faRetweet,
    faShare,
    faThumbsUp,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type PreviewPlatform = Platform;

/** The visual chrome family a platform's preview uses. */
type PreviewFamily = "instagram" | "facebook" | "linkedin" | "twitter" | "youtube" | "reddit";

interface PreviewPanelProps {
    contentType: ContentType;
    /** The platforms this content is targeting — drives which previews are shown. */
    targetPlatforms: Platform[];
    /** Generic (base) content — inherited by a platform unless its variation overrides it. */
    attachments: Attachment[];
    caption: string;
    hashtags: string;
    /** Generic platform options (used when a platform has no variation of its own). */
    platformOptions?: IPlatformOptions;
    /** Per-platform variations keyed by platform — merged over the generic content. */
    variationByPlatform?: Record<string, IContentVariation>;
    onCollapse?: () => void;
}

const familyForPlatform = (platform: Platform): PreviewFamily => {
    switch (platform) {
        case PlatformEnum.Facebook:
            return "facebook";
        case PlatformEnum.LinkedIn:
        case PlatformEnum.LinkedInPage:
            return "linkedin";
        case PlatformEnum.Twitter:
            return "twitter";
        case PlatformEnum.YouTube:
            return "youtube";
        case PlatformEnum.Reddit:
            return "reddit";
        default:
            return "instagram";
    }
};

// Brand colour for a platform's dot / accent (from the central palette).
const platformColor = (platform: PreviewPlatform, colors: ReturnType<typeof Colors>) => {
    const key = SOCIAL_PLATFORM_MAP[platform]?.colorKey;
    return (key && colors[key]) || colors.socialFacebook;
};

const LI_VISIBILITY_META: Record<string, { label: string; icon: IconProp }> = {
    PUBLIC: { label: "Anyone", icon: faGlobe },
    CONNECTIONS: { label: "Connections", icon: faUsers },
    LOGGED_IN: { label: "Members", icon: faLock },
};

const X_REPLY_LABEL: Record<string, string> = {
    everyone: "Everyone can reply",
    following: "Accounts you follow can reply",
    mentionedUsers: "Mentioned accounts can reply",
    subscribers: "Verified & subscribers can reply",
};

const PreviewPanel: React.FC<PreviewPanelProps> = ({
    contentType,
    targetPlatforms,
    attachments,
    caption,
    hashtags,
    platformOptions,
    variationByPlatform = {},
    onCollapse,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { xl } = useBreakpoints();
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
    const family = familyForPlatform(active);

    // Resolve the content that will actually publish to the active platform:
    // generic content merged with this platform's variation (overrides + options).
    const variation = variationByPlatform[active];
    const eff = useMemo(
        () =>
            effectiveContentForPlatform(
                { caption, hashtags, attachments, platformOptions },
                variation
            ),
        [caption, hashtags, attachments, platformOptions, variation]
    );
    const effCaption = eff.caption ?? "";
    const effHashtags = eff.hashtags ?? "";
    const effAttachments = eff.attachments ?? [];
    const options = eff.platformOptions ?? {};
    const customized = variationHasCustomizations(variation);

    const account = socialAccounts.find((a) => a.platform === active);
    // Facebook stores the page id in `username`; show the page name instead.
    const username = account ? socialAccountLabel(account) : "yourbrand";
    const avatar = account?.profileImageURL;

    const isText = contentType === "text";
    // Portrait 9:16 frame for vertical formats; landscape 16:9 for `video`.
    const isStory = contentType === "story" || contentType === "reel";
    const isLandscape = contentType === "video";
    const firstImage = effAttachments.find((a) => a.imageUrl)?.imageUrl;
    const isVideo = effAttachments.some((a) => a.type === "video" || a.type === "reel");
    const slideCount = effAttachments.length;

    // Carousel: which slide the preview is showing. Web gets arrows to flip
    // through slides; `safeSlide` keeps the index valid as attachments change.
    const isCarousel = contentType === "carousel";
    const [activeSlide, setActiveSlide] = useState(0);
    const safeSlide = slideCount > 0 ? Math.min(activeSlide, slideCount - 1) : 0;
    const displayImage = isCarousel
        ? effAttachments[safeSlide]?.imageUrl ?? firstImage
        : firstImage;
    const showArrows = isCarousel && xl && slideCount > 1;

    const accentColor = platformColor(active, colors);

    // Twitter thread: an explicit thread wins; otherwise the caption is
    // auto-split at publish time, so preview that split faithfully.
    const twitterThread = useMemo<string[]>(() => {
        if (family !== "twitter") return [];
        const explicit = options.twitterThread?.filter((t) => t.trim().length) ?? [];
        if (explicit.length) return explicit;
        const body = [effCaption, effHashtags].filter(Boolean).join("\n\n");
        return splitIntoThread(body);
    }, [family, options.twitterThread, effCaption, effHashtags]);

    // Registry-driven "publish settings" rows — every set platform option that
    // isn't already surfaced visually in the card above, so nothing is hidden.
    const optionRows = useMemo<{ label: string; value: string }[]>(() => {
        const spec = variationSpecForPlatform(active);
        if (!spec) return [];
        const shown = SHOWN_KEYS[family];
        const rows: { label: string; value: string }[] = [];
        for (const field of spec.fields) {
            if (field.type === "thread") continue; // shown as the tweet chain
            if (shown.has(field.key)) continue; // already in the card's chrome
            const raw = (options as Record<string, unknown>)[field.key];
            if (raw == null || raw === "") continue;
            if (field.type === "toggle") {
                if (raw) rows.push({ label: field.label, value: "Yes" });
                continue;
            }
            if (field.type === "tags") {
                const arr = Array.isArray(raw) ? (raw as string[]) : [];
                if (arr.length) rows.push({ label: field.label, value: arr.join(", ") });
                continue;
            }
            if (field.type === "select") {
                const opt = field.options?.find((o) => o.value === raw);
                rows.push({ label: field.label, value: opt?.label ?? String(raw) });
                continue;
            }
            rows.push({ label: field.label, value: String(raw) });
        }
        return rows;
    }, [active, family, options]);

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
            {displayImage ? (
                <Image source={{ uri: displayImage }} style={styles.mediaImg} resizeMode="cover" />
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

            {/* Web-only slide arrows — flip through carousel slides in the preview. */}
            {showArrows && safeSlide > 0 ? (
                <Pressable
                    style={({ pressed }) => [styles.navBtn, styles.navBtnLeft, pressed && styles.pressed]}
                    onPress={() => setActiveSlide(Math.max(0, safeSlide - 1))}
                    accessibilityLabel="Previous slide"
                >
                    <FontAwesomeIcon icon={faChevronLeft} size={13} color={colors.black} />
                </Pressable>
            ) : null}
            {showArrows && safeSlide < slideCount - 1 ? (
                <Pressable
                    style={({ pressed }) => [styles.navBtn, styles.navBtnRight, pressed && styles.pressed]}
                    onPress={() => setActiveSlide(Math.min(slideCount - 1, safeSlide + 1))}
                    accessibilityLabel="Next slide"
                >
                    <FontAwesomeIcon icon={faChevronRight} size={13} color={colors.black} />
                </Pressable>
            ) : null}

            {isCarousel && slideCount > 1 ? (
                <View style={styles.dots}>
                    {effAttachments.slice(0, 5).map((_, i) => (
                        <View
                            key={i}
                            style={[styles.dot, { backgroundColor: i === safeSlide ? colors.white : "rgba(255,255,255,0.5)" }]}
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

    const feedMedia = !isText ? mediaBox(isLandscape ? "landscape" : "square") : null;

    // A caption/hashtags block — shared by the plain feed cards (FB / LinkedIn).
    const bodyBlock = (emphasize?: boolean) =>
        effCaption || effHashtags ? (
            <View style={styles.captionWrap}>
                {effCaption ? (
                    <Text style={emphasize ? styles.textBodyText : styles.captionText}>{effCaption}</Text>
                ) : null}
                {effHashtags ? (
                    <Text style={[styles.captionText, { color: accentColor }]}>{effHashtags}</Text>
                ) : null}
            </View>
        ) : (
            <View style={styles.captionWrap}>
                <Text style={styles.textBodyPlaceholder}>Write your post to preview it here…</Text>
            </View>
        );

    const commentRow = (text: string) =>
        text ? (
            <View style={styles.commentRow}>
                <Text style={styles.commentText} numberOfLines={3}>
                    <Text style={styles.commentUser}>{username} </Text>
                    {text}
                </Text>
            </View>
        ) : null;

    // ── Per-platform cards ───────────────────────────────────────────────────
    const renderInstagram = () => (
        <View style={styles.postCard}>
            <View style={styles.postHeader}>
                {avatarNode}
                <View style={styles.postHeaderText}>
                    <Text style={styles.postUser} numberOfLines={1}>{username}</Text>
                    {options.instagramLocation ? (
                        <View style={styles.metaLine}>
                            <FontAwesomeIcon icon={faLocationDot} size={9} color={colors.textSecondary} />
                            <Text style={styles.metaLineText} numberOfLines={1}>{options.instagramLocation}</Text>
                        </View>
                    ) : null}
                </View>
                <Text style={styles.postDots}>•••</Text>
            </View>
            {feedMedia}
            <View style={styles.actions}>
                <FontAwesomeIcon icon={faHeart} size={18} color={colors.text} />
                <FontAwesomeIcon icon={faComment} size={18} color={colors.text} />
                <FontAwesomeIcon icon={faPaperPlane} size={17} color={colors.text} />
                <View style={styles.actionsSpacer} />
                <FontAwesomeIcon icon={faBookmark} size={18} color={colors.text} />
            </View>
            {effCaption || effHashtags ? (
                <View style={styles.captionWrap}>
                    <Text style={styles.captionText}>
                        <Text style={styles.captionUser}>{username} </Text>
                        {effCaption}
                    </Text>
                    {effHashtags ? (
                        <Text style={[styles.captionText, { color: accentColor }]}>{effHashtags}</Text>
                    ) : null}
                </View>
            ) : null}
            {commentRow(options.instagramFirstComment ?? "")}
        </View>
    );

    const renderFacebook = () => (
        <View style={styles.postCard}>
            <View style={styles.postHeader}>
                {avatarNode}
                <View style={styles.postHeaderText}>
                    <Text style={styles.postUser} numberOfLines={1}>{username}</Text>
                    <View style={styles.metaLine}>
                        <FontAwesomeIcon icon={faGlobe} size={9} color={colors.textSecondary} />
                        <Text style={styles.metaLineText}>Just now</Text>
                    </View>
                </View>
                <Text style={styles.postDots}>•••</Text>
            </View>
            {/* Facebook shows the text above the media. */}
            {bodyBlock(true)}
            {feedMedia}
            <View style={styles.reactionBar}>
                <View style={styles.reactionItem}>
                    <FontAwesomeIcon icon={faThumbsUp} size={15} color={colors.textSecondary} />
                    <Text style={styles.reactionText}>Like</Text>
                </View>
                <View style={styles.reactionItem}>
                    <FontAwesomeIcon icon={faComment} size={15} color={colors.textSecondary} />
                    <Text style={styles.reactionText}>Comment</Text>
                </View>
                <View style={styles.reactionItem}>
                    <FontAwesomeIcon icon={faShare} size={15} color={colors.textSecondary} />
                    <Text style={styles.reactionText}>Share</Text>
                </View>
            </View>
            {commentRow(options.facebookFirstComment ?? "")}
        </View>
    );

    const renderLinkedIn = () => {
        const vis = options.linkedinVisibility ? LI_VISIBILITY_META[options.linkedinVisibility] : null;
        return (
            <View style={styles.postCard}>
                <View style={styles.postHeader}>
                    {avatarNode}
                    <View style={styles.postHeaderText}>
                        <Text style={styles.postUser} numberOfLines={1}>{username}</Text>
                        <View style={styles.metaLine}>
                            <FontAwesomeIcon icon={(vis ?? LI_VISIBILITY_META.PUBLIC).icon} size={9} color={colors.textSecondary} />
                            <Text style={styles.metaLineText}>{(vis ?? LI_VISIBILITY_META.PUBLIC).label} · Now</Text>
                        </View>
                    </View>
                    <Text style={styles.postDots}>•••</Text>
                </View>
                {/* LinkedIn shows the post text above the media. */}
                {bodyBlock(true)}
                {feedMedia}
                <View style={styles.reactionBar}>
                    <View style={styles.reactionItem}>
                        <FontAwesomeIcon icon={faThumbsUp} size={15} color={colors.textSecondary} />
                        <Text style={styles.reactionText}>Like</Text>
                    </View>
                    <View style={styles.reactionItem}>
                        <FontAwesomeIcon icon={faComment} size={15} color={colors.textSecondary} />
                        <Text style={styles.reactionText}>Comment</Text>
                    </View>
                    <View style={styles.reactionItem}>
                        <FontAwesomeIcon icon={faRetweet} size={15} color={colors.textSecondary} />
                        <Text style={styles.reactionText}>Repost</Text>
                    </View>
                    <View style={styles.reactionItem}>
                        <FontAwesomeIcon icon={faPaperPlane} size={14} color={colors.textSecondary} />
                        <Text style={styles.reactionText}>Send</Text>
                    </View>
                </View>
                {commentRow(options.linkedinFirstComment ?? "")}
            </View>
        );
    };

    const renderTwitter = () => {
        const isThread = twitterThread.length > 1;
        const replyLabel = options.twitterReplySettings
            ? X_REPLY_LABEL[options.twitterReplySettings]
            : null;
        return (
            <View style={styles.postCard}>
                {(twitterThread.length ? twitterThread : [effCaption]).map((tweet, i, arr) => {
                    const last = i === arr.length - 1;
                    return (
                        <View key={i} style={styles.tweetRow}>
                            <View style={styles.tweetGutter}>
                                {avatar ? (
                                    <Image source={{ uri: avatar }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatar, styles.avatarFallback]}>
                                        <Text style={styles.avatarInitial}>{username.charAt(0).toUpperCase()}</Text>
                                    </View>
                                )}
                                {isThread && !last ? <View style={styles.tweetThreadLine} /> : null}
                            </View>
                            <View style={styles.tweetBody}>
                                <Text style={styles.postUser} numberOfLines={1}>
                                    {username} <Text style={styles.tweetHandle}>@{username} · now</Text>
                                </Text>
                                {tweet ? (
                                    <Text style={styles.tweetText}>{tweet}</Text>
                                ) : (
                                    <Text style={styles.textBodyPlaceholder}>Write your post to preview it here…</Text>
                                )}
                                {/* Media rides on the first tweet only. */}
                                {i === 0 && feedMedia ? <View style={styles.tweetMedia}>{feedMedia}</View> : null}
                                {options.twitterQuoteTweetId && i === 0 ? (
                                    <View style={styles.quoteCard}>
                                        <FontAwesomeIcon icon={faRetweet} size={11} color={colors.textSecondary} />
                                        <Text style={styles.metaLineText}>Quoting tweet {options.twitterQuoteTweetId}</Text>
                                    </View>
                                ) : null}
                                {last ? (
                                    <View style={styles.tweetActions}>
                                        <FontAwesomeIcon icon={faComment} size={13} color={colors.textSecondary} />
                                        <FontAwesomeIcon icon={faRetweet} size={13} color={colors.textSecondary} />
                                        <FontAwesomeIcon icon={faHeart} size={13} color={colors.textSecondary} />
                                        <FontAwesomeIcon icon={faShare} size={13} color={colors.textSecondary} />
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    );
                })}
                {replyLabel ? (
                    <View style={styles.tweetReply}>
                        <FontAwesomeIcon icon={faGlobe} size={10} color={colors.textSecondary} />
                        <Text style={styles.metaLineText}>{replyLabel}</Text>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderYouTube = () => (
        <View style={styles.postCard}>
            {!isText ? mediaBox(isStory ? "tall" : "landscape") : null}
            <View style={styles.ytBody}>
                <Text style={styles.ytTitle} numberOfLines={2}>
                    {options.youtubeTitle || "Add a video title"}
                </Text>
                <View style={styles.ytChannelRow}>
                    {avatarNode}
                    <Text style={styles.ytChannel} numberOfLines={1}>{username}</Text>
                </View>
                {effCaption ? (
                    <View style={styles.ytDescription}>
                        <Text style={styles.captionText} numberOfLines={4}>{effCaption}</Text>
                        {effHashtags ? (
                            <Text style={[styles.captionText, { color: accentColor }]}>{effHashtags}</Text>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </View>
    );

    const renderReddit = () => (
        <View style={styles.postCard}>
            <View style={styles.redditHead}>
                <View style={[styles.redditSubDot, { backgroundColor: accentColor }]} />
                <Text style={styles.redditSub} numberOfLines={1}>
                    r/{options.redditSubreddit || "subreddit"}
                </Text>
                <Text style={styles.metaLineText}>· Posted by u/{username}</Text>
            </View>
            <View style={styles.redditTags}>
                {options.redditNsfw ? (
                    <View style={[styles.redditTag, { backgroundColor: colors.statusRejectedBg }]}>
                        <Text style={[styles.redditTagText, { color: colors.statusRejectedFg }]}>NSFW</Text>
                    </View>
                ) : null}
                {options.redditSpoiler ? (
                    <View style={styles.redditTag}>
                        <Text style={styles.redditTagText}>SPOILER</Text>
                    </View>
                ) : null}
            </View>
            <Text style={styles.redditTitle}>{options.redditTitle || "Add a post title"}</Text>
            {effCaption ? <Text style={styles.textBodyText}>{effCaption}</Text> : null}
            {!isText && feedMedia ? <View style={styles.redditMedia}>{feedMedia}</View> : null}
            <View style={styles.redditBar}>
                <View style={styles.redditVote}>
                    <FontAwesomeIcon icon={faArrowUp} size={13} color={colors.textSecondary} />
                    <Text style={styles.reactionText}>Vote</Text>
                    <FontAwesomeIcon icon={faArrowDown} size={13} color={colors.textSecondary} />
                </View>
                <View style={styles.reactionItem}>
                    <FontAwesomeIcon icon={faComment} size={13} color={colors.textSecondary} />
                    <Text style={styles.reactionText}>Comments</Text>
                </View>
            </View>
        </View>
    );

    const renderStory = () => (
        <View style={styles.storyFrame}>
            {mediaBox("tall")}
            <View style={styles.storyTop}>
                {avatarNode}
                <Text style={styles.storyUser} numberOfLines={1}>{username}</Text>
            </View>
            {effCaption ? (
                <View style={styles.storyCaption}>
                    <Text style={styles.storyCaptionText} numberOfLines={3}>{effCaption}</Text>
                </View>
            ) : null}
        </View>
    );

    const renderTextCard = () => (
        <View style={styles.postCard}>
            <View style={styles.postHeader}>
                {avatarNode}
                <Text style={styles.postUser} numberOfLines={1}>{username}</Text>
                <Text style={styles.postDots}>•••</Text>
            </View>
            <View style={styles.textBody}>
                {effCaption ? (
                    <Text style={styles.textBodyText}>{effCaption}</Text>
                ) : (
                    <Text style={styles.textBodyPlaceholder}>Write your post to preview it here…</Text>
                )}
                {effHashtags ? (
                    <Text style={[styles.textBodyText, { color: accentColor }]}>{effHashtags}</Text>
                ) : null}
            </View>
            <View style={styles.actions}>
                <FontAwesomeIcon icon={faHeart} size={18} color={colors.text} />
                <FontAwesomeIcon icon={faComment} size={18} color={colors.text} />
                <FontAwesomeIcon icon={faPaperPlane} size={17} color={colors.text} />
            </View>
        </View>
    );

    const renderCard = () => {
        if (isStory && (family === "instagram" || family === "facebook")) return renderStory();
        switch (family) {
            case "youtube":
                return renderYouTube();
            case "reddit":
                return renderReddit();
            case "twitter":
                return renderTwitter();
            case "linkedin":
                return isText ? renderTextCard() : renderLinkedIn();
            case "facebook":
                return isText ? renderTextCard() : renderFacebook();
            default:
                return renderInstagram();
        }
    };

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
                        const hasVar = variationHasCustomizations(variationByPlatform[p]);
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
                                {hasVar ? <View style={styles.tabCustomDot} /> : null}
                            </Pressable>
                        );
                    })}
                </View>
            ) : null}

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {customized ? (
                    <View style={styles.customBanner}>
                        <View style={[styles.tabDot, { backgroundColor: accentColor }]} />
                        <Text style={styles.customBannerText}>
                            Customized for {SOCIAL_PLATFORM_MAP[active]?.label ?? active}
                        </Text>
                    </View>
                ) : null}

                {renderCard()}

                {optionRows.length ? (
                    <View style={styles.optionsCard}>
                        <Text style={styles.optionsTitle}>
                            {(SOCIAL_PLATFORM_MAP[active]?.label ?? active).toUpperCase()} SETTINGS
                        </Text>
                        {optionRows.map((row) => (
                            <View key={row.label} style={styles.optionRow}>
                                <Text style={styles.optionLabel}>{row.label}</Text>
                                <Text style={styles.optionValue} numberOfLines={2}>{row.value}</Text>
                            </View>
                        ))}
                    </View>
                ) : null}
            </ScrollView>
        </View>
    );
};

/**
 * Option keys already surfaced inside each platform's visual card — excluded
 * from the registry-driven "settings" list so nothing is shown twice.
 */
const SHOWN_KEYS: Record<PreviewFamily, Set<keyof IPlatformOptions>> = {
    instagram: new Set(["instagramLocation", "instagramFirstComment"]),
    facebook: new Set(["facebookFirstComment"]),
    linkedin: new Set(["linkedinVisibility", "linkedinFirstComment"]),
    twitter: new Set(["twitterReplySettings", "twitterQuoteTweetId"]),
    youtube: new Set(["youtubeTitle", "youtubeDescription"]),
    reddit: new Set(["redditSubreddit", "redditTitle", "redditNsfw", "redditSpoiler"]),
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
            flexWrap: "wrap",
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
        tabCustomDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.primary,
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
            gap: 14,
        },
        customBanner: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            alignSelf: "flex-start",
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 9,
            backgroundColor: colors.aliceBlue,
        },
        customBannerText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.primary,
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
        postHeaderText: {
            flex: 1,
            gap: 2,
        },
        postUser: {
            flex: 1,
            fontSize: 13,
            fontWeight: "700",
            color: colors.text,
        },
        metaLine: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
        },
        metaLineText: {
            fontSize: 11,
            color: colors.textSecondary,
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
        navBtn: {
            position: "absolute",
            top: "50%",
            transform: [{ translateY: -14 }],
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.white,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 4,
            shadowOpacity: 0.18,
            elevation: 3,
        },
        navBtnLeft: {
            left: 8,
        },
        navBtnRight: {
            right: 8,
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
        // Facebook / LinkedIn reaction bar (label + icon, evenly spread).
        reactionBar: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            paddingHorizontal: 8,
            paddingVertical: 9,
        },
        reactionItem: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        reactionText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        captionWrap: {
            paddingHorizontal: 12,
            paddingVertical: 10,
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
        commentRow: {
            paddingHorizontal: 12,
            paddingBottom: 12,
        },
        commentText: {
            fontSize: 12,
            lineHeight: 17,
            color: colors.textSecondary,
        },
        commentUser: {
            fontWeight: "700",
            color: colors.text,
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
            paddingHorizontal: 12,
        },
        textBodyPlaceholder: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.textSecondary,
        },
        // ── Twitter / X ────────────────────────────────────────────────────
        tweetRow: {
            flexDirection: "row",
            gap: 10,
            paddingHorizontal: 12,
            paddingTop: 12,
        },
        tweetGutter: {
            alignItems: "center",
        },
        tweetThreadLine: {
            flex: 1,
            width: 2,
            marginTop: 4,
            borderRadius: 1,
            backgroundColor: colors.tag,
        },
        tweetBody: {
            flex: 1,
            gap: 6,
            paddingBottom: 4,
        },
        tweetHandle: {
            fontSize: 12,
            fontWeight: "400",
            color: colors.textSecondary,
        },
        tweetText: {
            fontSize: 14,
            lineHeight: 19,
            color: colors.text,
        },
        tweetMedia: {
            borderRadius: 12,
            overflow: "hidden",
            marginTop: 2,
        },
        quoteCard: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        tweetActions: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingRight: 24,
            paddingTop: 4,
        },
        tweetReply: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginTop: 4,
            backgroundColor: colors.tag,
        },
        // ── YouTube ────────────────────────────────────────────────────────
        ytBody: {
            padding: 12,
            gap: 8,
        },
        ytTitle: {
            fontSize: 15,
            fontWeight: "800",
            color: colors.text,
            lineHeight: 20,
        },
        ytChannelRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        ytChannel: {
            flex: 1,
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        ytDescription: {
            gap: 4,
            paddingTop: 4,
        },
        // ── Reddit ─────────────────────────────────────────────────────────
        redditHead: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            paddingTop: 12,
        },
        redditSubDot: {
            width: 18,
            height: 18,
            borderRadius: 9,
        },
        redditSub: {
            fontSize: 13,
            fontWeight: "800",
            color: colors.text,
        },
        redditTags: {
            flexDirection: "row",
            gap: 6,
            paddingHorizontal: 12,
            paddingTop: 8,
        },
        redditTag: {
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: colors.tag,
        },
        redditTagText: {
            fontSize: 10,
            fontWeight: "800",
            color: colors.textSecondary,
        },
        redditTitle: {
            fontSize: 16,
            fontWeight: "800",
            color: colors.text,
            paddingHorizontal: 12,
            paddingTop: 8,
            lineHeight: 21,
        },
        redditMedia: {
            marginTop: 10,
        },
        redditBar: {
            flexDirection: "row",
            alignItems: "center",
            gap: 18,
            paddingHorizontal: 12,
            paddingVertical: 12,
        },
        redditVote: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: colors.tag,
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
        // ── Platform settings summary ──────────────────────────────────────
        optionsCard: {
            width: "100%",
            maxWidth: 340,
            backgroundColor: colors.aliceBlue,
            borderRadius: 12,
            padding: 14,
            gap: 10,
        },
        optionsTitle: {
            fontSize: 11,
            fontWeight: "800",
            color: colors.textSecondary,
            letterSpacing: 0.5,
        },
        optionRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
        },
        optionLabel: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
            flexShrink: 0,
        },
        optionValue: {
            flex: 1,
            fontSize: 12,
            fontWeight: "600",
            color: colors.text,
            textAlign: "right",
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default PreviewPanel;
