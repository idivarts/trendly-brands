/**
 * ClipPreview — what a NON-design clip looks like, in the canvas.
 *
 * The studio's canvas is a frame that plays an HTML design, and that is the
 * right thing for a design clip: it is WYSIWYG, it is what renders, and it is
 * already there. It can show nothing else. So a timeline made of footage, a
 * still, or a generated clip had a strip you could arrange and no way to look
 * at what you were arranging — on a content with no design at all, the only way
 * to see the clip you had just paid for was to render the video.
 *
 * This fills that hole and nothing more. It is a LOOK at one clip, not a
 * composition player: it does not run the timeline, honour a cross-fade, or
 * obey the trim while playing. Saying so plainly beats implying a preview that
 * is almost right — the render is still the thing that puts the clips together,
 * and the strip says so too.
 */
import { fs, lh } from "@/constants/Typography";
import {
    Clip,
    FootageClipSource,
    GenVideoClipSource,
    ImageClipSource,
} from "@/shared-libs/design/composition-runtime";
import Colors from "@/shared-uis/constants/Colors";
import { faFilm } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import VideoSurface from "@/components/shared/VideoSurface";
import { ResizeMode } from "expo-av";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

const fmt = (ms: number) => `${(Math.max(ms, 0) / 1000).toFixed(1)}s`;

interface Props {
    clip: Clip;
    /** The canvas box to fit into, already sized to the content's aspect. */
    width: number;
    height: number;
}

const ClipPreview: React.FC<Props> = ({ clip, width, height }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const source = clip.source;
    const box = { width, height };

    if (source?.kind === "image") {
        const image = source as ImageClipSource;
        return (
            <View style={[styles.frame, box]}>
                <Image source={{ uri: image.url }} style={styles.fill} resizeMode="contain" />
            </View>
        );
    }

    const url =
        source?.kind === "footage"
            ? (source as FootageClipSource).url
            : source?.kind === "genvideo"
                ? (source as GenVideoClipSource).url
                : undefined;

    // A generated clip that has not landed. The strip marks it too, but this is
    // where someone looks for it.
    if (source?.kind === "genvideo" && !url) {
        return (
            <View style={[styles.frame, styles.center, box]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.note}>
                    This clip is still being generated. It drops in here when it lands.
                </Text>
            </View>
        );
    }

    if (!url) {
        return (
            <View style={[styles.frame, styles.center, box]}>
                <FontAwesomeIcon icon={faFilm} size={20} color={colors.textSecondary} />
                <Text style={styles.note}>This clip has no media to show yet.</Text>
            </View>
        );
    }

    const trim =
        source?.kind === "footage" ? (source as FootageClipSource) : null;
    const trimmed =
        trim && (trim.inMs || trim.outMs)
            ? `Plays ${fmt(trim.inMs ?? 0)}–${fmt(trim.outMs ?? 0)} of this file in the render.`
            : null;

    return (
        <View style={[styles.frame, box]}>
            {/* Native controls on purpose: this is a file to look at, and the
                player's own scrubber is better at that than anything bolted to
                a timeline the clip does not drive. */}
            <VideoSurface
                source={{ uri: url }}
                style={styles.fill}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                isLooping={false}
            />
            {trimmed ? (
                <View style={styles.trimBadge}>
                    <Text style={styles.trimText}>{trimmed}</Text>
                </View>
            ) : null}
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    React.useMemo(
        () =>
            StyleSheet.create({
                frame: {
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: colors.black ?? "#000",
                },
                center: {
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: 24,
                    backgroundColor: colors.tag,
                },
                fill: { ...StyleSheet.absoluteFillObject },
                note: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.textSecondary,
                    textAlign: "center",
                },
                trimBadge: {
                    position: "absolute",
                    left: 8,
                    top: 8,
                    maxWidth: "90%",
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    borderRadius: 8,
                    backgroundColor: colors.backdropStrong,
                },
                trimText: {
                    fontSize: fs(10.5),
                    lineHeight: lh(14),
                    fontWeight: "600",
                    color: colors.white,
                },
            }),
        [colors]
    );

export default ClipPreview;
