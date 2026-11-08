/**
 * MediaPickerSheet — pick from everything the brand has ever made.
 *
 * ── Why this is the whole point of a media collection ───────────────────────
 * Before this, reusing a generated still meant downloading it and uploading it
 * again. Every image, clip, render and extracted frame now has a library row
 * from the moment its bytes exist, so "use the still I made last week as the
 * start frame" is a tap.
 *
 * Search looks at the PROMPT as well as the title, because a generation has no
 * filename anybody chose — the words it was asked to be are the only
 * description it has.
 */
import { fs, lh, fbox } from "@/constants/Typography";
import { IAsset, AssetKind } from "@/shared-libs/firestore/trendly-pro/models/asset";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { faArrowUpFromBracket, faFilm, faImage, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export interface MediaPickerSheetProps {
    visible: boolean;
    library: IAsset[];
    loading?: boolean;
    /** Restrict to one kind, when the slot only takes one. */
    kind?: AssetKind;
    onClose: () => void;
    onPick: (asset: IAsset) => void;
    /**
     * Upload something new.
     *
     * Offered INSIDE the picker rather than as a separate lane, because "use
     * one of mine or add a new one" is one decision. Whatever is uploaded
     * lands in this same list, so the next scene can reuse it.
     */
    onUpload?: () => void;
    uploading?: boolean;
}

const MediaPickerSheet: React.FC<MediaPickerSheetProps> = ({
    visible,
    library,
    loading,
    kind,
    onClose,
    onPick,
    onUpload,
    uploading,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const [query, setQuery] = useState("");

    const rows = useMemo(() => {
        const needles = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        return library.filter((a) => {
            if (kind && a.kind !== kind) return false;
            if (!needles.length) return true;
            // The same fields the backend searches, so typing here and asking
            // the AI for "the founder still" find the same row.
            const hay = [
                a.title,
                a.alt,
                a.origin?.prompt,
                a.origin?.model,
                a.origin?.kind,
                a.source,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return needles.every((n) => hay.includes(n));
        });
    }, [library, query, kind]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Your media</Text>
                        <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
                            <FontAwesomeIcon icon={faXmark} size={14} color={colors.text} />
                        </Pressable>
                    </View>

                    <TextInput
                        style={styles.search}
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search by what it is — 'founder desk', 'logo'…"
                        placeholderTextColor={colors.textSecondary}
                    />

                    {loading ? (
                        <View style={styles.loading}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    ) : rows.length === 0 ? (
                        <View style={styles.loading}>
                            <Text style={styles.empty}>
                                {library.length === 0
                                    ? "Nothing here yet. Anything you upload or generate lands here automatically."
                                    : "Nothing matches that."}
                            </Text>
                            {onUpload ? (
                                <Pressable style={styles.uploadBtn} onPress={onUpload} disabled={uploading}>
                                    <Text style={styles.uploadBtnText}>
                                        {uploading ? "Uploading…" : "Upload a file"}
                                    </Text>
                                </Pressable>
                            ) : null}
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.grid}>
                            {onUpload ? (
                                <Pressable style={styles.tile} onPress={onUpload} disabled={uploading}>
                                    <View style={[styles.tileImage, styles.uploadTile]}>
                                        {uploading ? (
                                            <ActivityIndicator color={colors.primary} />
                                        ) : (
                                            <FontAwesomeIcon
                                                icon={faArrowUpFromBracket}
                                                size={16}
                                                color={colors.primary}
                                            />
                                        )}
                                    </View>
                                    <Text style={styles.tileLabel}>
                                        {uploading ? "Uploading…" : "Upload a file"}
                                    </Text>
                                </Pressable>
                            ) : null}
                            {rows.map((a) => (
                                <Pressable key={a.id} style={styles.tile} onPress={() => onPick(a)}>
                                    {a.thumbUrl || a.url ? (
                                        <Image
                                            source={{ uri: a.thumbUrl || a.url }}
                                            resizeMode="cover"
                                            style={styles.tileImage}
                                        />
                                    ) : (
                                        <View style={[styles.tileImage, styles.tileEmpty]}>
                                            <FontAwesomeIcon
                                                icon={a.kind === "video" ? faFilm : faImage}
                                                size={16}
                                                color={colors.textSecondary}
                                            />
                                        </View>
                                    )}
                                    <Text style={styles.tileLabel} numberOfLines={2}>
                                        {a.title || a.origin?.prompt || a.kind}
                                    </Text>
                                    {a.noAiInput ? (
                                        // Said up front: this photo may be
                                        // placed but not fed to a model, and
                                        // finding that out at generation time
                                        // reads as a broken feature.
                                        <Text style={styles.tileNote}>Not usable as an AI reference</Text>
                                    ) : null}
                                </Pressable>
                            ))}
                        </ScrollView>
                    )}
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
                    maxHeight: "82%",
                    backgroundColor: colors.background,
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                    padding: 16,
                    gap: 12,
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
                search: {
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.text,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                },
                loading: { paddingVertical: 36, alignItems: "center" },
                empty: {
                    color: colors.textSecondary,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    textAlign: "center",
                    paddingHorizontal: 24,
                },
                grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 20 },
                tile: { width: 104, gap: 4 },
                tileImage: { width: 104, height: fbox(104), borderRadius: 10 },
                tileEmpty: {
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: withAlpha(colors.text, 0.06),
                },
                tileLabel: { color: colors.text, fontSize: fs(11), lineHeight: lh(15) },
                tileNote: { color: colors.textSecondary, fontSize: fs(10), lineHeight: lh(13) },
                uploadTile: {
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: withAlpha(colors.primary, 0.12),
                },
                uploadBtn: {
                    marginTop: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                uploadBtnText: {
                    color: colors.white,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    fontWeight: "600",
                },
            }),
        [colors]
    );

export default MediaPickerSheet;
