/**
 * ReferenceTray — the slots above the prompt that hold CONTENT, not settings.
 *
 * Images to work in, a style reference, the video to cut. These sit above the
 * prompt rather than in the strip below it because they are things the user has
 * to supply: a setting has a sensible default and can be ignored, a missing
 * reference cannot. A required slot keeps send disabled until it is filled.
 *
 * Refs survive a change of approach. The composer holds them for every slot,
 * not just the visible ones, so tabbing away and back brings an attachment
 * straight back rather than quietly dropping it.
 */
import { fs, lh } from "@/constants/Typography";
import { useAWSContext } from "@/shared-libs/contexts/aws-context.provider";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { pickMedia, pickMediaMulti, PickedAsset } from "@/shared-libs/utils/media-picker";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import {
    faArrowUpFromBracket,
    faPlus,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { RefSlot } from "./approach-spec";

/** Everything the tray can hold, across every approach. */
export interface ComposerRefs {
    attachments?: Attachment[];
    reference?: Attachment;
    startFrame?: Attachment;
    endFrame?: Attachment;
    sourceVideo?: Attachment;
}

interface Props {
    slots: RefSlot[];
    refs: ComposerRefs;
    onChange: (next: ComposerRefs) => void;
    disabled?: boolean;
}

const thumbOf = (a: Attachment): string | null => a.imageUrl ?? null;

const ReferenceTray: React.FC<Props> = ({ slots, refs, onChange, disabled }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { uploadFileUri } = useAWSContext();

    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const upload = useCallback(
        (p: PickedAsset) =>
            uploadFileUri({
                id: p.assetId ?? p.uri,
                localUri: p.uri,
                uri: p.uri,
                type: p.type,
            }),
        [uploadFileUri]
    );

    const pick = useCallback(
        async (slot: RefSlot) => {
            setError(null);
            setBusy(slot.key);
            try {
                if (slot.multi) {
                    const picked = await pickMediaMulti("image");
                    if (!picked.length) return;
                    const uploaded = await Promise.all(picked.map(upload));
                    onChange({
                        ...refs,
                        attachments: [...(refs.attachments ?? []), ...uploaded],
                    });
                    return;
                }
                const kind = slot.key === "sourceVideo" ? "video" : "image";
                const picked = await pickMedia(kind);
                if (!picked) return;
                const uploaded = await upload(picked);
                onChange({ ...refs, [slot.key]: uploaded });
            } catch {
                setError("That didn't upload. Please try again.");
            } finally {
                setBusy(null);
            }
        },
        [refs, onChange, upload]
    );

    const removeAttachment = useCallback(
        (index: number) =>
            onChange({
                ...refs,
                attachments: (refs.attachments ?? []).filter((_, i) => i !== index),
            }),
        [refs, onChange]
    );

    const clearSlot = useCallback(
        (key: RefSlot["key"]) => onChange({ ...refs, [key]: undefined }),
        [refs, onChange]
    );

    if (!slots.length) return null;

    return (
        <View style={styles.wrap}>
            <View style={styles.row}>
                {slots.map((slot) => {
                    // A wide file row — a video is a filename and a duration, not a
                    // square thumbnail you can judge at 72px.
                    if (slot.upload) {
                        const held = refs[slot.key] as Attachment | undefined;
                        if (held) {
                            return (
                                <View key={slot.key} style={styles.fileRow}>
                                    <View style={styles.fileIcon}>
                                        <FontAwesomeIcon
                                            icon={faArrowUpFromBracket}
                                            size={14}
                                            color={colors.primary}
                                        />
                                    </View>
                                    <Text style={styles.fileName} numberOfLines={1}>
                                        {slot.label}
                                    </Text>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.fileClear,
                                            pressed && styles.pressed,
                                        ]}
                                        onPress={() => clearSlot(slot.key)}
                                        disabled={disabled}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Remove ${slot.label}`}
                                    >
                                        <FontAwesomeIcon
                                            icon={faXmark}
                                            size={12}
                                            color={colors.textSecondary}
                                        />
                                    </Pressable>
                                </View>
                            );
                        }
                        return (
                            <Pressable
                                key={slot.key}
                                style={({ pressed }) => [
                                    styles.fileRow,
                                    styles.fileRowEmpty,
                                    pressed && styles.pressed,
                                ]}
                                onPress={() => pick(slot)}
                                disabled={disabled || !!busy}
                                accessibilityRole="button"
                                accessibilityLabel={slot.label}
                            >
                                {busy === slot.key ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <FontAwesomeIcon
                                        icon={faArrowUpFromBracket}
                                        size={14}
                                        color={colors.textSecondary}
                                    />
                                )}
                                <Text style={styles.fileName}>{slot.label}</Text>
                                {slot.required ? (
                                    <Text style={styles.required}>Required</Text>
                                ) : null}
                            </Pressable>
                        );
                    }

                    // A stacking slot — the filled ones, then one "add another".
                    if (slot.multi) {
                        const held = refs.attachments ?? [];
                        return (
                            <React.Fragment key={slot.key}>
                                {held.map((a, i) => (
                                    <Pressable
                                        key={`${slot.key}-${i}`}
                                        style={({ pressed }) => [
                                            styles.tile,
                                            styles.tileFilled,
                                            pressed && styles.pressed,
                                        ]}
                                        onPress={() => removeAttachment(i)}
                                        disabled={disabled}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Remove image ${i + 1}`}
                                    >
                                        {thumbOf(a) ? (
                                            <Image
                                                source={{ uri: thumbOf(a)! }}
                                                style={styles.thumb}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={styles.thumbFallback} />
                                        )}
                                        <View style={styles.tileRemove}>
                                            <FontAwesomeIcon
                                                icon={faXmark}
                                                size={9}
                                                color={colors.onPrimary}
                                            />
                                        </View>
                                    </Pressable>
                                ))}
                                <Pressable
                                    style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
                                    onPress={() => pick(slot)}
                                    disabled={disabled || !!busy}
                                    accessibilityRole="button"
                                    accessibilityLabel={held.length ? "Add another image" : slot.label}
                                >
                                    {busy === slot.key ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <FontAwesomeIcon
                                            icon={faPlus}
                                            size={13}
                                            color={colors.textSecondary}
                                        />
                                    )}
                                    <Text style={styles.tileLabel} numberOfLines={2}>
                                        {held.length ? "Add another" : slot.label}
                                    </Text>
                                </Pressable>
                            </React.Fragment>
                        );
                    }

                    // A single slot — a reference, a keyframe.
                    const held = refs[slot.key] as Attachment | undefined;
                    return (
                        <Pressable
                            key={slot.key}
                            style={({ pressed }) => [
                                styles.tile,
                                held && styles.tileFilled,
                                pressed && styles.pressed,
                            ]}
                            onPress={() => (held ? clearSlot(slot.key) : pick(slot))}
                            disabled={disabled || !!busy}
                            accessibilityRole="button"
                            accessibilityLabel={held ? `Remove ${slot.label}` : slot.label}
                        >
                            {held && thumbOf(held) ? (
                                <>
                                    <Image
                                        source={{ uri: thumbOf(held)! }}
                                        style={styles.thumb}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.tileRemove}>
                                        <FontAwesomeIcon
                                            icon={faXmark}
                                            size={9}
                                            color={colors.onPrimary}
                                        />
                                    </View>
                                </>
                            ) : (
                                <>
                                    {busy === slot.key ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <FontAwesomeIcon
                                            icon={faPlus}
                                            size={13}
                                            color={colors.textSecondary}
                                        />
                                    )}
                                    <Text style={styles.tileLabel} numberOfLines={2}>
                                        {slot.label}
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    );
                })}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
};

