/**
 * StudioTransport — the controls, which the FORMAT decides.
 *
 * A carousel is paged: left and right arrows, a position counter, no clock. A
 * reel or a video is scrubbed: play, pause, a seek bar and a time readout.
 *
 * ⚠️ The choice comes from `studio.format`, never from whether durations happen
 * to be set. A carousel whose scenes carry stray durations must still page, and
 * a reel with every scene at 0ms must still show a playhead — otherwise the
 * controls change shape as data drifts, which is how a user loses track of what
 * they are even editing.
 *
 * ── One clock ───────────────────────────────────────────────────────────────
 * The playhead is a single position over the WHOLE timeline, and the scene it
 * falls in is derived from it. The old studio had a slide index and a video
 * position that could disagree — the state where the picture showed scene 2 and
 * the sound played over scene 3.
 */
import { fs, lh, fbox } from "@/constants/Typography";
import { IStudio, IStudioScene, isTimedFormat } from "@/shared-libs/firestore/trendly-pro/models/studio";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { faChevronLeft, faChevronRight, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";

export interface StudioTransportProps {
    studio: IStudio;
    scenes: IStudioScene[];

    /** Position over the whole timeline. */
    positionMs: number;
    totalMs: number;
    playing: boolean;

    /** Index of the scene currently on screen, for the paged formats. */
    sceneIndex: number;

    onPlayPause: () => void;
    onSeek: (ms: number) => void;
    onStep: (delta: number) => void;
}

const StudioTransport: React.FC<StudioTransportProps> = ({
    studio,
    scenes,
    positionMs,
    totalMs,
    playing,
    sceneIndex,
    onPlayPause,
    onSeek,
    onStep,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    if (!isTimedFormat(studio.format)) {
        return (
            <View style={styles.wrap}>
                <Pressable
                    style={[styles.round, sceneIndex <= 0 && styles.off]}
                    onPress={() => onStep(-1)}
                    disabled={sceneIndex <= 0}
                >
                    <FontAwesomeIcon icon={faChevronLeft} size={14} color={colors.text} />
                </Pressable>
                <Text style={styles.counter}>
                    {scenes.length === 0 ? "No scenes" : `${sceneIndex + 1} of ${scenes.length}`}
                </Text>
                <Pressable
                    style={[styles.round, sceneIndex >= scenes.length - 1 && styles.off]}
                    onPress={() => onStep(1)}
                    disabled={sceneIndex >= scenes.length - 1}
                >
                    <FontAwesomeIcon icon={faChevronRight} size={14} color={colors.text} />
                </Pressable>
            </View>
        );
    }

    const progress = totalMs > 0 ? Math.min(1, Math.max(0, positionMs / totalMs)) : 0;

    return (
        <View style={styles.wrap}>
            <Pressable style={styles.play} onPress={onPlayPause} disabled={totalMs <= 0}>
                <FontAwesomeIcon icon={playing ? faPause : faPlay} size={13} color={colors.white} />
            </Pressable>

            <Pressable
                style={styles.track}
                onPress={(e: GestureResponderEvent) => {
                    // locationX is relative to the track, which is what makes
                    // a tap-to-seek land where the finger is rather than where
                    // the screen starts.
                    const { locationX } = e.nativeEvent;
                    const width = trackWidthRef.current || 1;
                    onSeek(Math.round((locationX / width) * totalMs));
                }}
                onLayout={(e) => {
                    trackWidthRef.current = e.nativeEvent.layout.width;
                }}
            >
                <View style={styles.trackBase} />
                <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
                <View style={[styles.head, { left: `${progress * 100}%` }]} />
            </Pressable>

            <Text style={styles.time}>
                {formatMs(positionMs)} / {formatMs(totalMs)}
            </Text>
        </View>
    );
};

/**
 * The track's measured width, for turning a tap into a time.
 *
 * A module ref rather than state: it changes only on layout, and putting it in
 * state re-renders the transport on every rotation for a number nothing draws.
 */
const trackWidthRef = { current: 0 };

/** m:ss, which is the only format anyone reads on a reel. */
function formatMs(ms: number): string {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

const useStyles = (colors: ReturnType<typeof Colors>) =>
    useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                },
                play: {
                    width: fbox(34),
                    height: fbox(34),
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                round: {
                    width: fbox(34),
                    height: fbox(34),
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                off: { opacity: 0.35 },
                counter: {
                    flex: 1,
                    textAlign: "center",
                    color: colors.text,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    fontWeight: "600",
                },
                track: { flex: 1, height: fbox(26), justifyContent: "center" },
                trackBase: {
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: withAlpha(colors.text, 0.12),
                },
                trackFill: {
                    position: "absolute",
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.primary,
                },
                head: {
                    position: "absolute",
                    width: fbox(12),
                    height: fbox(12),
                    borderRadius: 6,
                    marginLeft: -6,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.4,
                    elevation: 3,
                },
                time: {
                    color: colors.textSecondary,
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    minWidth: fbox(74),
                    textAlign: "right",
                },
            }),
        [colors]
    );

export default StudioTransport;
