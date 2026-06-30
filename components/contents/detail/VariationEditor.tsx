/**
 * VariationEditor — the editor shown when a platform variation tab is active.
 *
 * Composes:
 *  • an override-aware Caption (and Hashtags, where the platform supports them):
 *    shows the value inherited live from Generic until the user edits it, then
 *    flags it "Overridden" with a one-tap "Reset to Generic";
 *  • the platform's registry-driven option fields (YouTube title, Reddit
 *    subreddit/flair, LinkedIn visibility, …), with the Twitter thread composer.
 *
 * Media stays shared from the Generic tab in this first pass (surfaced via a
 * note), so this editor only owns caption / hashtags / platform options.
 */
import PlatformOptionsSection from "@/components/contents/detail/platform-fields/PlatformOptionsSection";
import { ContentVariation } from "@/hooks/use-content-variations";
import { Platform, PlatformEnum } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import { variationSpecForPlatform } from "@/shared-libs/firestore/trendly-pro/constants/platform-fields";
import { IPlatformOptions } from "@/shared-libs/firestore/trendly-pro/models/contents";
import {
    isFieldOverridden,
    VariationOverridableField,
} from "@/shared-libs/firestore/trendly-pro/models/variations";
import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import Colors from "@/shared-uis/constants/Colors";
import {
    faArrowRotateLeft,
    faCircleInfo,
    faLink,
    faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
    platform: Platform;
    variation: ContentVariation | undefined;
    genericCaption: string;
    genericHashtags: string;
    onSetOverride: (field: VariationOverridableField, value: string) => void;
    onResetField: (field: VariationOverridableField) => void;
    onSetPlatformOptions: (patch: Partial<IPlatformOptions>) => void;
    onDelete: () => void;
    disabled?: boolean;
}

