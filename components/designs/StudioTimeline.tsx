/**
 * The timeline: a ruler, a playhead, and one row per track.
 *
 * Modelled on the Hyperframes editor's own timeline, because that is the
 * surface this studio renders through and matching it means a user who has
 * seen one recognises the other.
 *
 * ── Read-only, and honestly so ────────────────────────────────────────────
 * Clips cannot be dragged, trimmed or reordered here. Editing a clip means
 * changing the project's HTML, which is the AI's job in v3 — a handle that
 * moved a clip and then silently did nothing would be worse than no handle.
 * What it does do is let you SEE the film's structure and seek within it,
 * which is what the stage above needs.
 */
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { withAlpha } from "@/utils/color";
import React, { useCallback, useMemo } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";

import {
    clipGeometry,
    formatClock,
    rulerTicks,
    toTracks,
    type DesignScene,
} from "./studio-layout";

export interface StudioTimelineProps {
    scenes: DesignScene[] | undefined;
    totalMs: number;
    positionMs: number;
    /** Scene currently selected in the layer tree, highlighted here too. */
    selectedSceneId?: string | null;
    onSeek: (ms: number) => void;
    onSelectScene: (sceneId: string) => void;
}

const TRACK_LABEL_WIDTH = 108;
const TRACK_HEIGHT = 52;

const StudioTimeline: React.FC<StudioTimelineProps> = ({
    scenes,
    totalMs,
    positionMs,
    selectedSceneId,
    onSeek,
    onSelectScene,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const tracks = useMemo(() => toTracks(scenes), [scenes]);
    const ticks = useMemo(() => rulerTicks(totalMs), [totalMs]);

    // Measured rather than assumed: the lane is whatever is left after the
    // labels, and a seek computed against a guessed width lands in the wrong
    // place on every viewport but one.
    const [laneWidth, setLaneWidth] = React.useState(0);
    const onLaneLayout = useCallback((e: LayoutChangeEvent) => {
        setLaneWidth(e.nativeEvent.layout.width);
    }, []);

    const seekFromX = useCallback(
        (x: number) => {
            if (laneWidth <= 0 || totalMs <= 0) return;
            const fraction = Math.min(Math.max(x / laneWidth, 0), 1);
            onSeek(Math.round(fraction * totalMs));
        },
        [laneWidth, totalMs, onSeek]
    );

    const pct = (n: number): `${number}%` => `${Math.min(Math.max(n, 0), 1) * 100}%`;
    const playheadLeft = pct(totalMs > 0 ? positionMs / totalMs : 0);

    if (tracks.length === 0) {
        return (
            <View style={styles.root}>
                <Text style={styles.empty}>
                    No timeline yet — write the design and its scenes appear here.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <View style={styles.rulerRow}>
                <View style={styles.rulerSpacer} />
                <Pressable
                    style={styles.ruler}
                    onLayout={onLaneLayout}
                    onPress={(e) => seekFromX(e.nativeEvent.locationX)}
                    accessibilityRole="adjustable"
                    accessibilityLabel="Seek"
                >
                    {ticks.map((t) => (
                        <View
                            key={t}
                            style={[
                                styles.tick,
                                { left: pct(totalMs > 0 ? t / totalMs : 0) },
                            ]}
                        >
                            <View style={styles.tickMark} />
                            <Text style={styles.tickLabel}>{formatClock(t)}</Text>
                        </View>
                    ))}
                </Pressable>
            </View>

            <View style={styles.tracks}>
                {tracks.map((track) => (
                    <View key={track.index} style={styles.trackRow}>
                        <View style={styles.trackLabelCell}>
                            <Text style={styles.trackLabel} numberOfLines={1}>
                                {track.label}
                            </Text>
                            <Text style={styles.trackCount}>{track.scenes.length}</Text>
                        </View>
                        <View style={styles.lane}>
                            {track.scenes.map((scene) => {
                                const { left, width } = clipGeometry(scene, totalMs);
                                const selected = scene.id === selectedSceneId;
                                return (
                                    <Pressable
                                        key={scene.id}
                                        onPress={() => onSelectScene(scene.id)}
                                        style={[
                                            styles.clip,
                                            { left: pct(left), width: pct(width) },
                                            selected && styles.clipSelected,
                                        ]}
                                        accessibilityRole="button"
                                        accessibilityLabel={`${scene.id}, ${(scene.durationMs / 1000).toFixed(1)} seconds`}
                                    >
                                        <Text style={styles.clipLabel} numberOfLines={1}>
                                            {scene.id}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {/* Drawn over the rows, offset by the label column so it lines
                    up with the lanes rather than the whole timeline. */}
                <View style={styles.playheadLayer} pointerEvents="none">
                    <View style={styles.playheadSpacer} />
                    <View style={styles.playheadLane}>
                        <View style={[styles.playhead, { left: playheadLeft }]} />
                    </View>
                </View>
            </View>
        </View>
    );
};

export default StudioTimeline;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                root: {
                    backgroundColor: colors.card,
                    paddingVertical: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -3 },
                    shadowRadius: 10,
                    shadowOpacity: 0.08,
                    elevation: 6,
                },
                empty: {
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    color: colors.textSecondary,
                    textAlign: "center",
                    paddingVertical: 18,
                },
                rulerRow: { flexDirection: "row", alignItems: "flex-end", paddingRight: 12 },
                rulerSpacer: { width: TRACK_LABEL_WIDTH },
                ruler: { flex: 1, height: 22, justifyContent: "flex-end" },
                tick: { position: "absolute", bottom: 0, alignItems: "flex-start" },
                tickMark: { width: 1, height: 6, backgroundColor: withAlpha(colors.text, 0.25) },
                tickLabel: {
                    fontSize: fs(9),
                    lineHeight: lh(13),
                    color: colors.textSecondary,
                    marginTop: 1,
                },
                tracks: { position: "relative", marginTop: 4 },
                trackRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    height: TRACK_HEIGHT,
                    paddingRight: 12,
                },
                trackLabelCell: {
                    width: TRACK_LABEL_WIDTH,
                    paddingLeft: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                },
                trackLabel: {
                    flex: 1,
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    fontWeight: "600",
                    color: colors.text,
                },
                trackCount: { fontSize: fs(10), lineHeight: lh(14), color: colors.textSecondary },
                lane: {
                    flex: 1,
                    height: TRACK_HEIGHT - 14,
                    borderRadius: 8,
                    backgroundColor: withAlpha(colors.text, 0.05),
                    overflow: "hidden",
                },
                clip: {
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    justifyContent: "center",
                    backgroundColor: withAlpha(colors.primary, 0.35),
                },
                clipSelected: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.45,
                    elevation: 3,
                },
                clipLabel: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                playheadLayer: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 12,
                    bottom: 0,
                    flexDirection: "row",
                },
                playheadSpacer: { width: TRACK_LABEL_WIDTH },
                playheadLane: { flex: 1 },
                playhead: {
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: 2,
                    marginLeft: -1,
                    backgroundColor: colors.green,
                },
            }),
        [colors]
    );
}
