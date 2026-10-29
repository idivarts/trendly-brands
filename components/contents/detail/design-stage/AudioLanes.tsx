/**
 * AudioLanes — sound for a video design, shown as two lanes under the player.
 *
 * ── Why this replaces SoundtrackPanel ───────────────────────────────────────
 * The old panel presented audio as two lists to browse. Three things were wrong
 * with that, and they compounded:
 *
 *  1. Its primary surface was a search box and five mood chips over a curated
 *     library that has **never contained a single track** — zero rows on dev and
 *     on prod. Every search returned "No tracks yet", printed directly above a
 *     list of the user's own generated tracks. Roughly half the panel was a
 *     dead end that made the whole thing read as broken.
 *  2. Nothing connected the audio to the VIDEO. A 45s track and a 19s track sat
 *     in the same list with no hint which fits an 18.7s reel, what happens to
 *     the overflow, or whether the voiceover runs past the end.
 *  3. You could audition each clip alone but never hear the MIX, so the levels
 *     and the ducking were set blind and discovered at render.
 *
 * Audio for a video is a timeline problem, not a list problem, so it is drawn
 * against the video's own duration: each lane's bar is the clip laid over the
 * video, and the lane says in words what happens where it does not fit. The
 * player's existing play button is the preview — `useSoundtrackPlayer` already
 * mixes and ducks in sync with the frames, it was simply never surfaced here.
 *
 * Choosing is free; only generating costs tokens, and that happens in the sheet.
 */
import { fs, lh } from "@/constants/Typography";
import { IContentAudio } from "@/shared-libs/firestore/trendly-pro/models/design";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import {
    faMicrophoneLines,
    faMusic,
    faPlus,
    faTriangleExclamation,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useRef } from "react";
