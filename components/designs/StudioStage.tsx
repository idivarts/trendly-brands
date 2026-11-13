/**
 * The stage: the film in the middle, with a transport bar under it.
 *
 * ── Two sources for one picture ───────────────────────────────────────────
 * A rendered design shows its MP4 and the video owns the clock. An unrendered
 * one shows the preview frame at the playhead, and the clock is ours. The
 * transport looks the same either way on purpose — the user is scrubbing
 * *their film*, and which artefact is behind it is our problem, not theirs.
 *
 * The surround is black in both themes. That is not a theme violation but
 * what every editor does: a bright surround changes how the footage reads,
 * and the stage exists to show footage truthfully.
 */
import VideoSurface, { type VideoSurfaceHandle } from "@/components/shared/VideoSurface";
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import {
    faExpand,
    faPause,
    faPlay,
    faRepeat,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { ResizeMode, type AVPlaybackStatus } from "expo-av";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    LayoutChangeEvent,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import type { DesignPreviewFrame } from "./design-status";
import { formatClock, frameAt } from "./studio-layout";

export interface StudioStageProps {
    renderUrl?: string;
    posterUrl?: string;
    frames: DesignPreviewFrame[] | undefined;
    aspect: number;
    positionMs: number;
    totalMs: number;
    playing: boolean;
    busy: boolean;
    busyLabel?: string;
    loop: boolean;
    onPlayPause: () => void;
    onSeek: (ms: number) => void;
    onToggleLoop: () => void;
    onPositionFromVideo: (ms: number) => void;
}

const StudioStage: React.FC<StudioStageProps> = ({
    renderUrl,
    posterUrl,
    frames,
    aspect,
    positionMs,
    totalMs,
    playing,
    busy,
    busyLabel,
    loop,
    onPlayPause,
    onSeek,
    onToggleLoop,
    onPositionFromVideo,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const video = useRef<VideoSurfaceHandle | null>(null);

    const frame = useMemo(() => frameAt(frames, positionMs), [frames, positionMs]);

    // ── Fit the film inside the pane, in BOTH directions ──────────────────
    // `aspectRatio` with maxWidth/maxHeight is not a fit: flex gives the box
    // the full width and the aspect ratio then decides a height, which for a
    // 9:16 film in a wide pane is far taller than the pane — the picture
    // overflows and the transport is pushed off the bottom. Measuring and
    // computing is the only version that works for both portrait and
    // landscape without knowing which it is.
    const [stage, setStage] = useState({ width: 0, height: 0 });
    const onStageLayout = useCallback((e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setStage({ width, height });
    }, []);

    const frameSize = useMemo(() => {
        const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 9 / 16;
        if (stage.width <= 0 || stage.height <= 0) return { width: 0, height: 0 };
        const byWidth = { width: stage.width, height: stage.width / safeAspect };
        return byWidth.height <= stage.height
            ? byWidth
            : { width: stage.height * safeAspect, height: stage.height };
    }, [aspect, stage.width, stage.height]);

    // The video is the clock when there is one, so the transport cannot drift
    // from the picture.
    const onStatus = useCallback(
        (status: AVPlaybackStatus) => {
            if (!status.isLoaded) return;
            onPositionFromVideo(status.positionMillis ?? 0);
        },
        [onPositionFromVideo]
    );

    // Measured, not read off the DOM node. `offsetWidth` exists only on RN
    // web, so a scrub built on it silently does nothing on a phone.
    const [scrubWidth, setScrubWidth] = useState(0);
    const onScrubLayout = useCallback((e: LayoutChangeEvent) => {
        setScrubWidth(e.nativeEvent.layout.width);
    }, []);

    const seekFromX = useCallback(
        (x: number) => {
            if (scrubWidth <= 0 || totalMs <= 0) return;
            const ms = Math.round(Math.min(Math.max(x / scrubWidth, 0), 1) * totalMs);
            onSeek(ms);
            void video.current?.setPositionAsync(ms).catch(() => undefined);
        },
        [scrubWidth, totalMs, onSeek]
    );

    const progress: `${number}%` = `${totalMs > 0 ? Math.min(Math.max(positionMs / totalMs, 0), 1) * 100 : 0}%`;

    return (
        <View style={styles.root}>
            <View style={styles.stageArea} onLayout={onStageLayout}>
                <View style={[styles.frame, frameSize]}>
                    {renderUrl ? (
                        <VideoSurface
                            ref={video}
                            source={{ uri: renderUrl }}
                            isLooping={loop}
                            shouldPlay={playing}
                            resizeMode={ResizeMode.CONTAIN}
                            usePoster={!!posterUrl}
                            posterSource={posterUrl ? { uri: posterUrl } : undefined}
                            onPlaybackStatusUpdate={onStatus}
                            style={styles.video}
                        />
                    ) : frame ? (
                        <Image source={{ uri: frame.url }} style={styles.video} resizeMode="contain" />
                    ) : (
                        <View style={styles.blank}>
                            {busy && <ActivityIndicator color={colors.white} />}
                            <Text style={styles.blankText}>
                                {busyLabel ?? "Nothing to show yet"}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.transport}>
                <Pressable
                    onPress={onPlayPause}
                    disabled={!renderUrl}
                    style={({ pressed }) => [
                        styles.playBtn,
                        (pressed || !renderUrl) && styles.dim,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={playing ? "Pause" : "Play"}
                >
                    <FontAwesomeIcon
                        icon={playing ? faPause : faPlay}
                        size={12}
                        color={colors.white}
                    />
                </Pressable>

                <Text style={styles.clock}>
                    {formatClock(positionMs)} / {formatClock(totalMs)}
                </Text>

                <Pressable
                    style={styles.scrub}
                    onLayout={onScrubLayout}
                    onPress={(e) => seekFromX(e.nativeEvent.locationX)}
                    accessibilityRole="adjustable"
                    accessibilityLabel="Scrub"
                >
                    <View style={styles.scrubTrack}>
                        <View style={[styles.scrubFill, { width: progress }]} />
                    </View>
                </Pressable>

                <Pressable
                    onPress={onToggleLoop}
                    style={({ pressed }) => [styles.iconBtn, pressed && styles.dim]}
                    accessibilityRole="button"
                    accessibilityLabel={loop ? "Looping" : "Not looping"}
                >
                    <FontAwesomeIcon
                        icon={faRepeat}
                        size={12}
                        color={loop ? colors.green : withAlpha(colors.white, 0.6)}
                    />
                </Pressable>

                <Pressable
                    onPress={() => void video.current?.presentFullscreenPlayer?.().catch(() => undefined)}
                    disabled={!renderUrl}
                    style={({ pressed }) => [styles.iconBtn, (pressed || !renderUrl) && styles.dim]}
                    accessibilityRole="button"
                    accessibilityLabel="Fullscreen"
                >
                    <FontAwesomeIcon icon={faExpand} size={12} color={withAlpha(colors.white, 0.6)} />
                </Pressable>
            </View>
        </View>
    );
};

export default StudioStage;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                root: { flex: 1, backgroundColor: colors.black },
                stageArea: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16,
                },
                frame: {
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: withAlpha(colors.white, 0.04),
                },
                video: { width: "100%", height: "100%" },
                blank: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
                blankText: {
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    color: withAlpha(colors.white, 0.55),
                },
                transport: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: withAlpha(colors.white, 0.05),
                },
                playBtn: {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: withAlpha(colors.white, 0.14),
                },
                iconBtn: {
                    width: 26,
                    height: 26,
                    alignItems: "center",
                    justifyContent: "center",
                },
                dim: { opacity: 0.45 },
                clock: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    color: withAlpha(colors.white, 0.75),
                    minWidth: 72,
                },
                scrub: { flex: 1, height: 20, justifyContent: "center" },
                scrubTrack: {
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: withAlpha(colors.white, 0.18),
                    overflow: "hidden",
                },
                scrubFill: { height: 3, backgroundColor: colors.green },
            }),
        [colors]
    );
}
