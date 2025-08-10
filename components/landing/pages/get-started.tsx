import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import { useAuthContext } from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useGoogleLogin } from "@/utils/use-google-login";
import { UserCredential } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";

import {
    Animated,
    Easing,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from "react-native";

import OfferCard from "@/components/landing/OfferCard";
import { ExplainerConfig, useMyGrowthBook } from "@/contexts/growthbook-context-provider";
import { analyticsLogEvent } from "@/shared-libs/utils/firebase/analytics";
import { ExplainerDynamic } from "../ExplainerDynamic";
import VideoPlayer from "../VideoPlayer";


const VIDEO_THUMB =
    "https://www.trendly.now/wp-content/uploads/2025/05/thumbnail-youtube-and-web-for-video.avif";


export default function TrendlyHero() {
    const router = useMyNavigation()
    const { setSession } = useAuthContext()
    const { features, discountEndTime } = useMyGrowthBook()
    const { features: { getStarted, actionType, demoLink } } = useMyGrowthBook()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

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

    const config: ExplainerConfig = getStarted ? getStarted : {
        title: "Find {Right Influencers} to promote your brand",
        description: "Connect with the right influencers to increase your brand’s reach and engagement. Save on huge commissions you pay working with agencies and other middlemen!",
    }

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

    const { googleLogin } = useGoogleLogin(setLoading, setError, singupHandler);

    const open = (url: string) => {
        Linking.openURL(url).catch(() => { })
    };

    return (
        <AppLayout>
            <ScrollView
                contentContainerStyle={styles.page}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                <LandingHeader />

                {/* Hero */}
                <View style={[styles.hero, isWide ? styles.heroRow : styles.heroCol]}>
                    {/* Left copy */}
                    <Animated.View style={[
                        isWide && styles.left,
                        isWide ? { paddingRight: 90 } : {},
                        { opacity: leftFade, transform: [{ translateY: leftTranslateY }] },
                    ]}
                    >
                        <ExplainerDynamic
                            config={{ ...config, image: undefined }}
                            viewBelowItems={getStarted?.showOfferCard && <OfferCard />}
                            viewAtBottom={<Pressable
                                onPress={() => {
                                    if (actionType == "demo") {
                                        Linking.openURL(demoLink)
                                    } else {
                                        analyticsLogEvent("clicked_register", {
                                            ...features,
                                            discountEndTime
                                        })
                                        googleLogin()
                                    }
                                }}
                                onHoverIn={() => setCtaHovered(true)}
                                onHoverOut={() => setCtaHovered(false)}
                                disabled={loading}
                                style={({ pressed }) => [
                                    styles.cta,
                                    (pressed || ctaHovered) && { transform: [{ scale: 0.98 }] },
                                ]}
                            >
                                <Text style={styles.ctaText}>{!loading ? (getStarted?.action || "Join Now to claim Offer") : "Please wait..."}</Text>
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
                        <VideoPlayer videoLink={features.videoUrl} thumbnail={getStarted?.image || VIDEO_THUMB} />
                    </Animated.View>

                </View>

                <LandingFooter />
            </ScrollView>
        </AppLayout>
    );
}

/* --------- Styles --------- */
const BLUE = "#254F7A";
const BLUE_DARK = "#1A3B5C";
const BLUE_LIGHT = "#6C91BA";
const TEXT = "#243A53";

const styles = StyleSheet.create({
    page: {
        paddingHorizontal: 24,
        paddingTop: Platform.select({ web: 36, default: 24 }),
        paddingBottom: 48,
        backgroundColor: "#FFFFFF",
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
        backgroundColor: "#F8FBFF",
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
        color: BLUE_LIGHT,
        fontSize: 12,
        letterSpacing: 1.4,
        fontWeight: "700",
        marginBottom: 12,
    },
    title: {
        color: TEXT,
        fontSize: 48,
        lineHeight: 62,
        fontWeight: "600",
        marginTop: 24,
    },
    titleAccent: {
        color: BLUE,
        textDecorationLine: "underline",
        textDecorationColor: "#CFE2F7",
        textDecorationStyle: "solid",
    },
    subtitle: {
        marginTop: 24,
        marginBottom: 12,
        color: "#53657A",
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
        backgroundColor: BLUE,
        shadowColor: "#2B5C8F",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        ...Platform.select({ android: { elevation: 6 } }),
    },
    ctaText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    ctaArrow: {
        color: "#FFFFFF",
        fontSize: 22,
        marginLeft: 10,
        marginTop: -2,
    },

    /* Right / Video */
    videoWrap: {
        flex: 1,
    },
});