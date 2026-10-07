/**
 * MediaAssetPreview — one uploaded or rendered asset, laid out by aspect ratio
 * rather than inside a fixed-height box (which renders a 9:16 reel letterboxed
 * in a landscape frame).
 *
 * The box takes the asset's REAL ratio when the content type accepts that ratio,
 * and the type's canonical ratio otherwise — so a landscape clip sitting on a
 * Reel still previews as 9:16 instead of reshaping the box to match the bad
 * asset while the "9:16" chip beside it says otherwise.
 *
 * A module-level component on purpose: it measures the asset's dimensions in a
 * hook, so declaring it inside its parent's render would remount it — and throw
 * the measurement away — every time the parent re-rendered.
 */
import { ContentType } from "@/components/content-calendar/types";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import Colors from "@/shared-uis/constants/Colors";
import { faImage, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
import React from "react";
import { Image, Platform, Pressable, StyleSheet, View } from "react-native";
import { previewAspect } from "./media-spec";
import { useMediaAspect } from "./use-media-aspect";

const videoUrlOf = (a: Attachment): string | null =>
    Platform.OS === "ios"
        ? a.appleUrl ?? a.playUrl ?? null
        : a.playUrl ?? a.appleUrl ?? null;

const isVideoAttachment = (a: Attachment) => a.type === "video" || a.type === "reel";

interface Props {
    attachment: Attachment;
    contentType: ContentType;
    /** Tallest the box may get, so a portrait asset can't push the page apart. */
    maxHeight: number;
    onPress?: (a: Attachment) => void;
    /**
     * Play a video inline with its own transport controls instead of acting as a
     * tap target that opens the full-screen preview. Used where the point of the
     * preview is to CHECK the output — "is this the video that will go out?" is
     * a question you answer by watching it, not by opening a modal first.
     */
    playable?: boolean;
}

const MediaAssetPreview: React.FC<Props> = ({
    attachment: a,
    contentType,
    maxHeight,
    onPress,
    playable = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { aspect, onVideoNaturalSize } = useMediaAspect(
        a,
        previewAspect(contentType),
        contentType
    );

    const isVideo = isVideoAttachment(a);
    const vUrl = isVideo ? videoUrlOf(a) : null;
    const canPreview = isVideo ? !!vUrl : !!a.imageUrl;
    // An inline-playable video owns its own taps (the transport controls), so the
    // box must not also swallow them to open the modal.
    const inlinePlay = playable && isVideo && !!vUrl;

    return (
        <Pressable
            style={[
                styles.box,
                // `aspectRatio` alone does NOT survive a height cap: with
                // `width: 100%` and only `maxHeight`, a 9:16 box renders as a
                // full-width, 420-tall LANDSCAPE rectangle with the clip
                // pillarboxed inside it — which is what made a Reel preview look
                // landscape under a "9:16" chip. Capping the WIDTH at
                // `maxHeight * aspect` keeps the box genuinely 9:16 and lets
                // `alignSelf: center` centre the narrower portrait frame. Same
                // derivation the design lane already uses (renderDesignCanvas).
                { aspectRatio: aspect, maxHeight, maxWidth: maxHeight * aspect },
            ]}
            onPress={canPreview && onPress && !inlinePlay ? () => onPress(a) : undefined}
            disabled={!canPreview || !onPress || inlinePlay}
            accessibilityLabel={isVideo ? "Preview video full screen" : "Preview image full screen"}
        >
            {isVideo ? (
                vUrl ? (
                    <>
                        <Video
                            source={{ uri: vUrl }}
                            style={styles.fill}
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay={false}
                            isMuted
                            useNativeControls={inlinePlay}
                            onReadyForDisplay={(e: any) => onVideoNaturalSize(e?.naturalSize)}
                        />
                        {inlinePlay ? null : (
                            <View style={styles.playOverlay} pointerEvents="none">
                                <View style={styles.playBadge}>
                                    <FontAwesomeIcon icon={faPlay} size={18} color={colors.onPrimary} />
                                </View>
                            </View>
                        )}
                    </>
                ) : (
                    <View style={styles.fallback}>
                        <FontAwesomeIcon icon={faPlay} size={22} color={colors.textSecondary} />
                    </View>
                )
            ) : a.imageUrl ? (
                <Image source={{ uri: a.imageUrl }} style={styles.fill} resizeMode="contain" />
            ) : (
                <View style={styles.fallback}>
                    <FontAwesomeIcon icon={faImage} size={22} color={colors.textSecondary} />
                </View>
            )}
        </Pressable>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        box: {
            alignSelf: "center",
            width: "100%",
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: colors.tag,
            alignItems: "center",
            justifyContent: "center",
        },
        fill: {
            width: "100%",
            height: "100%",
        },
        fallback: {
            flex: 1,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
        },
        playOverlay: {
            ...StyleSheet.absoluteFillObject,
            alignItems: "center",
            justifyContent: "center",
        },
        playBadge: {
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.backdropStrong,
        },
    });
}

export default MediaAssetPreview;
