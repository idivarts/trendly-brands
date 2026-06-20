import type { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { IconButton } from "react-native-paper";
import VideoPlayer from "@/components/landing/VideoPlayer";
import { Text } from "../theme/Themed";

export interface InfluencerUploadedVideoProps {
    contract: IContracts;
}

const InfluencerUploadedVideo: React.FC<InfluencerUploadedVideoProps> = ({ contract }) => {
    const colors = Colors(useTheme());
    const styles = useMemo(() => createStyles(colors), [colors]);

    const links = contract.deliverable?.deliverableLinks ?? [];
    const latestLink = links.length > 0 ? links[links.length - 1] : undefined;

    const handleDownloadVideo = useCallback(async (url: string) => {
        const trimmed = url.trim();
        if (!trimmed) return;

        if (isLikelyYoutubeUrl(trimmed)) {
            Toaster.info("YouTube links can’t be downloaded as a file here. Save from YouTube if you need an offline copy.");
            return;
        }

        const ext = getVideoFileExtensionFromUrl(trimmed);
        const baseFilename = `influencer-video-${Date.now()}.${ext}`;

        if (Platform.OS === "web") {
            try {
                const res = await fetch(trimmed);
                if (!res.ok) throw new Error("bad status");
                const blob = await res.blob();
                const objectUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = objectUrl;
                a.download = baseFilename;
                a.rel = "noopener";
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(objectUrl);
                Toaster.success("Download started");
            } catch {
                Toaster.error("Could not download this video. It may be blocked by the browser or server.");
            }
            return;
        }

        try {
            const cacheDir = Paths.cache.uri;
            if (!cacheDir) {
                Toaster.error("Download isn’t available on this device.");
                return;
            }
            const result = await File.downloadFileAsync(trimmed, new File(Paths.cache, baseFilename));
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(result.uri);
                Toaster.success("Choose where to save the video");
            } else {
                Toaster.success("Video downloaded to app cache");
            }
        } catch {
            Toaster.error("Could not download this video.");
        }
    }, []);

    if (links.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.emptyStateTitle}>Uploaded video</Text>
                <Text style={styles.emptyText}>No video uploaded yet.</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.titleRow}>
                <Text style={styles.title}>Uploaded video by influencer</Text>
                {latestLink ? (
                    <IconButton
                        icon="download"
                        size={22}
                        onPress={() => void handleDownloadVideo(latestLink)}
                        accessibilityLabel="Download video"
                        iconColor={colors.primary}
                        style={styles.downloadIconBtn}
                    />
                ) : null}
            </View>
            {latestLink ? (
                <View style={styles.videoWrap}>
                    <VideoPlayer videoLink={latestLink} />
                </View>
            ) : null}
        </View>
    );
};

const VIDEO_FILE_EXT_FALLBACK = "mp4";

/** Extension without leading dot; uses last path segment, falls back to mp4. */
function getVideoFileExtensionFromUrl(urlString: string): string {
    try {
        const base = new URL(urlString).pathname.split("/").filter(Boolean).pop() ?? "";
        const dot = base.lastIndexOf(".");
        if (dot < 0 || dot === base.length - 1) {
            return VIDEO_FILE_EXT_FALLBACK;
        }
        const raw = base.slice(dot + 1).toLowerCase();
        if (!/^[a-z0-9]{1,10}$/.test(raw)) {
            return VIDEO_FILE_EXT_FALLBACK;
        }
        return raw;
    } catch {
        return VIDEO_FILE_EXT_FALLBACK;
    }
}

function isLikelyYoutubeUrl(url: string): boolean {
    try {
        const u = new URL(url.trim());
        const h = u.hostname.replace(/^www\./, "").toLowerCase();
        return h === "youtu.be" || h.includes("youtube");
    } catch {
        return false;
    }
}

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        card: {
            width: "100%",
            padding: 16,
            borderRadius: 8,
            backgroundColor: colors.tag ?? "rgba(0,0,0,0.06)",
            borderWidth: 1,
            borderColor: colors.budgetCardBorder ?? "rgba(0,0,0,0.08)",
        },
        titleRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            gap: 8,
        },
        title: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
            flex: 1,
            minWidth: 0,
        },
        downloadIconBtn: {
            margin: 0,
        },
        emptyStateTitle: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 8,
        },
        emptyText: {
            fontSize: 14,
            color: colors.gray300,
        },
        videoWrap: {
            width: "100%",
            marginBottom: 8,
        },
        moreLinks: {
            fontSize: 12,
            color: colors.gray300,
        },
    });
}

export default InfluencerUploadedVideo;
