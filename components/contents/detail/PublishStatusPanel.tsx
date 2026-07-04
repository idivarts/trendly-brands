import { ContentStatus } from "@/components/contents/types";
import {
    ISocialAccount,
    socialAccountLabel,
} from "@/contexts/brand-social-context.provider";
import { IContentPublishResult } from "@/shared-libs/firestore/trendly-pro/models/contents";
import Colors from "@/shared-uis/constants/Colors";
import {
    faArrowUpRightFromSquare,
    faCircleCheck,
    faCircleExclamation,
    faLink,
    faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

// ─── PublishStatusPanel ─────────────────────────────────────────────────────
// Per-social publish outcome, shown on the content-detail screen while a
// publish-now job runs and after it settles. One row per targeted destination:
// live spinner → published (with a link) or failed (with a human error + the
// right recovery action). Failed rows sort to the top; successes stay quiet.

// Brand colour for a platform's dot indicator (mirrors PostingSummary).
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

const PLATFORM_LABEL: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    linkedin_page: "LinkedIn Page",
    twitter: "X (Twitter)",
    youtube: "YouTube",
    reddit: "Reddit",
};

// Failed first (needs attention), then in-flight, then done.
const STATUS_RANK: Record<string, number> = {
    failed: 0,
    publishing: 1,
    published: 2,
    skipped: 3,
};

export interface PublishStatusPanelProps {
    results: IContentPublishResult[];
    socialAccounts: ISocialAccount[];
    /** Overall content status (drives the header summary line). */
    overallStatus: ContentStatus;
    /** Re-publish every failed destination. */
    onRetry: () => void;
    /** True while a retry request is in flight. */
    retrying?: boolean;
    /** Route to Connected Accounts (for auth-kind failures). */
    onReconnect?: () => void;
}

