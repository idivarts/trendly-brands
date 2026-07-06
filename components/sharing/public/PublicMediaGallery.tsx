import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import AssetPreviewModal from "@/shared-uis/components/carousel/asset-preview-modal";
import Colors from "@/shared-uis/constants/Colors";
import { downloadAsset } from "@/utils/download-asset";
import { faDownload, faImage, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
    attachments?: Attachment[];
}

/**
 * Read-only media gallery for the public share view. Renders every attachment
 * (images + videos), opens the full-screen {@link AssetPreviewModal} on tap, and
 * offers a per-asset download (web + native). Mirrors the tile logic in the
 * authenticated `MediaStage`, minus every editing affordance.
 */
const PublicMediaGallery: React.FC<Props> = ({ attachments }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const [previewImage, setPreviewImage] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

    // Which tile is downloading and its progress fraction (null = indeterminate).
    const [downloading, setDownloading] = useState<{ index: number; pct: number | null } | null>(
        null
    );

    const handleDownload = useCallback(async (index: number, url: string) => {
        setDownloading({ index, pct: null });
        try {
            await downloadAsset(url, undefined, (fraction) =>
                setDownloading({ index, pct: fraction })
            );
        } finally {
            setDownloading(null);
        }
    }, []);

    if (!attachments?.length) return null;

    return (
        <View style={styles.gallery}>
            {attachments.map((a, i) => {
                const isVideo = a.type === "video" || a.type === "reel";
                // iOS plays the HLS/apple URL best; everything else uses playUrl.
                const playbackUrl = isVideo
                    ? Platform.OS === "ios"
                        ? a.appleUrl ?? a.playUrl ?? null
                        : a.playUrl ?? a.appleUrl ?? null
                    : null;
                // Prefer a concrete file (mp4 playUrl) for download — the apple HLS
                // manifest isn't a single downloadable file.
                const downloadUrl = isVideo
                    ? a.playUrl ?? a.appleUrl ?? null
                    : a.imageUrl ?? null;
                const canPreview = isVideo ? !!playbackUrl : !!a.imageUrl;

                return (
                    <View
                        key={`${a.imageUrl ?? a.playUrl ?? a.appleUrl ?? "a"}-${i}`}
                        style={styles.tileWrap}
                    >
                        <Pressable
                            style={styles.tile}
                            disabled={!canPreview}
                            onPress={
                                canPreview
                                    ? () => {
                                          if (isVideo) {
                                              setPreviewVideoUrl(playbackUrl);
                                              setPreviewImageUrl(null);
                                          } else {
                                              setPreviewImageUrl(a.imageUrl ?? null);
                                              setPreviewVideoUrl(null);
                                          }
                                          setPreviewImage(true);
                                      }
                                    : undefined
                            }
                            accessibilityLabel={
                                canPreview
                                    ? isVideo
                                        ? "Play video full screen"
                                        : "View image full screen"
                                    : undefined
                            }
                        >
                            {isVideo ? (
                                <View style={styles.videoTile}>
                                    <FontAwesomeIcon icon={faPlay} size={20} color={colors.onPrimary} />
                                    <Text style={styles.videoTileText}>
                                        {a.type === "reel" ? "Reel" : "Video"}
                                    </Text>
                                </View>
                            ) : a.imageUrl ? (
                                <Image source={{ uri: a.imageUrl }} style={styles.tileImg} resizeMode="cover" />
                            ) : (
                                <View style={styles.videoTile}>
                                    <FontAwesomeIcon icon={faImage} size={20} color={colors.onPrimary} />
                                </View>
                            )}

                            {attachments.length > 1 ? (
                                <View style={styles.orderBadge}>
                                    <Text style={styles.orderBadgeText}>{i + 1}</Text>
                                </View>
                            ) : null}
                        </Pressable>

                        {downloadUrl ? (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.downloadBtn,
                                    pressed && styles.pressed,
                                    downloading?.index === i && styles.downloadBtnActive,
                                ]}
                                onPress={() => handleDownload(i, downloadUrl)}
                                disabled={downloading?.index === i}
                                accessibilityLabel={isVideo ? "Download video" : "Download image"}
                            >
                                {downloading?.index === i ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <FontAwesomeIcon icon={faDownload} size={11} color={colors.primary} />
                                )}
                                <Text style={styles.downloadText}>
                                    {downloading?.index === i
                                        ? downloading?.pct != null
                                            ? `${Math.round(downloading.pct * 100)}%`
                                            : "Downloading…"
                                        : "Download"}
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>
                );
            })}

            {previewImage ? (
                <AssetPreviewModal
                    previewImage={previewImage}
                    previewImageUrl={previewImageUrl}
                    previewVideoUrl={previewVideoUrl}
                    setPreviewImage={setPreviewImage}
                    theme={theme}
                />
            ) : null}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        gallery: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
        },
        tileWrap: {
            alignItems: "center",
            gap: 6,
        },
        tile: {
            width: 150,
            height: 190,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            shadowOpacity: 0.08,
            elevation: 2,
        },
        tileImg: {
            width: "100%",
            height: "100%",
        },
        videoTile: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            backgroundColor: colors.primary,
        },
        videoTileText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        orderBadge: {
            position: "absolute",
            bottom: 6,
            left: 6,
            minWidth: 20,
            height: 20,
            paddingHorizontal: 5,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.backdropStrong,
        },
        orderBadgeText: {
            fontSize: 11,
            fontWeight: "800",
            color: colors.onPrimary,
        },
        downloadBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            minWidth: 118,
            height: 32,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: colors.aliceBlue,
        },
        downloadBtnActive: {
            opacity: 0.9,
        },
        downloadText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.primary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default PublicMediaGallery;
