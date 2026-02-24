import { ColorsStatic } from "@/shared-uis/constants/Colors";
import { useAuthContext } from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { UserCredential } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";

import {
    Animated,
    Easing,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from "react-native";

import { ExplainerConfig } from "@/contexts/growthbook-context-provider";
import { ExplainerDynamic } from "./landing/ExplainerDynamic";
import VideoPlayer from "./landing/VideoPlayer";


const VIDEO_THUMB =
    "https://www.trendly.now/wp-content/uploads/2025/05/thumbnail-youtube-and-web-for-video.avif";


interface IIllustration {
    config: ExplainerConfig
    videoUrl: string,
    action: Function
}
export default function FullInformationalIllustration(props: IIllustration) {
    const router = useMyNavigation()
    const { setSession } = useAuthContext()

    const { width } = useWindowDimensions();
    const isWide = width >= 1000;

    // ---- Animations ----
    const leftFade = useRef(new Animated.Value(0)).current; // opacity for left column
    const leftTranslateY = useRef(new Animated.Value(16)).current; // slide-up for left

    const videoOpacity = useRef(new Animated.Value(0)).current;
    const videoScale = useRef(new Animated.Value(0.96)).current;

    const [ctaHovered, setCtaHovered] = useState(false);

    const singupHandler = (manager: UserCredential) => {
        setSession(manager.user.uid);

        HttpWrapper.fetch("/api/v2/chat/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });
        router.resetAndNavigate("/create-brand");
    }

    const config: ExplainerConfig = props.config

    useEffect(() => {
        // page enter animations (staggered)
        Animated.sequence([
            Animated.parallel([
                Animated.timing(leftFade, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(leftTranslateY, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(videoOpacity, {
                    toValue: 1,
                    duration: 450,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.spring(videoScale, {
                    toValue: 1,
                    friction: 7,
                    tension: 80,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);


    return (
        <AppLayout safeAreaEdges={["left", "right"]}>
            <ScrollView
                contentContainerStyle={[styles.page, { flexGrow: 1 }]}
                // bounces={false}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero */}
                <View style={[styles.hero, { alignSelf: "stretch" }, isWide ? styles.heroRow : styles.heroCol]}>
                    {/* Left copy */}
                    <Animated.View style={[
                        isWide && styles.left,
                        isWide ? { paddingRight: 90 } : {},
                        { opacity: leftFade, transform: [{ translateY: leftTranslateY }] },
                    ]}
                    >
                        <ExplainerDynamic
                            config={{ ...config, image: undefined }}
                            viewBelowItems={false}
                            viewAtBottom={<Pressable
                                onPress={() => {
                                    props.action()
                                }}
                                onHoverIn={() => setCtaHovered(true)}
                                onHoverOut={() => setCtaHovered(false)}
                                style={({ pressed }) => [
                                    styles.cta,
                                    (pressed || ctaHovered) && { transform: [{ scale: 0.98 }] },
                                ]}
                            >
                                <Text style={styles.ctaText}>{config?.action || "Get Started"}</Text>
                                <Text style={styles.ctaArrow}>›</Text>
                            </Pressable>}
                        />

                    </Animated.View>

                    {/* Right video */}
                    <Animated.View style={[
                        styles.videoWrap,
                        !isWide && { marginTop: 28 },
                        { opacity: videoOpacity, transform: [{ scale: videoScale }] },
                    ]}>
                        <VideoPlayer videoLink={props.videoUrl} thumbnail={config?.image || VIDEO_THUMB} />
                    </Animated.View>

                </View>
            </ScrollView>
        </AppLayout>
    );
}

/* --------- Styles --------- */
const styles = StyleSheet.create({
    page: {
        paddingHorizontal: 24,
        paddingTop: Platform.select({ web: 36, default: 24 }),
        paddingBottom: 48,
        backgroundColor: ColorsStatic.white,
        maxWidth: 1300,
        alignSelf: "center",
        width: "100%",
    },


    /* Hero layout */
    hero: {
        borderRadius: 24,
        marginTop: 24,
        // marginBottom: 55,
    },
    heroRow: {
        backgroundColor: ColorsStatic.surfaceBlueTint,
        padding: 28,
        flexDirection: "row",
        alignItems: "center",
    },
    heroCol: {
        flexDirection: "column",
        gap: 42
    },

    /* Left */
    left: {
        flex: 1.3,
    },
    kicker: {
        color: ColorsStatic.linkBlue,
        fontSize: 12,
        letterSpacing: 1.4,
        fontWeight: "700",
        marginBottom: 12,
    },
    title: {
        color: ColorsStatic.titleDark,
        fontSize: 48,
        lineHeight: 62,
        fontWeight: "600",
        marginTop: 24,
    },
    titleAccent: {
        color: ColorsStatic.primary,
        textDecorationLine: "underline",
        textDecorationColor: ColorsStatic.linkUnderline,
        textDecorationStyle: "solid",
    },
    subtitle: {
        marginTop: 24,
        marginBottom: 12,
        color: ColorsStatic.textMutedSecondary,
        fontSize: 16,
        lineHeight: 24,
    },

    cta: {
        marginTop: 12,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 22,
        height: 48,
        borderRadius: 999,
        backgroundColor: ColorsStatic.primary,
        shadowColor: ColorsStatic.shadowBlue,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        ...Platform.select({ android: { elevation: 6 } }),
    },
    ctaText: {
        color: ColorsStatic.white,
        fontSize: 16,
        fontWeight: "700",
    },
    ctaArrow: {
        color: ColorsStatic.white,
        fontSize: 22,
        marginLeft: 10,
        marginTop: -2,
    },

    /* Right / Video */
    videoWrap: {
        flex: 1,
    },
});