const PublishStatusPanel: React.FC<PublishStatusPanelProps> = ({
    results,
    socialAccounts,
    overallStatus,
    onRetry,
    retrying = false,
    onReconnect,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    // Drop "skipped" (untargeted) rows — noise — then order failures first.
    const rows = useMemo(
        () =>
            results
                .filter((r) => r.status !== "skipped")
                .slice()
                .sort(
                    (a, b) =>
                        (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9)
                ),
        [results]
    );

    const counts = useMemo(() => {
        let published = 0;
        let failed = 0;
        let publishing = 0;
        for (const r of rows) {
            if (r.status === "published") published++;
            else if (r.status === "failed") failed++;
            else if (r.status === "publishing") publishing++;
        }
        return { published, failed, publishing, total: rows.length };
    }, [rows]);

    const inFlight = overallStatus === "publishing" || counts.publishing > 0;

    const summary = useMemo(() => {
        const parts: string[] = [];
        if (counts.published > 0) parts.push(`${counts.published} published`);
        if (counts.publishing > 0) parts.push(`${counts.publishing} in progress`);
        if (counts.failed > 0) parts.push(`${counts.failed} failed`);
        return parts.join(" · ");
    }, [counts]);

    const accountFor = (r: IContentPublishResult) =>
        socialAccounts.find((a) => a.id === r.socialAccountId);

    if (rows.length === 0) return null;

    return (
        <View
            style={styles.card}
            accessibilityLiveRegion="polite"
            accessibilityLabel={`Publishing status: ${summary}`}
        >
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>Publishing status</Text>
                    {summary ? <Text style={styles.summary}>{summary}</Text> : null}
                </View>
                {counts.failed > 0 && !inFlight ? (
                    <Pressable
                        style={({ pressed }) => [styles.retryAllBtn, pressed && styles.pressed]}
                        onPress={onRetry}
                        disabled={retrying}
                        accessibilityRole="button"
                        accessibilityLabel="Retry all failed socials"
                    >
                        {retrying ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <FontAwesomeIcon icon={faRotateRight} size={12} color={colors.primary} />
                        )}
                        <Text style={styles.retryAllText}>
                            {retrying ? "Retrying…" : "Retry failed"}
                        </Text>
                    </Pressable>
                ) : inFlight ? (
                    <View style={styles.headerSpinner}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                ) : null}
            </View>

            <View style={styles.rows}>
                {rows.map((r, i) => {
                    const account = accountFor(r);
                    const name =
                        (account && socialAccountLabel(account)) ||
                        r.username ||
                        PLATFORM_LABEL[r.platform] ||
                        r.platform;
                    const platformName = PLATFORM_LABEL[r.platform] ?? r.platform;
                    const dot = platformDotColor(r.platform, colors);
                    const failed = r.status === "failed";
                    const key = `${r.socialAccountId ?? r.platform}-${i}`;

                    return (
                        <View
                            key={key}
                            style={[styles.row, failed && styles.rowFailed]}
                        >
                            <View style={styles.rowMain}>
                                <View style={[styles.platformDot, { backgroundColor: dot }]} />
                                <View style={styles.rowText}>
                                    <Text style={styles.rowName} numberOfLines={1}>
                                        {platformName}
                                    </Text>
                                    <Text style={styles.rowAccount} numberOfLines={1}>
                                        {name}
                                    </Text>
                                </View>

                                {/* Status indicator */}
                                {r.status === "published" ? (
                                    <View style={styles.statusWrap}>
                                        <FontAwesomeIcon icon={faCircleCheck} size={13} color={colors.success} />
                                        <Text style={[styles.statusText, { color: colors.success }]}>
                                            Published
                                        </Text>
                                    </View>
                                ) : r.status === "publishing" ? (
                                    <View style={styles.statusWrap}>
                                        <ActivityIndicator size="small" color={colors.textSecondary} />
                                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                                            Publishing…
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.statusWrap}>
                                        <FontAwesomeIcon icon={faCircleExclamation} size={13} color={colors.toastError} />
                                        <Text style={[styles.statusText, { color: colors.toastError }]}>
                                            Failed
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Failed: inline human error + recovery action */}
                            {failed ? (
                                <View style={styles.failBody}>
                                    {r.error ? (
                                        <Text style={styles.errorText}>{r.error}</Text>
                                    ) : null}
                                    {r.errorKind === "auth" && onReconnect ? (
                                        <Pressable
                                            style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}
                                            onPress={onReconnect}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Reconnect ${platformName}`}
                                        >
                                            <FontAwesomeIcon icon={faLink} size={11} color={colors.primary} />
                                            <Text style={styles.rowActionText}>Reconnect account</Text>
                                        </Pressable>
                                    ) : null}
                                </View>
                            ) : null}

                            {/* Published with a permalink */}
                            {r.status === "published" && r.url ? (
                                <Pressable
                                    style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}
                                    onPress={() => Linking.openURL(r.url as string)}
                                    accessibilityRole="link"
                                    accessibilityLabel={`View ${platformName} post`}
                                >
                                    <FontAwesomeIcon
                                        icon={faArrowUpRightFromSquare}
                                        size={11}
                                        color={colors.primary}
                                    />
                                    <Text style={styles.rowActionText}>View post</Text>
                                </Pressable>
                            ) : null}
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        card: {
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
        },
        headerLeft: {
            flex: 1,
            gap: 2,
        },
        title: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
        },
        summary: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        headerSpinner: {
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
        },
        retryAllBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            minHeight: 36,
            paddingHorizontal: 12,
            borderRadius: 9,
            backgroundColor: colors.aliceBlue,
        },
        retryAllText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.primary,
        },
        rows: {
            gap: 8,
        },
        row: {
            gap: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        rowFailed: {
            backgroundColor: colors.statusRejectedBg,
        },
        rowMain: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        platformDot: {
            width: 10,
            height: 10,
            borderRadius: 5,
        },
        rowText: {
            flex: 1,
            minWidth: 0,
        },
        rowName: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },
        rowAccount: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        statusWrap: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        statusText: {
            fontSize: 13,
            fontWeight: "600",
        },
        failBody: {
            gap: 8,
            paddingLeft: 20,
        },
        errorText: {
            fontSize: 12.5,
            lineHeight: 18,
            color: colors.statusRejectedFg,
        },
        rowAction: {
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 6,
            minHeight: 44,
            paddingRight: 8,
        },
        rowActionText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.primary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default PublishStatusPanel;
