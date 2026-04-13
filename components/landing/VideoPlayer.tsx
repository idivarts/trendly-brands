import { analyticsLogEvent } from "@/shared-libs/utils/firebase/analytics";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Easing,
    ImageBackground,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

const VideoPlayer: React.FC<{ videoLink: string; thumbnail?: string }> = ({ videoLink, thumbnail }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const [videoHovered, setVideoHovered] = useState(false);
    const playPulse = useRef(new Animated.Value(1)).current;
    const [showPlayer, setShowPlayer] = useState(false);
    const youtubeEmbedBase = useMemo(() => toYoutubeEmbedSrc(videoLink), [videoLink]);

    useEffect(() => {
        if (showPlayer) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(playPulse, {
                    toValue: 1.06,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(playPulse, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [showPlayer, playPulse]);

    const activePlayer = useMemo(() => {
        if (!showPlayer) return null;

        if (Platform.OS === "web") {
            if (youtubeEmbedBase) {
                return (
                    <View style={styles.embedContainer}>
                        {/* @ts-expect-error iframe for YouTube embed */}
                        <iframe
                            style={styles.embedIframe}
                            width="100%"
                            height="100%"
                            src={appendAutoplay(youtubeEmbedBase)}
                            title="YouTube video player"
                            frameBorder={0}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                    </View>
                );
            }
            return (
                <View style={styles.embedContainer}>
                    {/* Host <video> for direct / signed URLs (e.g. Firebase Storage). Iframe shows "Access denied" for those. */}
                    {/* @ts-expect-error DOM <video> */}
                    <video
                        src={videoLink}
                        controls
                        autoPlay
                        playsInline
                        style={styles.directVideo}
                    />
                </View>
            );
        }

        if (youtubeEmbedBase) {
            return (
                <View style={styles.embedContainer}>
                    {/* @ts-expect-error iframe for YouTube embed */}
                    <iframe
                        style={styles.embedIframe}
                        width="100%"
                        height="100%"
                        src={appendAutoplay(youtubeEmbedBase)}
                        title="YouTube video player"
                        frameBorder={0}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    />
                </View>
            );
        }

        return (
            <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL(videoLink)}
                style={styles.fallbackOpen}
            >
                <Text style={styles.fallbackOpenText}>Open video in browser</Text>
            </Pressable>
        );
    }, [showPlayer, videoLink, youtubeEmbedBase, styles]);

    return showPlayer ? (
        <>{activePlayer}</>
    ) : (
        <Pressable
            accessibilityRole="imagebutton"
            onPress={() => {
                analyticsLogEvent("clicked_video", { video_link: videoLink });
                setShowPlayer(true);
            }}
            onHoverIn={() => setVideoHovered(true)}
            onHoverOut={() => setVideoHovered(false)}
            style={({ pressed }) => [
                styles.videoPressable,
                (videoHovered || pressed) && styles.videoPressablePressed,
            ]}
        >
            <ImageBackground
                source={thumbnail ? { uri: thumbnail } : undefined}
                style={styles.video}
                imageStyle={styles.videoImg}
            >
                <Animated.View style={[styles.playCircle, { transform: [{ scale: playPulse }] }]}>
                    <Text style={styles.playIcon}>▶︎</Text>
                </Animated.View>
            </ImageBackground>
        </Pressable>
    );
};

export default VideoPlayer;

/** Returns a canonical YouTube embed base URL, or null if the link is not YouTube. */
function toYoutubeEmbedSrc(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed.toLowerCase().startsWith("http")) {
        return null;
    }
    try {
        const u = new URL(trimmed);
        const host = u.hostname.replace(/^www\./, "").toLowerCase();

        if (host === "youtu.be") {
            const id = u.pathname.replace(/^\//, "").split("/")[0];
            return id ? `https://www.youtube.com/embed/${id}` : null;
        }

        if (
            host === "youtube.com" ||
            host === "m.youtube.com" ||
            host === "youtube-nocookie.com" ||
            host === "www.youtube-nocookie.com"
        ) {
            const path = u.pathname;
            if (path.startsWith("/embed/")) {
                return trimmed.split("#")[0];
            }
            if (path === "/watch" || path === "/watch/") {
                const v = u.searchParams.get("v");
                return v ? `https://www.youtube.com/embed/${v}` : null;
            }
            if (path.startsWith("/shorts/")) {
                const id = path.replace("/shorts/", "").split("/")[0];
                return id ? `https://www.youtube.com/embed/${id}` : null;
            }
        }
        return null;
    } catch {
        return null;
    }
}

function appendAutoplay(embedUrl: string): string {
    const sep = embedUrl.includes("?") ? "&" : "?";
    return `${embedUrl}${sep}autoplay=1`;
}

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        videoPressable: {},
        videoPressablePressed: { transform: [{ scale: 0.995 }] },
        video: {
            width: "100%",
            aspectRatio: 16 / 9,
            borderRadius: 20,
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.surface || colors.card,
            shadowColor: colors.text,
            shadowOpacity: 0.12,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            ...Platform.select({ android: { elevation: 6 } }),
        },
        videoImg: {
            resizeMode: "cover",
        },
        embedContainer: {
            width: "100%",
            aspectRatio: 16 / 9,
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: colors.surface || colors.card,
        },
        embedIframe: {
            width: "100%",
            height: "100%",
            borderWidth: 0,
        },
        directVideo: {
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: colors.surface || colors.card,
        },
        playCircle: {
            width: 96,
            height: 96,
            borderRadius: 999,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
        },
        playIcon: {
            fontSize: 48,
            color: colors.primaryDark || colors.primary,
            marginLeft: 6,
        },
        fallbackOpen: {
            width: "100%",
            aspectRatio: 16 / 9,
            borderRadius: 20,
            backgroundColor: colors.surface || colors.card,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
        },
        fallbackOpenText: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.primary,
            textAlign: "center",
        },
    });
}
