/**
 * MediaAssetPreview — one uploaded or rendered asset, laid out at its REAL
 * aspect ratio rather than inside a fixed-height box (which renders a 9:16 reel
 * letterboxed in a landscape frame).
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
}

const MediaAssetPreview: React.FC<Props> = ({ attachment: a, contentType, maxHeight, onPress }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { aspect, onVideoNaturalSize } = useMediaAspect(a, previewAspect(contentType));

    const isVideo = isVideoAttachment(a);
    const vUrl = isVideo ? videoUrlOf(a) : null;
    const canPreview = isVideo ? !!vUrl : !!a.imageUrl;

    return (
        <Pressable
            style={[styles.box, { aspectRatio: aspect, maxHeight }]}
            onPress={canPreview && onPress ? () => onPress(a) : undefined}
            disabled={!canPreview || !onPress}
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
                            useNativeControls={false}
                            onReadyForDisplay={(e: any) => onVideoNaturalSize(e?.naturalSize)}
                        />
                        <View style={styles.playOverlay} pointerEvents="none">
                            <View style={styles.playBadge}>
                                <FontAwesomeIcon icon={faPlay} size={18} color={colors.onPrimary} />
                            </View>
                        </View>
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