const VariationEditor: React.FC<Props> = ({
    platform,
    variation,
    genericCaption,
    genericHashtags,
    onSetOverride,
    onResetField,
    onSetPlatformOptions,
    onDelete,
    disabled,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const spec = variationSpecForPlatform(platform);
    const meta = SOCIAL_PLATFORM_MAP[platform];
    const options = variation?.platformOptions ?? {};
    const showHashtags = platform !== PlatformEnum.Reddit;

    const captionOverridden = isFieldOverridden(variation, "caption");
    const hashtagsOverridden = isFieldOverridden(variation, "hashtags");
    const captionValue = captionOverridden ? variation?.caption ?? "" : genericCaption;
    const hashtagsValue = hashtagsOverridden ? variation?.hashtags ?? "" : genericHashtags;

    const renderOverrideField = (
        field: "caption" | "hashtags",
        label: string,
        value: string,
        overridden: boolean,
        placeholder: string,
        opts: { multiline?: boolean; maxLen?: number } = {}
    ) => (
        <View style={styles.section}>
            <View style={styles.fieldHead}>
                <Text style={styles.sectionLabel}>{label}</Text>
                {overridden ? (
                    <View style={styles.headActions}>
                        <View style={styles.badgeOverride}>
                            <Text style={styles.badgeOverrideText}>Overridden</Text>
                        </View>
                        <Pressable
                            onPress={() => !disabled && onResetField(field)}
                            style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel={`Reset ${label} to Generic`}
                            hitSlop={8}
                        >
                            <FontAwesomeIcon icon={faArrowRotateLeft} size={10} color={colors.primary} />
                            <Text style={styles.resetText}>Reset to Generic</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.badgeInherit}>
                        <FontAwesomeIcon icon={faLink} size={9} color={colors.textSecondary} />
                        <Text style={styles.badgeInheritText}>Inherited</Text>
                    </View>
                )}
            </View>
            <View style={[styles.card, overridden && styles.cardOverridden]}>
                {overridden ? <View style={styles.accentStripe} /> : null}
                <TextInput
                    style={[styles.input, styles.inputFlex, opts.multiline && styles.textarea]}
                    value={value}
                    editable={!disabled}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={(t) => onSetOverride(field, t)}
                    multiline={opts.multiline}
                    textAlignVertical={opts.multiline ? "top" : "center"}
                    maxLength={opts.maxLen}
                />
            </View>
            {!overridden ? (
                <Text style={styles.inheritHint}>
                    Editing this overrides it for {meta?.label ?? platform} only. Generic changes still
                    flow in until you do.
                </Text>
            ) : null}
        </View>
    );

    return (
        <View>
            {/* Platform header + delete */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    {meta ? (
                        <View style={[styles.platformDot, { backgroundColor: colors[meta.colorKey] }]} />
                    ) : null}
                    <Text style={styles.headerTitle}>{meta?.label ?? platform} variation</Text>
                </View>
                <Pressable
                    onPress={() => !disabled && onDelete()}
                    style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${meta?.label ?? platform} variation`}
                >
                    <FontAwesomeIcon icon={faTrashCan} size={12} color={colors.statusRejectedFg} />
                </Pressable>
            </View>

            {spec?.captionNote ? (
                <View style={styles.noteRow}>
                    <FontAwesomeIcon icon={faCircleInfo} size={11} color={colors.textSecondary} />
                    <Text style={styles.noteText}>{spec.captionNote}</Text>
                </View>
            ) : null}

            {renderOverrideField(
                "caption",
                spec?.captionLabel?.toUpperCase() ?? "CAPTION",
                captionValue,
                captionOverridden,
                `Write the ${meta?.label ?? platform} version…`,
                { multiline: true, maxLen: spec?.captionMaxLen }
            )}

            {showHashtags
                ? renderOverrideField(
                      "hashtags",
                      "HASHTAGS",
                      hashtagsValue,
                      hashtagsOverridden,
                      "#YourBrand #Product #Niche",
                      { maxLen: 500 }
                  )
                : null}

            {/* Platform-specific options */}
            {spec && spec.fields.length > 0 ? (
                <View style={styles.section}>
                    <PlatformOptionsSection
                        platform={platform}
                        options={options}
                        onChange={onSetPlatformOptions}
                        sourceCaption={captionValue}
                        disabled={disabled}
                    />
                </View>
            ) : null}

            <View style={styles.mediaNote}>
                <FontAwesomeIcon icon={faCircleInfo} size={11} color={colors.textSecondary} />
                <Text style={styles.noteText}>
                    Media is shared from the Generic tab. Edit it there to update every platform.
                </Text>
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        headerRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
        },
        headerLeft: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        platformDot: {
            width: 10,
            height: 10,
            borderRadius: 5,
        },
        headerTitle: {
            fontSize: 15,
            fontWeight: "800",
            color: colors.text,
        },
        deleteBtn: {
            width: 32,
            height: 32,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        noteRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 7,
            marginBottom: 16,
            paddingHorizontal: 2,
        },
        noteText: {
            flex: 1,
            fontSize: 11,
            color: colors.textSecondary,
            lineHeight: 16,
        },
        section: {
            marginBottom: 20,
        },
        fieldHead: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
        },
        sectionLabel: {
            fontSize: 12,
            fontWeight: "800",
            color: colors.textSecondary,
            letterSpacing: 0.5,
        },
        headActions: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        badgeOverride: {
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 10,
            backgroundColor: colors.primary,
        },
        badgeOverrideText: {
            fontSize: 10,
            fontWeight: "800",
            color: colors.onPrimary,
        },
        badgeInherit: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        badgeInheritText: {
            fontSize: 10,
            fontWeight: "700",
            color: colors.textSecondary,
        },
        resetBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: colors.tag,
        },
        resetText: {
            fontSize: 11,
            fontWeight: "700",
            color: colors.primary,
        },
        card: {
            flexDirection: "row",
            alignItems: "stretch",
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 4,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        cardOverridden: {
            paddingLeft: 0,
        },
        accentStripe: {
            width: 4,
            borderRadius: 2,
            backgroundColor: colors.primary,
            marginRight: 8,
        },
        input: {
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 15,
            color: colors.text,
        },
        inputFlex: {
            flex: 1,
        },
        textarea: {
            minHeight: 110,
        },
        inheritHint: {
            fontSize: 11,
            color: colors.textSecondary,
            marginTop: 6,
            lineHeight: 15,
        },
        optionsCard: {
            backgroundColor: colors.aliceBlue,
            borderRadius: 12,
            padding: 14,
            gap: 16,
        },
        mediaNote: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 7,
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: colors.aliceBlue,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default VariationEditor;
