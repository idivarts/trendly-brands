import { analyticsLogEvent } from '@/shared-libs/utils/firebase/analytics';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ImageBackground, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { BLUE_DARK } from './const';

const VideoPlayer: React.FC<{ videoLink: string, thumbnail?: string }> = ({ videoLink, thumbnail }) => {
    const [videoHovered, setVideoHovered] = useState(false);
    // subtle pulsing for play button
    const playPulse = useRef(new Animated.Value(1)).current;

    const [showPlayer, setShowPlayer] = useState(false)

    useEffect(() => {
        if (showPlayer) return; // no pulse once the player is showing
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
    }, [showPlayer]);

    // const ytId = getYouTubeId(videoLink);

    return (
        showPlayer ? (
            (
                // @ts-ignore
                <iframe width="100%" height="315" src={videoLink + "&autoplay=1"} title="YouTube video player" frameborder={0} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
            )
        ) : (
            <Pressable
                accessibilityRole="imagebutton"
                onPress={() => {
                    analyticsLogEvent("clicked_video", { video_link: videoLink })
                    setShowPlayer(true)
                }}
                onHoverIn={() => setVideoHovered(true)}
                onHoverOut={() => setVideoHovered(false)}
                style={({ pressed }) => [
                    videoHovered || pressed ? { transform: [{ scale: 0.995 }] } : null,
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
        )
    );
}

export default VideoPlayer

const styles = StyleSheet.create({
    video: {
        width: "100%",
        aspectRatio: 16 / 9,
        borderRadius: 20,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#E7F0F9",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        ...Platform.select({ android: { elevation: 6 } }),
    },
    videoImg: {
        resizeMode: "cover",
    },
    playCircle: {
        width: 96,
        height: 96,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.9)",
        alignItems: "center",
        justifyContent: "center",
    },
    playIcon: {
        fontSize: 48,
        color: BLUE_DARK,
        marginLeft: 6, // optical centering for the triangle glyph
    },
})