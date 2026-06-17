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
import { faCircleInfo, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// ─── ContentInfoModal ─────────────────────────────────────────────────────────
// Title, idea/vision and status live here instead of cluttering the page, so the
// page itself can stay focused on the content, caption and hashtags. Opened from
// the info button in the page header.

export interface ContentInfoModalProps {
    visible: boolean;
    title: string;
    idea: string;
    status: ContentStatus;
    typeLabel: string;
    /** Content format — drives which platforms are selectable. */
    contentType: ContentFormat;
    /** Platforms this content is planned for (publishing intent). */
    platforms: Platform[];
    onChangeTitle: (v: string) => void;
    onChangeIdea: (v: string) => void;
    onChangeStatus: (s: ContentStatus) => void;
    onChangePlatforms: (next: Platform[]) => void;
    onClose: () => void;
    /** When true, status/title/idea/platforms are locked (content is scheduled or posted). */
    readOnly?: boolean;
}

const ContentInfoModal: React.FC<ContentInfoModalProps> = ({
    visible,
    title,
    idea,
    status,
    typeLabel,
    contentType,
    platforms,
    onChangeTitle,
    onChangeIdea,
    onChangeStatus,
    onChangePlatforms,
    onClose,
    readOnly = false,
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
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close content details"
                />
                <View style={styles.sheet} accessibilityViewIsModal>
                    <View style={styles.header}>
                        <View style={styles.headIcon}>
                            <FontAwesomeIcon icon={faCircleInfo} size={15} color={colors.primary} />
                        </View>
                        <View style={styles.headText}>
                            <Text style={styles.title}>Content details</Text>
                            <Text style={styles.subtitle}>{typeLabel}</Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            hitSlop={8}
                        >
                            <FontAwesomeIcon icon={faXmark} size={16} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <ScrollView
                        style={styles.body}
                        contentContainerStyle={styles.bodyContent}
                        keyboardShouldPersistTaps="handled"
                    >
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
                    </ScrollView>

                    <View style={styles.footer}>
                        <Pressable
                            style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
                            onPress={onClose}
                            accessibilityRole="button"
                            accessibilityLabel="Done"
                        >
                            <Text style={styles.doneText}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: colors.backdrop,
            alignItems: "center",
            justifyContent: xl ? "center" : "flex-end",
            padding: xl ? 20 : 0,
        },
        sheet: {
            width: "100%",
            maxWidth: 480,
            maxHeight: "86%",
            backgroundColor: colors.card,
            borderRadius: xl ? 18 : 20,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.18,
            elevation: 14,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 12,
        },
        headIcon: {
            width: 32,
            height: 32,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.aliceBlue,
        },
        headText: {
            flex: 1,
        },
        title: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
            marginTop: 1,
        },
        closeBtn: {
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        body: {
            flexGrow: 0,
        },
        bodyContent: {
            paddingHorizontal: 18,
            paddingBottom: 8,
        },
        label: {
            fontSize: 13,
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
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 17,
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
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        platformChipTextActive: {
            color: colors.primary,
            fontWeight: "700",
        },
        lockNote: {
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 17,
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
            fontSize: 13,
        },
        input: {
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 14,
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
        footer: {
            paddingHorizontal: 18,
            paddingTop: 12,
            paddingBottom: 18,
        },
        doneBtn: {
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        doneText: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default ContentInfoModal;
