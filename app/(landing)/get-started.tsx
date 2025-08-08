import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import AppLayout from "@/layouts/app-layout";
import { useMyNavigation } from "@/shared-libs/utils/router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ImageBackground,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from "react-native";


// const LOGO =
//     "https://www.trendly.now/wp-content/uploads/2025/03/rectangluar-blue-logo-transparent-png.avif";
const VIDEO_THUMB =
    "https://www.trendly.now/wp-content/uploads/2025/05/thumbnail-youtube-and-web-for-video.avif";

const CREATE_BRAND_LINK =
    "https://brands.trendly.now/pre-signin?skip=1";
const YT_LINK = "https://youtu.be/X1Of8cALHRo?si=FsHvfKuDdjs4Sf3s";

// ---- Discount countdown config ----
const OFFER_HOURS = 72; // 3 days window
const nowTs = () => new Date().getTime();

function getCountdownParts(ms: number) {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return { days, hours, minutes, seconds };
}

export default function TrendlyHero() {
    const router = useMyNavigation()
    const { width } = useWindowDimensions();
    const isWide = width >= 1000;

    const [showOffer, setShowOffer] = useState(true);
    // End time persists for the session; fallback to 72h from first render
    const endRef = useRef<number>(nowTs() + OFFER_HOURS * 60 * 60 * 1000);
    const [remaining, setRemaining] = useState(endRef.current - nowTs());

    useEffect(() => {
        const t = setInterval(() => {
            setRemaining(endRef.current - nowTs());
        }, 1000);
        return () => clearInterval(t);
    }, []);

    const parts = useMemo(() => getCountdownParts(remaining), [remaining]);

    const open = (url: string) => {
        // Linking.openURL(url).catch(() => { })
        router.resetAndNavigate("/create-brand")
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
                    <View style={[isWide && styles.left, isWide ? { paddingRight: 90 } : {}]}>
                        {/* <Text style={styles.kicker}>FOR BRANDS</Text> */}
                        <Text style={styles.title}>
                            Find <Text style={styles.titleAccent}>Right Influencers</Text> to
                            {"\n"}promote your Brand
                        </Text>

                        <Text style={styles.subtitle}>
                            Connect with the right influencers to increase your brand’s reach
                            and engagement. Save on huge commissions you pay working with
                            agencies and other middlemen!
                        </Text>

                        {showOffer && (
                            <View style={[styles.offerCard, !isWide && { paddingBottom: 16 }]}>
                                {/* <Pressable style={styles.offerClose} onPress={() => setShowOffer(false)}>
                                    <Text style={styles.offerCloseText}>✕</Text>
                                </Pressable> */}
                                <View>
                                    <Text style={styles.offerHeading}>Purchase Now - Offer ends in</Text>
                                    <Text style={styles.offerTitle}>Flat <Text style={{ fontWeight: '900' }}>50% OFF</Text></Text>
                                </View>

                                <View style={styles.timerRow}>
                                    {/* <View style={styles.timerBox}><Text style={styles.timerNum}>{String(parts.hours).padStart(2, '0')}</Text><Text style={styles.timerLbl}>hours</Text></View>
                                    <Text style={styles.timerSep}>:</Text> */}
                                    <View style={styles.timerBox}><Text style={styles.timerNum}>{String(parts.minutes).padStart(2, '0')}</Text><Text style={styles.timerLbl}>minutes</Text></View>
                                    <Text style={styles.timerSep}>:</Text>
                                    <View style={styles.timerBox}><Text style={styles.timerNum}>{String(parts.seconds).padStart(2, '0')}</Text><Text style={styles.timerLbl}>seconds</Text></View>
                                </View>
                                {/* <Text style={styles.offerFoot}>Special offer runs for a limited time</Text> */}
                            </View>
                        )}
                        <Pressable
                            onPress={() => open(CREATE_BRAND_LINK)}
                            style={({ pressed }) => [
                                styles.cta,
                                pressed && { transform: [{ scale: 0.98 }] },
                            ]}
                        >
                            <Text style={styles.ctaText}>Register now to Claim Offer</Text>
                            <Text style={styles.ctaArrow}>›</Text>
                        </Pressable>

                    </View>

                    {/* Right video */}
                    <Pressable
                        accessibilityRole="imagebutton"
                        onPress={() => open(YT_LINK)}
                        style={[styles.videoWrap, !isWide && { marginTop: 28 }]}
                    >
                        <ImageBackground
                            source={{ uri: VIDEO_THUMB }}
                            style={styles.video}
                            imageStyle={styles.videoImg}
                        >
                            <View style={styles.playCircle}>
                                <Text style={styles.playIcon}>▶︎</Text>
                            </View>
                        </ImageBackground>
                    </Pressable>

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

    // ---- Discount offer styles ----
    offerCard: {
        marginTop: 0,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap-reverse",
        ...Platform.select({ android: { elevation: 4 } }),
    },
    offerClose: {
        position: 'absolute',
        right: 10,
        top: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    offerCloseText: { color: '#8a8a8a', fontSize: 16 },
    offerHeading: { fontSize: 16, fontWeight: '700', color: TEXT, marginTop: 2 },
    offerTitle: { fontSize: 28, fontWeight: '800', color: TEXT, marginTop: 2 },
    timerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
    timerBox: {
        backgroundColor: '#F3F5F8',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        minWidth: 64,
    },
    timerNum: { fontSize: 28, fontWeight: '900', color: TEXT },
    timerLbl: { fontSize: 12, color: '#6C7A89', marginTop: 2 },
    timerSep: { fontSize: 24, color: '#6C7A89', marginHorizontal: 8, marginBottom: 10 },
    offerCta: {
        marginTop: 16,
        backgroundColor: '#EA4E5A',
        borderRadius: 999,
        paddingHorizontal: 28,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({ android: { elevation: 2 } }),
    },
    offerCtaText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    offerFoot: { marginTop: 10, color: '#6C7A89', fontSize: 12 },
});