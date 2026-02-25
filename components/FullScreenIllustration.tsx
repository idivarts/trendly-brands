import { useAuthContext } from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { UserCredential } from "firebase/auth";
import React, { useEffect, useMemo, useRef, useState } from "react";

import {
    Animated,
    Easing,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
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
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 1000;
    const styles = useMemo(() => makeStyles(colors), [colors]);

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
                contentContainerStyle={[styles.page, styles.pageGrow]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.hero, styles.heroStretch, isWide ? styles.heroRow : styles.heroCol]}>
                    <Animated.View style={[
                        isWide && styles.left,
                        isWide && styles.leftWidePadding,
                        { opacity: leftFade, transform: [{ translateY: leftTranslateY }] },
                    ]}
                    >
                        <ExplainerDynamic
                            config={{ ...config, image: undefined }}
                            viewBelowItems={false}
                            viewAtBottom={<Pressable
                                onPress={() => props.action()}
                                onHoverIn={() => setCtaHovered(true)}
                                onHoverOut={() => setCtaHovered(false)}
                                style={({ pressed }) => [
                                    styles.cta,
                                    (pressed || ctaHovered) && styles.ctaPressed,
                                ]}
                            >
                                <Text style={styles.ctaText}>{config?.action || "Get Started"}</Text>
                                <Text style={styles.ctaArrow}>›</Text>
                            </Pressable>}
                        />
                    </Animated.View>

                    <Animated.View style={[
                        styles.videoWrap,
                        !isWide && styles.videoWrapNarrow,
                        { opacity: videoOpacity, transform: [{ scale: videoScale }] },
                    ]}>
                        <VideoPlayer videoLink={props.videoUrl} thumbnail={config?.image || VIDEO_THUMB} />
                    </Animated.View>
                </View>
            </ScrollView>
        </AppLayout>
    );
}

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        page: {
            paddingHorizontal: 24,
            paddingTop: Platform.select({ web: 36, default: 24 }),
            paddingBottom: 48,
            backgroundColor: colors.background,
            maxWidth: 1300,
            alignSelf: "center",
            width: "100%",
        },
        pageGrow: { flexGrow: 1 },
        hero: {
            borderRadius: 24,
            marginTop: 24,
        },
        heroStretch: { alignSelf: "stretch" },
        heroRow: {
            backgroundColor: colors.surface || colors.card,
            padding: 28,
            flexDirection: "row",
            alignItems: "center",
        },
        heroCol: {
            flexDirection: "column",
            gap: 42
        },
        left: {
            flex: 1.3,
        },
        leftWidePadding: { paddingRight: 90 },
        cta: {
            marginTop: 12,
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 22,
            height: 48,
            borderRadius: 999,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            ...Platform.select({ android: { elevation: 6 } }),
        },
        ctaPressed: { transform: [{ scale: 0.98 }] },
        ctaText: {
            color: colors.onPrimary,
            fontSize: 16,
            fontWeight: "700",
        },
        ctaArrow: {
            color: colors.onPrimary,
            fontSize: 22,
            marginLeft: 10,
            marginTop: -2,
        },
        videoWrap: {
            flex: 1,
        },
        videoWrapNarrow: { marginTop: 28 },
    });
}
