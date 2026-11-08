/**
 * LayerInspector — the selected layer inside the selected scene.
 *
 * Separate from the scene inspector because the two answer different questions.
 * A scene's settings are about TIME — how long, how it arrives, what is said
 * over it. A layer's are about SPACE and SOURCE — where it sits, how it fills
 * its slot, which part of the footage plays, how loud it is.
 *
 * ── Why the slot list is short ──────────────────────────────────────────────
 * Named slots, not coordinates. A layer placed by dragging gets "custom" and
 * keeps its rectangle; everything offered here is a named position, because a
 * layout built from named halves and quarters survives the canvas changing
 * shape — a 9:16 reel re-cut as a 1:1 post keeps its composition instead of
 * putting a caption off screen.
 */
import { fs, lh, fbox } from "@/constants/Typography";
import { IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";
import { IStudioLayer, LayerSlot } from "@/shared-libs/firestore/trendly-pro/models/studio";
import { slotLabel } from "@/shared-libs/design/studio-runtime";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { faArrowDown, faArrowUp, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * The slots offered in the UI.
 *
 * `custom` is absent on purpose: it is what a drag produces, not something to
 * choose from a list. The quarters are absent too — they exist for the planner
 * building a four-up grid, and offering nine options to a person placing one
 * clip is a menu rather than a decision.
 */
const SLOTS: LayerSlot[] = ["full", "left", "right", "top", "bottom", "pip-br", "pip-tr", "lower-third"];

const SPEEDS = [0.5, 1, 1.5, 2];

export interface LayerInspectorProps {
    layer: IStudioLayer;
    asset?: IAsset;
    index: number;
    total: number;
    busy?: boolean;

    onChange: (patch: Partial<IStudioLayer>) => void;
    onRemove: () => void;
    onMove: (delta: number) => void;
}

const LayerInspector: React.FC<LayerInspectorProps> = ({
    layer,
    asset,
    index,
    total,
    busy,
    onChange,
    onRemove,
    onMove,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const isVideo = asset?.kind === "video";
    const isStill = asset?.kind === "image";
    const sourceMs = asset?.durationMs ?? 0;

    return (
        <View style={styles.wrap}>
            <View style={styles.head}>
                <Text style={styles.title} numberOfLines={1}>
                    {layer.kind === "html" ? "Design layer" : asset?.title || "Media layer"}
                </Text>
                <View style={styles.headActions}>
                    {/* layers[0] is the base and later layers composite on top,
                        which is exactly how the renderer stacks them. Moving a
                        full-frame clip above type is the mistake this makes
                        visible. */}
                    <Pressable
                        style={[styles.icon, index === 0 && styles.iconOff]}
                        onPress={() => onMove(-1)}
                        disabled={index === 0 || busy}
                        hitSlop={4}
                    >
                        <FontAwesomeIcon icon={faArrowDown} size={10} color={colors.text} />
                    </Pressable>
                    <Pressable
                        style={[styles.icon, index === total - 1 && styles.iconOff]}
                        onPress={() => onMove(1)}
                        disabled={index === total - 1 || busy}
                        hitSlop={4}
                    >
                        <FontAwesomeIcon icon={faArrowUp} size={10} color={colors.text} />
                    </Pressable>
                    <Pressable style={styles.icon} onPress={onRemove} disabled={busy} hitSlop={4}>
                        <FontAwesomeIcon icon={faTrash} size={10} color={colors.red} />
                    </Pressable>
                </View>
            </View>

            <Text style={styles.label}>Where it sits</Text>
            <View style={styles.chips}>
                {SLOTS.map((slot) => {
                    const on = layer.slot === slot;
                    return (
                        <Pressable
                            key={slot}
                            style={[styles.chip, on && styles.chipOn]}
                            onPress={() => onChange({ slot })}
                            disabled={busy}
                        >
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>
                                {slotLabel(slot)}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
            {layer.slot === "custom" ? (
                <Text style={styles.note}>Placed by hand. Picking a slot above replaces that.</Text>
            ) : null}

            {layer.kind === "media" ? (
                <>
                    <Text style={styles.label}>How it fills the slot</Text>
                    <View style={styles.chips}>
                        {(["cover", "contain"] as const).map((fit) => {
                            const on = (layer.fit ?? "cover") === fit;
                            return (
                                <Pressable
                                    key={fit}
                                    style={[styles.chip, on && styles.chipOn]}
                                    onPress={() => onChange({ fit })}
                                    disabled={busy}
                                >
                                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                                        {fit === "cover" ? "Fill (crops)" : "Fit (letterboxes)"}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </>
            ) : null}

            {isVideo ? (
                <>
                    <Text style={styles.label}>
                        Which part plays
                        {sourceMs > 0 ? ` · the clip is ${(sourceMs / 1000).toFixed(1)}s` : ""}
                    </Text>
                    <View style={styles.chips}>
                        {[0, 1000, 2000, 5000].map((ms) => {
                            const on = (layer.trimInMs ?? 0) === ms;
                            // A trim beyond the clip would play nothing at all,
                            // so it is not offered.
                            const beyond = sourceMs > 0 && ms >= sourceMs;
                            return (
                                <Pressable
                                    key={ms}
                                    style={[styles.chip, on && styles.chipOn, beyond && styles.iconOff]}
                                    onPress={() => onChange({ trimInMs: ms })}
                                    disabled={busy || beyond}
                                >
                                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                                        from {ms / 1000}s
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Text style={styles.label}>Speed</Text>
                    <View style={styles.chips}>
                        {SPEEDS.map((speed) => {
                            const on = (layer.speed ?? 1) === speed;
                            return (
                                <Pressable
                                    key={speed}
                                    style={[styles.chip, on && styles.chipOn]}
                                    onPress={() => onChange({ speed })}
                                    disabled={busy}
                                >
                                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                                        {speed}×
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Text style={styles.label}>Its own sound</Text>
                    <View style={styles.chips}>
                        {([
                            { v: 0, label: "Muted" },
                            { v: 0.3, label: "Under" },
                            { v: 1, label: "Full" },
                        ] as const).map((o) => {
                            const on = (layer.volume ?? 1) === o.v;
                            return (
                                <Pressable
                                    key={o.label}
                                    style={[styles.chip, on && styles.chipOn]}
                                    onPress={() => onChange({ volume: o.v })}
                                    disabled={busy}
                                >
                                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                                        {o.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    <Text style={styles.note}>
                        A clip shorter than its scene holds its last frame rather than cutting to
                        black.
                    </Text>
                </>
            ) : null}

            {isStill ? (
                <>
                    <Text style={styles.label}>Movement</Text>
                    <View style={styles.chips}>
                        <Pressable
                            style={[styles.chip, !layer.kenBurns && styles.chipOn]}
                            onPress={() => onChange({ kenBurns: undefined })}
                            disabled={busy}
                        >
                            <Text style={[styles.chipText, !layer.kenBurns && styles.chipTextOn]}>
                                Still
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[styles.chip, !!layer.kenBurns && styles.chipOn]}
                            onPress={() => onChange({ kenBurns: { fromScale: 1, toScale: 1.08 } })}
                            disabled={busy}
                        >
                            <Text style={[styles.chipText, !!layer.kenBurns && styles.chipTextOn]}>
                                Slow push in
                            </Text>
                        </Pressable>
                    </View>
                    <Text style={styles.note}>
                        A held still reads as a dead frame on a reel. A slight push is usually
                        enough.
                    </Text>
                </>
            ) : null}
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    useMemo(
        () =>
            StyleSheet.create({
                wrap: { gap: 8 },
                head: { flexDirection: "row", alignItems: "center", gap: 8 },
                title: { flex: 1, color: colors.text, fontSize: fs(13), lineHeight: lh(19), fontWeight: "600" },
                headActions: { flexDirection: "row", gap: 4 },
                icon: {
                    width: fbox(22),
                    height: fbox(22),
                    borderRadius: 7,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: withAlpha(colors.text, 0.06),
                },
                iconOff: { opacity: 0.3 },
                label: { color: colors.textSecondary, fontSize: fs(11), lineHeight: lh(15), fontWeight: "600" },
                chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
                chip: {
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                chipOn: { backgroundColor: colors.primary },
                chipText: { color: colors.text, fontSize: fs(11), lineHeight: lh(15) },
                chipTextOn: { color: colors.white, fontWeight: "600" },
                note: { color: colors.textSecondary, fontSize: fs(10), lineHeight: lh(15) },
            }),
        [colors]
    );

export default LayerInspector;
