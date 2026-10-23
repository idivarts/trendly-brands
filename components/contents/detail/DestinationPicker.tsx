import { ISocialAccount, socialAccountLabel } from "@/contexts/brand-social-context.provider";
import { PlatformOptions, SocialDestination } from "@/components/contents/types";
import { LINKEDIN_PAGE_ENABLED, REDDIT_ENABLED } from "@/constants/features";
import Colors from "@/shared-uis/constants/Colors";
import { faCheck, faCirclePlus, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { fs, lh } from "@/constants/Typography";

// ─── DestinationPicker ────────────────────────────────────────────────────────
// "Send to" — which connected accounts this content goes out to, plus the
// per-platform publishing extras (YouTube title/visibility, Reddit subreddit).
// Extracted from the old ScheduleBar so the publish modal's step 1 can own
// destinations while step 2 owns timing.
//
// Selected state: a solid white check-circle with the check drawn in the brand
// colour, on the filled pill. The previous version used a translucent white
// circle (`colors.onPrimary + "33"`) with a WHITE check — and because the tokens
// are `rgb()` strings, that concatenation produced an invalid colour that the
// browser dropped, falling back to an opaque white circle. White check on white
// circle: the selected state rendered as an empty circle. See utils/color.ts.

export const PUBLISHABLE = new Set(
    ["instagram", "facebook", "linkedin", "linkedin_page", "twitter", "youtube", "reddit"].filter(
        (p) => (p !== "reddit" || REDDIT_ENABLED) && (p !== "linkedin_page" || LINKEDIN_PAGE_ENABLED)
    )
);

const YT_VISIBILITY: { label: string; value: "public" | "unlisted" | "private" }[] = [
    { label: "Public", value: "public" },
    { label: "Unlisted", value: "unlisted" },
    { label: "Private", value: "private" },
];

const platformDotColor = (platform: string, colors: ReturnType<typeof Colors>) => {
    switch (platform) {
        case "instagram":
            return colors.socialInstagram;
        case "linkedin":
        case "linkedin_page":
            return colors.socialLinkedin;
        case "twitter":
            return colors.socialTwitter;
        case "youtube":
            return colors.socialYoutube;
        case "reddit":
            return colors.socialReddit;
        default:
            return colors.socialFacebook;
    }
};

export interface DestinationPickerProps {
    socialAccounts: ISocialAccount[];
    destinations: SocialDestination[];
    onDestinationsChange: (next: SocialDestination[]) => void;
    platformOptions: PlatformOptions;
    onPlatformOptionsChange: (next: PlatformOptions) => void;
    /**
     * socialAccountId → why that account can't publish yet (missing subreddit,
     * no video, …). Selected-but-blocked accounts are flagged inline; they don't
     * block the other destinations. See publish-readiness.ts.
     */
    blockedReasons?: Map<string, string>;
    /** Platforms whose option fields are edited elsewhere (a variation tab). */
    hideOptionPlatforms?: string[];
}

const DestinationPicker: React.FC<DestinationPickerProps> = ({
    socialAccounts,
    destinations,
    onDestinationsChange,
    platformOptions,
    onPlatformOptionsChange,
    blockedReasons,
    hideOptionPlatforms = [],
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const hiddenSet = useMemo(() => new Set(hideOptionPlatforms), [hideOptionPlatforms]);
    const accounts = useMemo(
        () => socialAccounts.filter((a) => PUBLISHABLE.has(a.platform)),
        [socialAccounts]
    );
    const selectedPlatforms = useMemo(
        () => new Set(destinations.map((d) => d.platform)),
        [destinations]
    );

    const setOpt = (patch: Partial<PlatformOptions>) =>
        onPlatformOptionsChange({ ...platformOptions, ...patch });

    const isSelected = (id: string) => destinations.some((d) => d.socialAccountId === id);
    const toggle = (a: ISocialAccount) => {
        if (isSelected(a.id)) {
            onDestinationsChange(destinations.filter((d) => d.socialAccountId !== a.id));
        } else {
            onDestinationsChange([
                ...destinations,
                {
                    socialAccountId: a.id,
                    platform: a.platform as SocialDestination["platform"],
                    username: socialAccountLabel(a),
                },
            ]);
        }
    };

    const count = destinations.length;

    const renderAccountChip = (a: ISocialAccount, on: boolean) => {
        const dot = platformDotColor(a.platform, colors);
        const label = socialAccountLabel(a);
        const blocked = on ? blockedReasons?.get(a.id) : undefined;

        return (
            <View key={a.id} style={styles.chipWrap}>
                <Pressable
                    style={({ pressed }) => [
                        styles.accountChip,
                        on && styles.accountChipOn,
                        on && !!blocked && styles.accountChipBlocked,
                        pressed && styles.pressed,
                    ]}
                    onPress={() => toggle(a)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={
                        blocked
                            ? `Selected: ${label}. ${blocked}`
                            : `${on ? "Selected" : "Not selected"}: ${label}`
                    }
                >
                    {a.profileImageURL ? (
                        <Image source={{ uri: a.profileImageURL }} style={styles.accountAvatar} />
                    ) : (
                        <View style={[styles.accountAvatar, styles.accountAvatarFallback]}>
                            <Text style={styles.accountInitial}>
                                {(label || "?").charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.platformDot, { backgroundColor: dot }]} />
                    <Text style={[styles.accountName, on && styles.accountNameOn]} numberOfLines={1}>
                        {label}
                    </Text>
                    {/* Solid circle + brand-coloured glyph — reads as selected at a
                        glance, and needs no alpha maths to stay visible. */}
                    <View style={[styles.selectMark, on && styles.selectMarkOn]}>
                        <FontAwesomeIcon
                            icon={on ? faCheck : faCirclePlus}
                            size={on ? 10 : 13}
                            color={on ? colors.primary : colors.textSecondary}
                        />
                    </View>
                </Pressable>
                {blocked ? (
                    <View style={styles.blockedRow}>
                        <FontAwesomeIcon
                            icon={faTriangleExclamation}
                            size={9}
                            color={colors.errorBannerText}
                        />
                        <Text style={styles.blockedText}>{blocked}</Text>
                    </View>
                ) : null}
            </View>
        );
    };

    return (
        <View>
            <View style={styles.blockHead}>
                <Text style={styles.blockLabel}>Send to</Text>
                {accounts.length > 0 ? (
                    <Text style={[styles.countBadge, count > 0 && styles.countBadgeOn]}>
                        {count} selected
                    </Text>
                ) : null}
            </View>

            {accounts.length === 0 ? (
                <Text style={styles.emptyAccounts}>
                    No connected accounts yet. Connect a social account (Instagram, Facebook,
                    LinkedIn, X, YouTube or Reddit) to publish.
                </Text>
            ) : (
                <>
                    <View style={styles.accountRow}>
                        {accounts.map((a) => renderAccountChip(a, isSelected(a.id)))}
                    </View>
                    {count === 0 ? (
                        <Text style={styles.pickHint}>
                            Tap an account to choose where this goes.
                        </Text>
                    ) : null}
                </>
            )}

            {/* ── Per-platform options ─────────────────────────────────────── */}
            {selectedPlatforms.has("youtube") && !hiddenSet.has("youtube") ? (
                <View style={styles.optionBlock}>
                    <Text style={styles.optionTitle}>YouTube</Text>
                    <TextInput
                        style={styles.optionInput}
                        placeholder="Video title"
                        placeholderTextColor={colors.textSecondary}
                        value={platformOptions.youtubeTitle ?? ""}
                        onChangeText={(t) => setOpt({ youtubeTitle: t })}
                        maxLength={100}
                    />
                    <View style={styles.visRow}>
                        {YT_VISIBILITY.map((v) => {
                            const on = (platformOptions.youtubePrivacy ?? "public") === v.value;
                            return (
                                <Pressable
                                    key={v.value}
                                    onPress={() => setOpt({ youtubePrivacy: v.value })}
                                    style={({ pressed }) => [
                                        styles.pillChip,
                                        on && styles.pillChipOn,
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <Text style={[styles.pillChipText, on && styles.pillChipTextOn]}>
                                        {v.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    <Text style={styles.optionHint}>
                        A video attachment is required. Vertical clips post as Shorts.
                    </Text>
                </View>
            ) : null}

            {selectedPlatforms.has("reddit") && !hiddenSet.has("reddit") ? (
                <View style={styles.optionBlock}>
                    <Text style={styles.optionTitle}>Reddit</Text>
                    <TextInput
                        style={styles.optionInput}
                        placeholder="Subreddit (e.g. startups)"
                        placeholderTextColor={colors.textSecondary}
                        value={platformOptions.redditSubreddit ?? ""}
                        onChangeText={(t) =>
                            setOpt({ redditSubreddit: t.replace(/^\/?r\//i, "").trim() })
                        }
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.optionInput}
                        placeholder="Post title"
                        placeholderTextColor={colors.textSecondary}
                        value={platformOptions.redditTitle ?? ""}
                        onChangeText={(t) => setOpt({ redditTitle: t })}
                        maxLength={300}
                    />
                    <TextInput
                        style={styles.optionInput}
                        placeholder="Flair ID (optional)"
                        placeholderTextColor={colors.textSecondary}
                        value={platformOptions.redditFlairId ?? ""}
                        onChangeText={(t) => setOpt({ redditFlairId: t })}
                        autoCapitalize="none"
                    />
                    <Text style={styles.optionHint}>
                        Subreddit &amp; title are required. Many subreddits enforce posting rules or
                        required flair.
                    </Text>
                </View>
            ) : null}

            {selectedPlatforms.has("twitter") && !hiddenSet.has("twitter") ? (
                <Text style={styles.optionHint}>
                    Captions over 280 characters post as a thread on X.
                </Text>
            ) : null}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        blockHead: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
        },
        blockLabel: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.textSecondary,
        },
        countBadge: {
            fontSize: fs(12),
            fontWeight: "700",
            color: colors.textSecondary,
            backgroundColor: colors.tag,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 11,
            overflow: "hidden",
        },
        countBadgeOn: {
            color: colors.onPrimary,
            backgroundColor: colors.primary,
        },
        emptyAccounts: {
            fontSize: fs(12),
            color: colors.textSecondary,
            lineHeight: lh(18),
        },
        accountRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        chipWrap: {
            alignItems: "flex-start",
        },
        accountChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingLeft: 6,
            paddingRight: 8,
            // 44pt touch target (24px avatar + 2x10 padding).
            paddingVertical: 10,
            borderRadius: 22,
            backgroundColor: colors.tag,
        },
        accountChipOn: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        accountChipBlocked: {
            opacity: 0.6,
        },
        accountAvatar: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.card,
        },
        accountAvatarFallback: {
            alignItems: "center",
            justifyContent: "center",
        },
        accountInitial: {
            fontSize: fs(11),
            fontWeight: "800",
            color: colors.primary,
        },
        platformDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginLeft: -2,
        },
        accountName: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.text,
            maxWidth: 120,
        },
        accountNameOn: {
            color: colors.onPrimary,
            fontWeight: "700",
        },
        selectMark: {
            width: 18,
            height: 18,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
        },
        selectMarkOn: {
            backgroundColor: colors.onPrimary,
        },
        blockedRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 4,
            paddingHorizontal: 6,
        },
        blockedText: {
            fontSize: fs(10),
            fontWeight: "600",
            color: colors.errorBannerText,
        },
        pickHint: {
            fontSize: fs(11),
            color: colors.textSecondary,
            marginTop: 8,
        },
        optionBlock: {
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.aliceBlue,
            gap: 8,
        },
        optionTitle: {
            fontSize: fs(12),
            fontWeight: "700",
            color: colors.textSecondary,
        },
        optionInput: {
            backgroundColor: colors.card,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: fs(14),
            color: colors.text,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        visRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        pillChip: {
            paddingHorizontal: 12,
            paddingVertical: 11,
            borderRadius: 9,
            backgroundColor: colors.tag,
        },
        pillChipOn: {
            backgroundColor: colors.primary,
        },
        pillChipText: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.textSecondary,
        },
        pillChipTextOn: {
            color: colors.onPrimary,
        },
        optionHint: {
            fontSize: fs(11),
            color: colors.textSecondary,
            lineHeight: lh(16),
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default DestinationPicker;