const useStyles = (colors: any) =>
    React.useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    marginBottom: 10,
                },
                row: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                },
                tile: {
                    width: 82,
                    height: 82,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: 6,
                    overflow: "hidden",
                },
                tileFilled: {
                    backgroundColor: withAlpha(colors.primary, 0.1),
                },
                tileLabel: {
                    fontSize: fs(10),
                    lineHeight: lh(13),
                    fontWeight: "600",
                    color: colors.textSecondary,
                    textAlign: "center",
                },
                thumb: {
                    ...StyleSheet.absoluteFillObject,
                },
                thumbFallback: {
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: colors.tag,
                },
                tileRemove: {
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.backdropStrong,
                },
                fileRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 9,
                    flexGrow: 1,
                    flexBasis: 240,
                    minHeight: 50,
                    paddingVertical: 8,
                    paddingHorizontal: 11,
                    borderRadius: 10,
                    backgroundColor: withAlpha(colors.primary, 0.1),
                },
                fileRowEmpty: {
                    backgroundColor: colors.tag,
                },
                fileIcon: {
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: withAlpha(colors.primary, 0.14),
                },
                fileName: {
                    flex: 1,
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    fontWeight: "600",
                    color: colors.text,
                },
                required: {
                    fontSize: fs(10),
                    lineHeight: lh(13),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                fileClear: {
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                },
                error: {
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    color: colors.toastError,
                    marginTop: 6,
                },
                pressed: {
                    opacity: 0.75,
                },
            }),
        [colors]
    );

export default ReferenceTray;
