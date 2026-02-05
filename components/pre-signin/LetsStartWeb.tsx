import Button from "@/components/ui/button";
import InfiniteMarquee from "@/components/ui/InfiniteMarquee";
import AppLayout from "@/layouts/app-layout";
import { CREATORS_FE_URL } from "@/shared-constants/app";
import Colors from "@/shared-uis/constants/Colors";
import { imageUrl } from "@/utils/url";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import gsap from "gsap";
import React, { useEffect, useRef } from "react";
import { Image, Platform, StyleSheet, View, Dimensions } from "react-native";
import { Text } from "react-native-paper";

const MARQUEE_ICONS = [
    "shopping", "camera-iris", "video-vintage", "star-circle", 
    "heart-multiple", "chart-timeline-variant", "account-group", 
    "monitor-dashboard", "lightbulb-on", "rocket-launch", 
    "storefront", "tag-heart", "trending-up", "instagram", "youtube", "facebook"
];

const LetsStartWeb = () => {
    const theme = useTheme();
    const containerRef = useRef<View>(null);
    const cardRef = useRef<View>(null);
    const bgLayerRef = useRef<View>(null);
    const brandColors = Colors(theme);

    useEffect(() => {
        if (Platform.OS === 'web') {
            // Initial Entrance
            gsap.fromTo(cardRef.current,
                { opacity: 0, scale: 0.9, y: 30, rotationX: 15 },
                { opacity: 1, scale: 1, y: 0, rotationX: 0, duration: 1, ease: "power3.out", delay: 0.2 }
            );

            // Mouse Move Listener for Tilt & Parallax
            const handleMouseMove = (e: any) => {
                if (!cardRef.current || !bgLayerRef.current) return;
                
                const { clientX, clientY } = e;
                const { innerWidth, innerHeight } = window;
                
                const centerX = innerWidth / 2;
                const centerY = innerHeight / 2;
                
                // Tilt Calculation (Card follows mouse)
                // Max rotation: 8 degrees
                const rotateX = ((centerY - clientY) / centerY) * 8; 
                const rotateY = ((clientX - centerX) / centerX) * 8;

                // Parallax Calculation (Bg moves opposite to mouse)
                const moveX = ((centerX - clientX) / centerX) * 30; // Max 30px move
                const moveY = ((centerY - clientY) / centerY) * 30;

                gsap.to(cardRef.current, {
                    rotationX: rotateX,
                    rotationY: rotateY,
                    duration: 0.5,
                    ease: "power2.out",
                    transformPerspective: 1000, // Important for 3D effect
                    transformOrigin: "center center"
                });

                gsap.to(bgLayerRef.current, {
                    x: moveX,
                    y: moveY,
                    duration: 1.5,
                    ease: "power2.out"
                });
            };

            window.addEventListener('mousemove', handleMouseMove);
            return () => window.removeEventListener('mousemove', handleMouseMove);
        }
    }, []);

    return (
        <AppLayout withWebPadding={false}>
            <View 
                ref={containerRef}
                style={[styles.container, { backgroundColor: brandColors.background }]}
            >
                {/* Background Marquee Layer with Parallax */}
                <View ref={bgLayerRef} style={styles.marqueeLayer}>
                    <View style={{ transform: [{ rotate: '-6deg' }, { scale: 1.15 }], opacity: 0.05 }}>
                        <InfiniteMarquee duration={60000}>
                            {MARQUEE_ICONS.map((icon, index) => (
                                <MaterialCommunityIcons 
                                    key={index} 
                                    name={icon as any} 
                                    size={100} 
                                    color={brandColors.text} 
                                    style={{ marginHorizontal: 50 }} 
                                />
                            ))}
                        </InfiniteMarquee>
                         <View style={{ height: 80 }} />
                        <InfiniteMarquee duration={70000} reverse>
                            {MARQUEE_ICONS.map((icon, index) => (
                                <MaterialCommunityIcons 
                                    key={index + 'rev'} 
                                    name={icon as any} 
                                    size={100} 
                                    color={brandColors.primary} 
                                    style={{ marginHorizontal: 50 }} 
                                />
                            ))}
                        </InfiniteMarquee>
                         <View style={{ height: 80 }} />
                        <InfiniteMarquee duration={55000}>
                            {MARQUEE_ICONS.map((icon, index) => (
                                <MaterialCommunityIcons 
                                    key={index + '3'} 
                                    name={icon as any} 
                                    size={100} 
                                    color={brandColors.secondary} 
                                    style={{ marginHorizontal: 50 }} 
                                />
                            ))}
                        </InfiniteMarquee>
                    </View>
                </View>

                {/* Foreground Glass Card with 3D Tilt */}
                <View 
                    ref={cardRef}
                    style={[
                        styles.glassCard, 
                        { 
                            backgroundColor: theme.dark ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.85)',
                            borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
                            // @ts-ignore
                            backdropFilter: 'blur(25px)',
                        }
                    ]} 
                >
                    <View style={styles.logoContainer}>
                        <Image
                            source={imageUrl(require("@/assets/images/logo.png"))}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={[styles.title, { color: brandColors.text }]}>
                        Welcome to Trendly
                    </Text>
                    <Text style={[styles.subtitle, { color: brandColors.gray300 }]}>
                        The ultimate platform for brands to connect with top-tier creators. 
                        Scale your marketing with data-driven collaborations in real-time.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <Button 
                            onPress={() => router.push("/pre-signin")}
                            style={styles.primaryButton}
                            contentStyle={{ paddingVertical: 12 }}
                            mode="contained"
                        >
                            Join as Brand / Agency
                        </Button>
                        
                        <Button 
                            mode="outlined" 
                            onPress={() => {
                                if (Platform.OS === "web")
                                    window.open(CREATORS_FE_URL, "_blank");
                                else
                                    router.push("/wrong-app")
                            }}
                            style={styles.secondaryButton}
                            contentStyle={{ paddingVertical: 12 }}
                        >
                            Join as Influencer
                        </Button>
                    </View>
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
        position: "relative",
        overflow: "hidden",
        minHeight: 600,
        // @ts-ignore
        perspective: 1000, 
    },
    marqueeLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    glassCard: {
        width: "90%",
        maxWidth: 550,
        padding: 50,
        borderRadius: 32,
        alignItems: "center",
        zIndex: 10,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 50,
    },
    logoContainer: {
        marginBottom: 32,
    },
    logo: {
        height: 60,
        width: 220, 
    },
    title: {
        fontSize: 40,
        fontWeight: "800",
        marginBottom: 16,
        textAlign: "center",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        lineHeight: 28,
        marginBottom: 40,
        textAlign: "center",
        maxWidth: 460,
        opacity: 0.8,
    },
    buttonContainer: {
        gap: 16,
        width: "100%",
        maxWidth: 400,
    },
    primaryButton: {
        borderRadius: 14,
    },
    secondaryButton: {
        borderRadius: 14,
        borderWidth: 1.5,
    }
});

export default LetsStartWeb;