import { PanResponder, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { safeVolume, useAudioDuration } from "./use-audio-player";

const fmt = (ms: number) => `${(Math.max(ms, 0) / 1000).toFixed(1)}s`;

interface Props {
    audio?: IContentAudio;
    onAudioChange: (audio: IContentAudio) => void;
    /** The video's length. Everything here is measured against it. */
    videoMs: number;
    onAddMusic: () => void;
    onAddVoice: () => void;
    readOnly?: boolean;
}

const AudioLanes: React.FC<Props> = ({
    audio,
    onAudioChange,
    videoMs,
    onAddMusic,
    onAddVoice,
    readOnly,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    // Read from the clip rather than stored: a generated length can be a
    // request the provider rounded, and what matters is what will actually play.
    const musicMs = useAudioDuration(audio?.musicUrl);
    const voiceMs = useAudioDuration(audio?.voiceoverUrl);

    const hasMusic = !!audio?.musicUrl;
    const hasVoice = !!audio?.voiceoverUrl;
    const patch = (p: Partial<IContentAudio>) => onAudioChange({ ...audio, ...p });

    const clearMusic = () =>
        onAudioChange({ ...audio, musicId: undefined, musicUrl: undefined, musicTitle: undefined });
    const clearVoice = () =>
        onAudioChange({ ...audio, voiceoverId: undefined, voiceoverUrl: undefined });

    // What actually happens to this clip on a video of this length. The old
    // panel left the user to guess; the renderer loops a short bed and the
    // encode's -t truncates a long one, so both are knowable facts.
    const musicFit = useMemo(() => {
        if (!musicMs || !videoMs) return null;
        if (musicMs < videoMs - 250) return { text: `loops to fill ${fmt(videoMs)}`, warn: false };
        if (musicMs > videoMs + 250) return { text: `trimmed to ${fmt(videoMs)}`, warn: false };
        return { text: `fits ${fmt(videoMs)}`, warn: false };
    }, [musicMs, videoMs]);

    const voiceFit = useMemo(() => {
        if (!voiceMs || !videoMs) return null;
        if (voiceMs > videoMs + 250) {
            return { text: `runs ${fmt(voiceMs - videoMs)} past the end — it will be cut off`, warn: true };
        }
        return { text: `ends at ${fmt(voiceMs)}`, warn: false };
    }, [voiceMs, videoMs]);

    if (!hasMusic && !hasVoice) {
        return (
            <View style={styles.wrap}>
                <View style={styles.emptyRow}>
                    <Text style={styles.emptyLabel}>SOUND</Text>
                    <Pressable
                        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
                        onPress={onAddMusic}
                        disabled={readOnly}
                        accessibilityRole="button"
                        accessibilityLabel="Add music"
                    >
                        <FontAwesomeIcon icon={faMusic} size={12} color={colors.primary} />
                        <Text style={styles.addBtnText}>Add music</Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
                        onPress={onAddVoice}
                        disabled={readOnly}
                        accessibilityRole="button"
                        accessibilityLabel="Add voiceover"
                    >
                        <FontAwesomeIcon icon={faMicrophoneLines} size={12} color={colors.primary} />
                        <Text style={styles.addBtnText}>Add voiceover</Text>
                    </Pressable>
                    <Text style={styles.emptyHint}>This video is silent.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.wrap}>
            {hasMusic ? (
                <Lane
                    colors={colors}
                    styles={styles}
                    icon={faMusic}
                    title={audio?.musicTitle || "Music"}
                    fit={musicFit}
                    // A bed loops, so it always covers the whole video.
                    fillFrac={1}
                    volume={safeVolume(audio?.musicVolume, 0.7)}
                    onVolume={(v) => patch({ musicVolume: v })}
                    onRemove={clearMusic}
                    removeLabel="Remove the music"
                    readOnly={readOnly}
                />
            ) : (
                <AddLane
                    colors={colors}
                    styles={styles}
                    icon={faMusic}
                    label="Add music"
                    onPress={onAddMusic}
                    readOnly={readOnly}
                />
            )}

            {hasVoice ? (
                <Lane
                    colors={colors}
                    styles={styles}
                    icon={faMicrophoneLines}
                    title="Voiceover"
                    fit={voiceFit}
                    // A voiceover does not loop: it occupies its own share of
                    // the video and the bar says how much.
                    fillFrac={voiceMs && videoMs ? Math.min(voiceMs / videoMs, 1) : 1}
                    volume={safeVolume(audio?.voiceoverVolume, 1)}
                    onVolume={(v) => patch({ voiceoverVolume: v })}
                    onRemove={clearVoice}
                    removeLabel="Remove the voiceover"
                    readOnly={readOnly}
                />
            ) : (
                <AddLane
                    colors={colors}
                    styles={styles}
                    icon={faMicrophoneLines}
                    label="Add voiceover"
                    onPress={onAddVoice}
                    readOnly={readOnly}
                />
            )}

            {/* Only a decision when there are two things to balance. */}
            {hasMusic && hasVoice ? (
                <View style={styles.duckRow}>
                    <Text style={styles.duckLabel}>Dip the music while the voice speaks</Text>
                    <Switch
                        value={audio?.duckMusic ?? true}
                        onValueChange={(v) => patch({ duckMusic: v })}
                        disabled={readOnly}
                    />
                </View>
            ) : null}
        </View>
    );
};

const AddLane: React.FC<{
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof useStyles>;
    icon: any;
    label: string;
    onPress: () => void;
    readOnly?: boolean;
}> = ({ colors, styles, icon, label, onPress, readOnly }) => (
    <Pressable
        style={({ pressed }) => [styles.addLane, pressed && styles.pressed]}
        onPress={onPress}
        disabled={readOnly}
        accessibilityRole="button"
        accessibilityLabel={label}
    >
        <FontAwesomeIcon icon={icon} size={12} color={colors.textSecondary} />
        <Text style={styles.addLaneText}>{label}</Text>
        <FontAwesomeIcon icon={faPlus} size={10} color={colors.textSecondary} />
    </Pressable>
);

const Lane: React.FC<{
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof useStyles>;
    icon: any;
    title: string;
    fit: { text: string; warn: boolean } | null;
    fillFrac: number;
    volume: number;
    onVolume: (v: number) => void;
    onRemove: () => void;
    removeLabel: string;
    readOnly?: boolean;
}> = ({ colors, styles, icon, title, fit, fillFrac, volume, onVolume, onRemove, removeLabel, readOnly }) => (
    <View style={styles.lane}>
        <View style={styles.laneHead}>
            <FontAwesomeIcon icon={icon} size={12} color={colors.primary} />
            <Text style={styles.laneTitle} numberOfLines={1}>
                {title}
            </Text>
            {fit ? (
                <View style={styles.fitRow}>
                    {fit.warn ? (
                        <FontAwesomeIcon
                            icon={faTriangleExclamation}
                            size={10}
                            color={colors.statusReviewFg}
                        />
                    ) : null}
                    <Text style={[styles.laneFit, fit.warn && { color: colors.statusReviewFg }]}>
                        {fit.text}
                    </Text>
                </View>
            ) : null}
            {!readOnly ? (
                <Pressable
                    onPress={onRemove}
                    style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={removeLabel}
                    hitSlop={8}
                >
                    <FontAwesomeIcon icon={faXmark} size={11} color={colors.textSecondary} />
                </Pressable>
            ) : null}
        </View>
        {/* The clip laid over the video's length. */}
        <View style={styles.clipTrack}>
            <View style={[styles.clipFill, { width: `${Math.round(fillFrac * 100)}%` }]} />
        </View>
        <VolumeSlider colors={colors} value={volume} onChange={onVolume} disabled={readOnly} />
    </View>
);

/**
 * A volume slider you can actually drag.
 *
 * The old one was a Pressable that read `locationX` on a single tap — so there
 * was no drag at all, and on react-native-web `locationX` is sometimes
 * undefined, which the code had to discard. That is why setting a level felt
 * broken: some taps simply did nothing and there was no way to nudge a value.
 * A PanResponder tracks the gesture on both platforms and keeps the value under
 * the finger.
 */
const VolumeSlider: React.FC<{
    colors: ReturnType<typeof Colors>;
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
}> = ({ colors, value, onChange, disabled }) => {
    const styles = useStyles(colors);
    const widthRef = useRef(1);
    const originRef = useRef(0);
    const valueRef = useRef(value);
    valueRef.current = value;

    const responder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => !disabled,
                onMoveShouldSetPanResponder: () => !disabled,
                onPanResponderGrant: (e) => {
                    // The press position within the track, when the platform
                    // gives us one: that makes a tap jump to where you tapped.
                    const x = e.nativeEvent.locationX;
                    if (Number.isFinite(x)) {
                        const next = Math.max(0, Math.min(x / Math.max(widthRef.current, 1), 1));
                        originRef.current = next;
                        onChange(next);
                    } else {
                        originRef.current = valueRef.current;
                    }
                },
                // Drag is relative to where the gesture started, so it works
                // even when the platform gave us no usable locationX.
                onPanResponderMove: (_e, g) => {
                    const delta = g.dx / Math.max(widthRef.current, 1);
                    onChange(Math.max(0, Math.min(originRef.current + delta, 1)));
                },
            }),
        [disabled, onChange]
    );

    const pct = Math.round(safeVolume(value, 0) * 100);
    return (
        <View style={styles.volRow}>
            <View
                style={styles.volTrack}
                onLayout={(e) => {
                    widthRef.current = e.nativeEvent.layout.width;
                }}
                {...responder.panHandlers}
                accessibilityRole="adjustable"
                accessibilityLabel="Volume"
                accessibilityValue={{ min: 0, max: 100, now: pct }}
            >
                <View style={[styles.volFill, { width: `${pct}%` }]} />
                <View style={[styles.volKnob, { left: `${pct}%` }]} />
            </View>
            <Text style={styles.volPct}>{pct}%</Text>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                pressed: { opacity: 0.7 },
                wrap: {
                    gap: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -3 },
                    shadowRadius: 10,
                    shadowOpacity: 0.06,
                    elevation: 4,
                },
                // ── Empty ──
                emptyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
                emptyLabel: {
                    fontSize: fs(10),
                    fontWeight: "800",
                    letterSpacing: 1,
                    color: colors.textSecondary,
                },
                addBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    minHeight: 34,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                },
                addBtnText: { fontSize: fs(12.5), fontWeight: "700", color: colors.primary },
                emptyHint: { flex: 1, textAlign: "right", fontSize: fs(11), color: colors.textSecondary },
                // ── Lane ──
                lane: { gap: 5 },
                laneHead: { flexDirection: "row", alignItems: "center", gap: 8 },
                laneTitle: { fontSize: fs(12.5), fontWeight: "700", color: colors.text, maxWidth: 180 },
                fitRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
                laneFit: { fontSize: fs(11), color: colors.textSecondary },
                removeBtn: { padding: 3 },
                clipTrack: {
                    height: 6,
                    borderRadius: 3,
                    overflow: "hidden",
                    backgroundColor: withAlpha(colors.textSecondary, 0.14),
                },
                clipFill: { height: 6, borderRadius: 3, backgroundColor: withAlpha(colors.primary, 0.55) },
                addLane: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    minHeight: 34,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    backgroundColor: withAlpha(colors.textSecondary, 0.07),
                },
                addLaneText: { flex: 1, fontSize: fs(12), color: colors.textSecondary },
                // ── Mix ──
                volRow: { flexDirection: "row", alignItems: "center", gap: 10 },
                volTrack: {
                    flex: 1,
                    height: 22,
                    justifyContent: "center",
                },
                volFill: {
                    position: "absolute",
                    left: 0,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.primary,
                },
                volKnob: {
                    position: "absolute",
                    width: 14,
                    height: 14,
                    marginLeft: -7,
                    borderRadius: 7,
                    backgroundColor: colors.primary,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.25,
                    elevation: 2,
                },
                volPct: {
                    width: 38,
                    textAlign: "right",
                    fontSize: fs(11),
                    color: colors.textSecondary,
                },
                duckRow: { flexDirection: "row", alignItems: "center", gap: 10 },
                duckLabel: { flex: 1, fontSize: fs(12), lineHeight: lh(17), color: colors.textSecondary },
            }),
        [colors]
    );
}

export default AudioLanes;
