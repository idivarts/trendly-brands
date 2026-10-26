import {
    CONTENT_STATUS_LABELS,
    ContentStatus,
    EDITABLE_CONTENT_STATUSES,
    contentStatusColors,
} from "@/components/contents/types";
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import {
    ContentFormat,
    isFormatPlatformCompatible,
} from "@/shared-libs/firestore/trendly-pro/constants/content-format";
import { Platform } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { faArrowRight, faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { fs, lh } from "@/constants/Typography";

/**
 * ContentBriefFields — status, platforms, title, idea, pillars and the linked
 * strategy, edited in place.
 *
 * This was ContentInfoModal, reached from a small (i) in the page header. A
 * dialog is the right shape for a decision you make and dismiss; it is the
 * wrong one for the brief, which is reference material you consult WHILE
 * writing the post and amend as the idea moves. Behind a modal it was both
 * invisible and, once open, blocking — you could not look at the caption and
 * the idea that produced it at the same time.
 *
 * It now sits at the top of Overview, which is the tab for exactly this
 * material. Same fields, same handlers, no dialog.
 */
export interface ContentBriefFieldsProps {
    title: string;
    idea: string;
    status: ContentStatus;
    /** Content format — drives which platforms are selectable. */
    contentType: ContentFormat;
    /** Platforms this content is planned for (publishing intent). */
    platforms: Platform[];
    onChangeTitle: (v: string) => void;
    onChangeIdea: (v: string) => void;
    onChangeStatus: (s: ContentStatus) => void;
    onChangePlatforms: (next: Platform[]) => void;
    /** Scheduled or posted content: every field here is locked. */
    readOnly?: boolean;
    /** AI-write-only content pillar tags, shown read-only when present. */
    contentPillars?: string[];
    /** Display name of the linked strategy, resolved by the caller. */
    strategyName?: string;
    /** Id of the strategy this content was generated from, if any. */
    strategyId?: string;
    onOpenStrategy?: (strategyId: string) => void;
}

const ContentBriefFields: React.FC<ContentBriefFieldsProps> = ({
    title,
    idea,
    status,
    contentType,
    platforms,
    onChangeTitle,
    onChangeIdea,
    onChangeStatus,
    onChangePlatforms,
    readOnly = false,
    contentPillars,
    strategyName,
    strategyId,
    onOpenStrategy,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors, xl);

    const togglePlatform = (p: Platform) => {
        if (readOnly || !isFormatPlatformCompatible(contentType, p)) return;
        onChangePlatforms(
            platforms.includes(p)
                ? platforms.filter((x) => x !== p)
                : [...platforms, p]
        );
    };

    return (
        <View style={styles.card}>
            <Text style={styles.label} nativeID="ci-status">Status</Text>
            {readOnly ? (
                <>
                    <View style={styles.statusRow}>
                        {(() => {
                            const sc = contentStatusColors(status, colors);
                            return (
                                <View style={[styles.statusChip, { backgroundColor: sc.bg }]}>
                                    <Text style={[styles.statusChipText, { color: sc.fg, fontWeight: "700" }]}>
                                        {CONTENT_STATUS_LABELS[status]}
                                    </Text>
                                </View>
                            );
                        })()}
                    </View>
                    <Text style={[styles.lockNote, styles.mt8]}>
                        {status === "posted"
                            ? "This content has been posted and can no longer be edited."
                            : "This content is scheduled. Unschedule it to make changes."}
                    </Text>
                </>
            ) : (
            <View style={styles.statusRow} accessibilityLabel="Status" accessibilityRole="radiogroup">
                {EDITABLE_CONTENT_STATUSES.map((s) => {
                    const sc = contentStatusColors(s, colors);
                    const active = status === s;
                    return (
                        <Pressable
                            key={s}
                            style={({ pressed }) => [
                                styles.statusChip,
                                { backgroundColor: active ? sc.bg : colors.tag },
                                pressed && styles.pressed,
                            ]}
                            onPress={() => onChangeStatus(s)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: active }}
                            accessibilityLabel={CONTENT_STATUS_LABELS[s]}
                        >
                            <Text
                                style={[
                                    styles.statusChipText,
                                    {
                                        color: active ? sc.fg : colors.textSecondary,
                                        fontWeight: active ? "700" : "600",
                                    },
                                ]}
                            >
                                {CONTENT_STATUS_LABELS[s]}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
            )}

            <Text style={[styles.label, styles.mt18]} nativeID="ci-platforms">Platforms</Text>
            {readOnly ? (
                platforms.length > 0 ? (
                    <View style={styles.statusRow}>
                        {platforms.map((p) => (
                            <View key={p} style={[styles.platformChip, styles.platformChipActive]}>
                                <View
                                    style={[
                                        styles.platformDot,
                                        {
                                            backgroundColor:
                                                colors[SOCIAL_PLATFORM_MAP[p]?.colorKey] ??
                                                colors.textSecondary,
                                        },
                                    ]}
                                />
                                <Text style={[styles.platformChipText, styles.platformChipTextActive]}>
                                    {SOCIAL_PLATFORM_MAP[p]?.label ?? p}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.lockNote}>No platforms selected.</Text>
                )
            ) : (
                <>
                    <Text style={[styles.helperText, styles.mb8]}>
                        Where you plan to post this. Options not supported by this
                        content type are disabled.
                    </Text>
                    <View
                        style={styles.statusRow}
                        accessibilityLabel="Platforms"
                        accessibilityRole="list"
                    >
                        {SOCIAL_PLATFORMS.map((meta) => {
                            const p = meta.key as Platform;
                            const compatible = isFormatPlatformCompatible(contentType, p);
                            const selected = platforms.includes(p);
                            return (
                                <Pressable
                                    key={p}
                                    disabled={!compatible}
                                    style={({ pressed }) => [
                                        styles.platformChip,
                                        selected && styles.platformChipActive,
                                        !compatible && styles.platformChipDisabled,
                                        pressed && compatible && styles.pressed,
                                    ]}
                                    onPress={() => togglePlatform(p)}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked: selected, disabled: !compatible }}
                                    accessibilityLabel={SOCIAL_PLATFORM_MAP[p]?.label ?? meta.label}
                                >
                                    <View
                                        style={[
                                            styles.platformDot,
                                            {
                                                backgroundColor:
                                                    colors[SOCIAL_PLATFORM_MAP[p]?.colorKey] ??
                                                    colors.textSecondary,
                                            },
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.platformChipText,
                                            selected && styles.platformChipTextActive,
                                        ]}
                                    >
                                        {SOCIAL_PLATFORM_MAP[p]?.label ?? meta.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </>
            )}

            <Text style={[styles.label, styles.mt18]} nativeID="ci-title">Title</Text>
            <TextInput
                style={styles.input}
                placeholder="E.g. Founder Story Launch Reel"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={onChangeTitle}
                maxLength={120}
                editable={!readOnly}
                accessibilityLabel="Title"
                aria-labelledby="ci-title"
            />

            <Text style={[styles.label, styles.mt18]} nativeID="ci-idea">Idea / Vision</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the concept, mood, or key message…"
                placeholderTextColor={colors.textSecondary}
                value={idea}
                onChangeText={onChangeIdea}
                multiline
                maxLength={500}
                textAlignVertical="top"
                editable={!readOnly}
                accessibilityLabel="Idea or vision"
                aria-labelledby="ci-idea"
            />

            {!!contentPillars?.length && (
                <>
                    <Text style={[styles.label, styles.mt18]}>Content Pillars</Text>
                    <View style={styles.statusRow}>
                        {contentPillars.map((pillar) => (
                            <View key={pillar} style={[styles.platformChip, styles.platformChipActive]}>
                                <Text style={[styles.platformChipText, styles.platformChipTextActive]}>
                                    {pillar}
                                </Text>
                            </View>
                        ))}
                    </View>
                </>
            )}

            {!!strategyId && (
                <>
                    <Text style={[styles.label, styles.mt18]}>Strategy</Text>
                    <Pressable
                        style={({ pressed }) => [styles.strategyLink, pressed && styles.pressed]}
                        onPress={() => onOpenStrategy?.(strategyId)}
                        accessibilityRole="button"
                        accessibilityLabel={`Open strategy${strategyName ? `: ${strategyName}` : ""}`}
                    >
                        <FontAwesomeIcon icon={faLayerGroup} size={13} color={colors.primary} />
                        <Text style={styles.strategyLinkText} numberOfLines={1}>
                            {strategyName ?? "View strategy"}
                        </Text>
                        <FontAwesomeIcon icon={faArrowRight} size={11} color={colors.primary} />
                    </Pressable>
                </>
            )}
        </View>
    );
};

export default ContentBriefFields;

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        card: {
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: xl ? 18 : 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        label: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: 8,
        },
        mt18: {
            marginTop: 18,
        },
        mt8: {
            marginTop: 8,
        },
        mb8: {
            marginBottom: 8,
        },
        helperText: {
            fontSize: fs(12),
            color: colors.textSecondary,
            lineHeight: lh(17),
            marginTop: -2,
        },
        platformChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            minHeight: 44,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        platformChipActive: {
            backgroundColor: colors.aliceBlue,
        },
        platformChipDisabled: {
            opacity: 0.4,
        },
        platformDot: {
            width: 9,
            height: 9,
            borderRadius: 5,
        },
        platformChipText: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.textSecondary,
        },
        platformChipTextActive: {
            color: colors.primary,
            fontWeight: "700",
        },
        strategyLink: {
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: colors.tag,
            maxWidth: "100%",
        },
        strategyLinkText: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.primary,
            flexShrink: 1,
        },
        lockNote: {
            fontSize: fs(12),
            color: colors.textSecondary,
            lineHeight: lh(17),
        },
        statusRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        statusChip: {
            minHeight: 44,
            paddingHorizontal: 16,
            justifyContent: "center",
            borderRadius: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        statusChipText: {
            fontSize: fs(13),
        },
        input: {
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: fs(14),
            color: colors.text,
            minHeight: 48,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        textArea: {
            minHeight: 110,
            maxHeight: 200,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}
