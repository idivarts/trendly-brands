/**
 * "Put something here" — the bar that opens where you tapped a row.
 *
 * ── Why a bar and not a modal ─────────────────────────────────────────────
 * The whole point of adding on the timeline is that you have just pointed
 * at a moment. A modal covers the timeline, so the moment you pointed at is
 * the one thing you can no longer see while deciding what to put there. The
 * bar sits under the rows and names the moment and the row in words, so the
 * choice is made in front of the thing it is about.
 *
 * Two ways in, because they are different intentions: a file the film
 * already holds goes on immediately, and a description is a request the
 * next preview fetches. Said plainly rather than blurred into one "add"
 * button that behaves differently depending on what you typed.
 */
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { assetFitsRow, dropTypeFor } from "./timeline-drag";

/** A file the project already holds, as the media panel lists them. */
export interface TimelineAsset {
    path: string;
    name: string;
    /** "image" or "audio". */
    kind: string;
}

export interface TimelineAddTarget {
    trackIndex: number;
    /** The row's name, for saying where this is going. */
    rowLabel: string;
    /** The row's dominant kind, which decides what a drop declares. */
    rowKind: string;
    atMs: number;
}

export interface TimelineAddBarProps {
    target: TimelineAddTarget;
    assets: TimelineAsset[];
    busy?: boolean;
    onClose: () => void;
    onPlaceAsset: (assetPath: string, type: string) => void;
    onAskFor: (intent: string, type: string) => void;
}

const TimelineAddBar: React.FC<TimelineAddBarProps> = ({
    target,
    assets,
    busy,
    onClose,
    onPlaceAsset,
    onAskFor,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const [intent, setIntent] = useState("");

    const type = dropTypeFor(target.rowKind);
    // Only the files that can go on this row. A sound offered for a
    // picture row is a choice that cannot work, and finding that out by
    // picking it is worse than not being offered it.
    const usable = useMemo(
        () => assets.filter((a) => assetFitsRow(a.kind, target.rowKind)),
        [assets, target.rowKind]
    );

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Text style={styles.where} numberOfLines={1}>
                    {target.rowLabel} · {clock(target.atMs)}
                </Text>
                <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
                    <Text style={styles.close}>Done</Text>
                </Pressable>
            </View>

            {usable.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.files}>
                    {usable.map((a) => (
                        <Pressable
                            key={a.path}
                            disabled={busy}
                            onPress={() => onPlaceAsset(a.path, type)}
                            style={[styles.chip, busy && styles.chipBusy]}
                            accessibilityRole="button"
                            accessibilityLabel={`Put ${a.name} here`}
                        >
                            <Text style={styles.chipLabel} numberOfLines={1}>
                                {a.name}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}

            <View style={styles.askRow}>
                <TextInput
                    value={intent}
                    onChangeText={setIntent}
                    editable={!busy}
                    placeholder={placeholderFor(type)}
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    returnKeyType="go"
                    onSubmitEditing={() => {
                        const words = intent.trim();
                        if (words) onAskFor(words, type);
                    }}
                />
                <Pressable
                    disabled={busy || intent.trim() === ""}
                    onPress={() => onAskFor(intent.trim(), type)}
                    style={[styles.ask, (busy || intent.trim() === "") && styles.askOff]}
                    accessibilityRole="button"
                >
                    <Text style={styles.askLabel}>Ask for it</Text>
                </Pressable>
            </View>
            <Text style={styles.note}>
                A file goes on now. Something described is fetched the next time this
                film is previewed or rendered.
            </Text>
        </View>
    );
};

export default TimelineAddBar;

/** What to suggest typing, in the terms of the row they tapped. */
function placeholderFor(type: string): string {
    switch (type) {
        case "bgm":
            return "upbeat lo-fi, no vocals";
        case "sfx":
            return "a soft shutter click";
        case "voice":
            return "say: cold brew, cold mornings";
        default:
            return "cold brew poured over ice";
    }
}

function clock(ms: number): string {
    const total = Math.max(0, Math.round(ms / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                root: {
                    backgroundColor: colors.tag,
                    borderRadius: 12,
                    marginHorizontal: 12,
                    marginTop: 8,
                    padding: 10,
                    gap: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
                where: {
                    flex: 1,
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    fontWeight: "700",
                    color: colors.text,
                },
                close: {
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    fontWeight: "600",
                    color: colors.primary,
                    paddingHorizontal: 6,
                },
                files: { flexGrow: 0 },
                chip: {
                    backgroundColor: withAlpha(colors.primary, 0.14),
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    marginRight: 6,
                    maxWidth: 170,
                },
                chipBusy: { opacity: 0.5 },
                chipLabel: { fontSize: fs(10), lineHeight: lh(14), color: colors.text },
                askRow: { flexDirection: "row", alignItems: "center", gap: 8 },
                input: {
                    flex: 1,
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    color: colors.text,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                ask: {
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 10,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                askOff: { opacity: 0.45, shadowOpacity: 0 },
                askLabel: {
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                note: { fontSize: fs(9), lineHeight: lh(13), color: colors.textSecondary },
            }),
        [colors]
    );
}
