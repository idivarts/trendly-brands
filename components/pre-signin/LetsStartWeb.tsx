import ActionCard from "@/components/pre-signin/ActionCard";
import IntroSplash from "@/components/pre-signin/IntroSplash";
import AppLayout from "@/layouts/app-layout";
import { CREATORS_FE_URL } from "@/shared-constants/app";
import Colors from "@/shared-uis/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import gsap from "gsap";
import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View, Text, useWindowDimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

// Expanded Social Universe
const SOCIAL_ORBS = [
    { icon: "youtube", color: "#FF0000", size: 90, x: -280, y: -150, depth: 0.2 }, // Moved further left/up (was blocking text)
    { icon: "instagram", color: "#C13584", size: 80, x: 250, y: -50, depth: 0.15 },
    { icon: "linkedin", color: "#0077B5", size: 70, x: -100, y: 180, depth: 0.1 },
    { icon: "facebook", color: "#1877F2", size: 60, x: 180, y: 120, depth: 0.25 },
    
    // New Icons for Density
    { icon: "twitter", color: "#1DA1F2", size: 50, x: 50, y: -250, depth: 0.08 },
    { icon: "music-note", color: "#000000", size: 65, x: 300, y: 200, depth: 0.12 }, // TikTok-ish
    { icon: "snapchat", color: "#FFFC00", size: 55, x: -350, y: 50, depth: 0.18 },
    { icon: "pinterest", color: "#E60023", size: 45, x: 100, y: 280, depth: 0.05 },
    { icon: "whatsapp", color: "#25D366", size: 40, x: -200, y: -220, depth: 0.1 }, 
];

const LetsStartWeb = () => {
    const theme = useTheme();
    const brandColors = Colors(theme);
    const { width } = useWindowDimensions();
    const isMobileWeb = width < 900;
    
    const [showSplash, setShowSplash] = useState(true);
    const [showContent, setShowContent] = useState(false);

    // Refs
    const containerRef = useRef<View>(null);
    const textRef = useRef<Text>(null);
    const orbsRef = useRef<View[]>([]);

    const handleSplashComplete = () => {
        setShowSplash(false);
        setShowContent(true);
    };

    useEffect(() => {
        if (!showContent) return;

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
                    textShadowColor: 'rgba(0,0,0,0.2)',
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
                {/* Responsive Split/Stack Wrapper */}
                <View style={[styles.splitWrapper, isMobileWeb && styles.splitWrapperMobile]}>
                    
                    {/* LEFT COLUMN */}
                    <Animated.View entering={FadeIn.duration(800)} style={[styles.leftColumn, isMobileWeb && styles.leftColumnMobile]}>
                        <View style={styles.orbContainer}>
                            {SOCIAL_ORBS.map((orb, index) => (
                                <View
                                    key={index}
                                    ref={el => orbsRef.current[index] = el!}
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
                        
                        <View style={styles.brandingContent}>
                            <Text 
                                ref={textRef} 
                                style={[styles.heroText, { color: brandColors.text }, isMobileWeb && styles.heroTextMobile]}
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
                    </Animated.View>

                    {/* RIGHT COLUMN */}
                    <Animated.View entering={FadeIn.delay(500).duration(800)} style={[styles.rightColumn, isMobileWeb && styles.rightColumnMobile]}>
                        <View style={[styles.cardsWrapper, isMobileWeb && styles.cardsWrapperMobile]}>
                            <ActionCard 
                                title="Join as Brand / Agency"
                                description="Connect with creators. Amplify your reach."
                                colors={['#0F2027', '#203A43', '#2C5364']}
                                onPress={() => router.push("/pre-signin")}
                            />
                            
                            <ActionCard 
                                title="Join as Influencer"
                                description="Monetize your content. Grow your community."
                                colors={['#FF512F', '#DD2476']}
                                onPress={() => {
                                    if (Platform.OS === "web")
                                        window.open(CREATORS_FE_URL, "_blank");
                                    else
                                        router.push("/wrong-app")
                                }}
                            />
                        </View>
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
    splitWrapper: {
        flexDirection: 'row',
        width: '100%',
        maxWidth: 1400,
        height: '100%',
        paddingHorizontal: 60,
    },
    splitWrapperMobile: {
        flexDirection: 'column', // Stack on small screens
        paddingHorizontal: 20,
        paddingTop: 40,
        height: 'auto',
    },
    leftColumn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center', 
        position: 'relative',
    },
    leftColumnMobile: {
        flex: 0,
        marginBottom: 40,
        height: 400, // Fixed height for orbs area
    },
    rightColumn: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: 60,
    },
    rightColumnMobile: {
        flex: 0,
        paddingLeft: 0,
        paddingBottom: 60,
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
    },
    heroText: {
        fontSize: 100,
        fontWeight: '900',
        letterSpacing: -4,
        marginBottom: 16,
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
    cardsWrapper: {
        width: '100%',
        maxWidth: 500,
        gap: 24,
    },
    cardsWrapperMobile: {
        maxWidth: '100%',
    },
});

export default LetsStartWeb;
