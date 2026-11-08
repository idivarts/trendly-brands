/**
 * CastSheet — who and where, with one approved still each.
 *
 * ── Why a cast exists at all ────────────────────────────────────────────────
 * "The founder, mid-thirties, navy jumper" typed into six prompts produces six
 * different people, because each generation reads the description freshly. A
 * cast member is a record so the `look` is appended to every prompt WORD FOR
 * WORD, and so one approved still can be the reference for every clip — which
 * is the only thing that actually holds a face.
 *
 * ── Why `look` is required ──────────────────────────────────────────────────
 * It is the string that travels. Without it there is nothing holding the clips
 * together but a description, which is the failure this whole mechanism exists
 * to prevent — so the field is refused empty rather than defaulted.
 */
import { fs, lh, fbox } from "@/constants/Typography";
import { ICastMember, IStudioLocation } from "@/shared-libs/firestore/trendly-pro/models/studio";
import { IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { faImage, faPlus, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export interface CastSheetProps {
    visible: boolean;
    cast: ICastMember[];
    locations: IStudioLocation[];
    media: Record<string, IAsset>;
    busy?: boolean;

    onClose: () => void;
    onSaveCast: (cast: ICastMember[]) => void;
    /** Opens the media picker to choose an anchor still for this member. */
    onPickAnchor: (castId: string) => void;
    error?: string | null;
}

const CastSheet: React.FC<CastSheetProps> = ({
    visible,
    cast,
    media,
    busy,
    onClose,
    onSaveCast,
    onPickAnchor,
    error,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const [description, setDescription] = useState("");
    const [look, setLook] = useState("");

    const add = () => {
        const d = description.trim();
        const l = look.trim();
        if (!d || !l) return;
        const id = `c_${d.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 20)}_${Date.now()
            .toString(36)
            .slice(-4)}`;
        onSaveCast([...cast, { id, description: d, look: l }]);
        setDescription("");
        setLook("");
    };

    const remove = (id: string) => onSaveCast(cast.filter((m) => m.id !== id));

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Cast</Text>
                        <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
                            <FontAwesomeIcon icon={faXmark} size={14} color={colors.text} />
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={styles.body}>
                        {cast.length === 0 ? (
                            <Text style={styles.note}>
                                Nobody yet. Add anyone who appears in more than one generated clip —
                                that is when a face starts drifting.
                            </Text>
                        ) : (
                            cast.map((m) => {
                                const anchor = m.anchorMediaId ? media[m.anchorMediaId] : undefined;
                                return (
                                    <View key={m.id} style={styles.row}>
                                        <Pressable
                                            style={styles.anchor}
                                            onPress={() => onPickAnchor(m.id)}
                                            disabled={busy}
                                        >
                                            {anchor?.thumbUrl || anchor?.url ? (
                                                <Image
                                                    source={{ uri: anchor.thumbUrl || anchor.url }}
                                                    resizeMode="cover"
                                                    style={styles.anchorImage}
                                                />
                                            ) : (
                                                <View style={[styles.anchorImage, styles.anchorEmpty]}>
                                                    <FontAwesomeIcon
                                                        icon={faImage}
                                                        size={14}
                                                        color={colors.textSecondary}
                                                    />
                                                </View>
                                            )}
                                        </Pressable>
                                        <View style={styles.rowBody}>
                                            <Text style={styles.rowTitle} numberOfLines={1}>
                                                {m.description}
                                            </Text>
                                            <Text style={styles.rowLook} numberOfLines={2}>
                                                {m.look}
                                            </Text>
                                            <Text style={styles.note}>
                                                {m.anchorMediaId
                                                    ? "Anchored — every clip references this still."
                                                    : "No anchor. Fine for up to two clips; above that each one invents its own face."}
                                            </Text>
                                        </View>
                                        <Pressable
                                            style={styles.icon}
                                            onPress={() => remove(m.id)}
                                            disabled={busy}
                                            hitSlop={4}
                                        >
                                            <FontAwesomeIcon icon={faTrash} size={11} color={colors.red} />
                                        </Pressable>
                                    </View>
                                );
                            })
                        )}

                        <Text style={styles.label}>Add someone</Text>
                        <TextInput
                            style={styles.input}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Who they are — 'the founder'"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <TextInput
                            style={styles.input}
                            value={look}
                            onChangeText={setLook}
                            placeholder="How they look — hair, clothing, age"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                        />
                        {/* Stated because it explains why the field is
                            required and why it should not be rewritten later. */}
                        <Text style={styles.note}>
                            This description is added to every prompt word for word. Changing it
                            later changes how they look in clips made after that.
                        </Text>
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <Pressable
                            style={[
                                styles.primary,
                                (!description.trim() || !look.trim()) && styles.off,
                            ]}
                            onPress={add}
                            disabled={!description.trim() || !look.trim() || busy}
                        >
                            <FontAwesomeIcon icon={faPlus} size={12} color={colors.white} />
                            <Text style={styles.primaryText}>Add to the cast</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    useMemo(
        () =>
            StyleSheet.create({
                backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
                sheet: {
                    maxHeight: "86%",
                    backgroundColor: colors.background,
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                    padding: 16,
                    gap: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -6 },
                    shadowRadius: 18,
                    shadowOpacity: 0.18,
                    elevation: 12,
                },
                header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
                title: { color: colors.text, fontSize: fs(16), lineHeight: lh(22), fontWeight: "700" },
                close: {
                    width: fbox(30),
                    height: fbox(30),
                    borderRadius: 15,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                body: { gap: 10, paddingBottom: 20 },
                row: {
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "flex-start",
                    backgroundColor: colors.tag,
                    borderRadius: 12,
                    padding: 10,
                },
                anchor: { width: fbox(52), height: fbox(52), borderRadius: 10, overflow: "hidden" },
                anchorImage: { width: "100%", height: "100%" },
                anchorEmpty: {
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: withAlpha(colors.text, 0.08),
                },
                rowBody: { flex: 1, gap: 2 },
                rowTitle: { color: colors.text, fontSize: fs(13), lineHeight: lh(18), fontWeight: "600" },
                rowLook: { color: colors.text, fontSize: fs(11), lineHeight: lh(16) },
                icon: {
                    width: fbox(26),
                    height: fbox(26),
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: withAlpha(colors.red, 0.1),
                },
                label: {
                    marginTop: 6,
                    color: colors.textSecondary,
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                },
                input: {
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 11,
                    paddingVertical: 10,
                    color: colors.text,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                },
                note: { color: colors.textSecondary, fontSize: fs(10), lineHeight: lh(15) },
                error: { color: colors.red, fontSize: fs(11), lineHeight: lh(16) },
                off: { opacity: 0.45 },
                primary: {
                    alignSelf: "flex-start",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    borderRadius: 10,
                    minHeight: 44,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                primaryText: { color: colors.white, fontSize: fs(12), lineHeight: lh(17), fontWeight: "600" },
            }),
        [colors]
    );

export default CastSheet;
