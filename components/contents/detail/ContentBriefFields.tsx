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
import { faArrowRight, faLayerGroup, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { fs, lh } from "@/constants/Typography";
import BriefEditModal from "./BriefEditModal";

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
    const [editOpen, setEditOpen] = useState(false);

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
            {/* Title and idea READ as text, because that is what they are: the
                brief you glance at while writing the post. They were full form
                fields, which gave two always-live inputs the top of the card
                and made the brief look like something to fill in rather than
                something to consult. Editing is deliberate now — one pencil,
                one small dialog — and the fields below it are settings, which
                is why they stay directly editable. */}
            <View style={styles.briefHead}>
                <View style={styles.briefHeadText}>
                    <Text style={styles.briefTitle}>{title || "Untitled content"}</Text>
                    {idea ? (
                        <Text style={styles.briefIdea}>{idea}</Text>
                    ) : (
                        <Text style={[styles.briefIdea, styles.briefIdeaEmpty]}>
                            No idea or vision yet — add one so the AI knows what you are making.
                        </Text>
                    )}
                </View>
                {!readOnly ? (
                    <Pressable
                        onPress={() => setEditOpen(true)}
                        style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Edit the title and idea"
                        hitSlop={8}
                    >
                        <FontAwesomeIcon icon={faPenToSquare} size={14} color={colors.primary} />
                    </Pressable>
                ) : null}
            </View>

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

            {/* Provenance, not a peer of the fields above.
                Pillars and the strategy are read-only: where this content came
                from, glanced at occasionally and never acted on here except the
                one link. They each had an uppercase label and a full row, which
                gave them the same weight as Status — a claim the page could not
                support. Below a hairline, small, in one line. */}
            {contentPillars?.length || strategyId ? (
                <View style={styles.provenance}>
                    {strategyId ? (
                        <Pressable
                            style={({ pressed }) => [styles.provLink, pressed && styles.pressed]}
                            onPress={() => onOpenStrategy?.(strategyId)}
                            accessibilityRole="button"
                            accessibilityLabel={`Open strategy${strategyName ? `: ${strategyName}` : ""}`}
                        >
                            <FontAwesomeIcon icon={faLayerGroup} size={11} color={colors.primary} />
                            <Text style={styles.provLinkText} numberOfLines={1}>
                                {strategyName ?? "View strategy"}
                            </Text>
                            <FontAwesomeIcon icon={faArrowRight} size={9} color={colors.primary} />
                        </Pressable>
                    ) : null}
                    {contentPillars?.map((pillar) => (
                        <Text key={pillar} style={styles.provTag}>
                            {pillar}
                        </Text>
                    ))}
                </View>
            ) : null}

            <BriefEditModal
                visible={editOpen}
                title={title}
                idea={idea}
                onChangeTitle={onChangeTitle}
                onChangeIdea={onChangeIdea}
                onClose={() => setEditOpen(false)}
            />
        </View>
    );
};

export default ContentBriefFields;

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        // A hairline, where this codebase prefers shadows: inside one card a
        // shadow would read as a second card. This only separates a footnote
        // from the fields above it.
        provenance: {
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 18,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: colors.border ?? colors.tag,
        },
        provLink: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            maxWidth: "100%",
        },
        provLinkText: {
            fontSize: fs(12),
            lineHeight: lh(16),
            fontWeight: "600",
            color: colors.primary,
            flexShrink: 1,
        },
        provTag: {
            fontSize: fs(11.5),
            lineHeight: lh(15),
            color: colors.textSecondary,
            backgroundColor: colors.tag,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
            overflow: "hidden",
        },
        briefHead: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 18,
        },
        briefHeadText: {
            flex: 1,
        },
        briefTitle: {
            fontSize: fs(17),
            lineHeight: lh(23),
            fontWeight: "700",
            color: colors.text,
        },
        briefIdea: {
            fontSize: fs(13.5),
            lineHeight: lh(20),
            color: colors.textSecondary,
            marginTop: 5,
        },
        briefIdeaEmpty: {
            fontStyle: "italic",
        },
        editBtn: {
            width: 32,
            height: 32,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
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
