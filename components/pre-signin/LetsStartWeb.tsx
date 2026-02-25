import ActionCard from "@/components/pre-signin/ActionCard";
import IntroSplash from "@/components/pre-signin/IntroSplash";
import { useTransition } from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import { CREATORS_FE_URL } from "@/shared-constants/app";
import Colors from "@/shared-uis/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import gsap from "gsap";
import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

const LetsStartWeb = () => {
    const theme = useTheme();
    const brandColors = Colors(theme);
    const { width } = useBreakpoints();
    const isMobileWeb = width < 900;

    const SOCIAL_ORBS = React.useMemo(
        () => [
            { icon: "youtube", color: brandColors.socialYoutube, size: 90, x: -280, y: -150, depth: 0.2 },
            { icon: "instagram", color: brandColors.socialInstagram, size: 80, x: 250, y: -50, depth: 0.15 },
            { icon: "linkedin", color: brandColors.socialLinkedin, size: 70, x: -100, y: 180, depth: 0.1 },
            { icon: "facebook", color: brandColors.socialFacebook, size: 60, x: 180, y: 120, depth: 0.25 },
            { icon: "twitter", color: brandColors.socialTwitter, size: 50, x: 50, y: -340, depth: 0.08 },
            { icon: "music-note", color: brandColors.socialTiktok, size: 65, x: 300, y: -200, depth: 0.12 },
            { icon: "snapchat", color: brandColors.socialSnapchat, size: 60, x: -380, y: -45, depth: 0.18 },
            { icon: "pinterest", color: brandColors.socialPinterest, size: 45, x: 30, y: -140, depth: 0.05 },
            { icon: "whatsapp", color: brandColors.socialWhatsapp, size: 48, x: -300, y: -280, depth: 0.1 },
        ],
        [brandColors]
    );

    const [showSplash, setShowSplash] = useState(true);
    const [showContent, setShowContent] = useState(false);

    // Refs
    const containerRef = useRef<View>(null);
    const textRef = useRef<Text>(null);
    const orbsRef = useRef<View[]>([]);
    const { triggerTransition } = useTransition();

    const handleSplashComplete = () => {
        setShowSplash(false);
        setShowContent(true);
    };

    useEffect(() => {
        if (!showContent) return;

        // Load Google Fonts for web
        if (Platform.OS === 'web') {
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Coiny&family=Varela+Round&family=Quicksand:wght@500&family=Comfortaa:wght@700&family=Fredoka:wght@700&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        if (Platform.OS === 'web') {
            const ctx = gsap.context(() => {
                const tl = gsap.timeline();

                // 1. Orbs Entrance (Explosion style)
                gsap.set(orbsRef.current, { scale: 0, opacity: 0 });
                tl.to(orbsRef.current, {
                    scale: 1,
                    opacity: 0.8,
                    duration: 1,
                    stagger: { amount: 0.5, from: "center" },
                    ease: "elastic.out(1, 0.5)",
                });

                // 2. Text Breathing Animation
                gsap.to(textRef.current, {
                    scale: 1.05,
                    textShadowRadius: 20,
                    textShadowColor: brandColors.heroTextShadowLight,
                    duration: 3,
                    yoyo: true,
                    repeat: -1,
                    ease: "sine.inOut",
                });

                // 3. Orb Floating Loop
                orbsRef.current.forEach((orb, i) => {
                    gsap.to(orb, {
                        y: "+=25",
                        rotation: Math.random() * 20 - 10,
                        duration: 3 + Math.random() * 2,
                        yoyo: true,
                        repeat: -1,
                        ease: "sine.inOut",
                        delay: Math.random(),
                    });
                });

                // 4. Mouse Parallax
                const handleMouseMove = (e: MouseEvent) => {
                    const { clientX, clientY } = e;
                    const centerX = window.innerWidth / 2;
                    const centerY = window.innerHeight / 2;

                    orbsRef.current.forEach((orb, i) => {
                        const depth = SOCIAL_ORBS[i].depth;
                        gsap.to(orb, {
                            x: (centerX - clientX) * depth * 0.5, // Stronger parallax
                            y: (centerY - clientY) * depth * 0.5,
                            duration: 1,
                            ease: "power2.out",
                        });
                    });
                };

                window.addEventListener('mousemove', handleMouseMove);
                return () => window.removeEventListener('mousemove', handleMouseMove);

            }, containerRef);
            return () => ctx.revert();
        }
    }, [showContent]);

    if (showSplash) {
        return <IntroSplash onComplete={handleSplashComplete} />;
    }

    return (
        <AppLayout withWebPadding={false}>
            <View
                ref={containerRef}
                style={[styles.container, { backgroundColor: brandColors.background }]}
            >
                {/* Single Centered Column */}
                <View style={styles.centeredWrapper}>

                    <Animated.View entering={FadeIn.duration(800)} style={styles.contentColumn}>
                        {/* Background Orbs */}
                        <View style={styles.orbContainer}>
                            {SOCIAL_ORBS.map((orb, index) => (
                                <View
                                    key={index}
                                    ref={el => { if (el) orbsRef.current[index] = el; }}
                                    style={[
                                        styles.orb,
                                        {
                                            left: '50%',
                                            top: '50%',
                                            marginLeft: orb.x, // Initial offset
                                            marginTop: orb.y,
                                            width: orb.size,
                                            height: orb.size,
                                            borderRadius: orb.size / 2,
                                            backgroundColor: theme.dark ? orb.color + '30' : orb.color + '15',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={orb.icon as any}
                                        size={orb.size * 0.6}
                                        color={orb.color}
                                    />
                                </View>
                            ))}
                        </View>

                        {/* Branding Content */}
                        <View style={styles.brandingContent}>

                            <Text
                                ref={textRef}
                                style={[
                                    styles.heroText,
                                    {
                                        color: brandColors.primary,
                                        // @ts-ignore - textShadowColor is supported on web
                                        textShadowColor: brandColors.heroTextShadow,
                                        textShadowRadius: 25,
                                        textShadowOffset: { width: 0, height: 15 },
                                    },
                                    isMobileWeb && styles.heroTextMobile
                                ]}
                            >
                                TRENDLY
                            </Text>

                            <Text style={[styles.tagline, { color: brandColors.gray300 }]}>
                                Where Brands Meet Creators.
                            </Text>
                            <Text style={[styles.description, { color: brandColors.gray300 }]}>
                                Scale your marketing with data-driven collaborations in real-time.
                            </Text>
                        </View>

                        {/* Buttons in Row */}
                        <Animated.View entering={FadeIn.delay(500).duration(800)} style={styles.buttonsRow}>
                            <View style={styles.buttonWrapper}>
                                <ActionCard
                                    title="Join as Brand / Agency"
                                    description="Connect with creators. Amplify your reach."
                                    colors={[brandColors.actionCardBrand1, brandColors.actionCardBrand2, brandColors.actionCardBrand3]}
                                    onPress={() => router.push("/pre-signin")}
                                    onPressWithAnimation={(layout, colors) => {
                                        if (Platform.OS === 'web') {
                                            triggerTransition(
                                                layout,
                                                [...colors],
                                                () => {
                                                    router.push("/pre-signin");
                                                }
                                            );
                                        } else {
                                            router.push("/pre-signin");
                                        }
                                    }}
                                />
                            </View>

                            <View style={styles.buttonWrapper}>
                                <ActionCard
                                    title="Join as Influencer"
                                    description="Monetize your content. Grow your community."
                                    colors={[brandColors.actionCardInfluencer1, brandColors.actionCardInfluencer2]}
                                    onPress={() => {
                                        if (Platform.OS === "web")
                                            window.open(CREATORS_FE_URL, "_blank");
                                        else
                                            router.push("/wrong-app")
                                    }}
                                />
                            </View>
                        </Animated.View>
                    </Animated.View>
                </View>
            </View>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        position: 'relative',
        minHeight: 700,
    },
    centeredWrapper: {
        width: '100%',
        maxWidth: 1200,
        paddingHorizontal: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentColumn: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    orbContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orb: {
        position: 'absolute',
    },
    brandingContent: {
        zIndex: 10,
        alignItems: 'center',
        marginBottom: 48,

    },
    heroText: {
        fontSize: 100,
        fontWeight: '400',
        letterSpacing: -4,
        marginBottom: 16,
        fontFamily: Platform.select({
            web: 'Coiny, Varela Round, Quicksand, Comfortaa, Fredoka, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            default: 'System',
        }),
    },
    heroTextMobile: {
        fontSize: 60, // Smaller on mobile web
    },
    tagline: {
        fontSize: 24,
        fontWeight: '500',
        textAlign: 'center',
    },
    description: {
        fontSize: 18,
        marginTop: 16,
        maxWidth: 450,
        textAlign: 'center',
        lineHeight: 28,
        opacity: 0.8,
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 24,
        width: '100%',
        maxWidth: 1100,
        zIndex: 10,
    },
    buttonWrapper: {
        flex: 1,
        minWidth: 400,
    },
});

export default LetsStartWeb;
