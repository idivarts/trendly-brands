import Button from "@/components/ui/button";
import InfiniteMarquee from "@/components/ui/InfiniteMarquee";
import AppLayout from "@/layouts/app-layout";
import { CREATORS_FE_URL } from "@/shared-constants/app";
import Colors from "@/shared-uis/constants/Colors";
import { imageUrl } from "@/utils/url";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import Animated, { 
    FadeInUp, 
    useAnimatedStyle, 
    useSharedValue, 
    withRepeat, 
    withSequence, 
    withTiming, 
    Easing 
} from "react-native-reanimated";
import { Text } from "react-native-paper";

const MARQUEE_ICONS = [
    "shopping", "camera-iris", "video-vintage", "star-circle", 
    "heart-multiple", "chart-timeline-variant", "account-group", 
    "monitor-dashboard", "lightbulb-on", "rocket-launch", 
    "storefront", "tag-heart", "trending-up", "instagram", "youtube", "facebook"
];

const LetsStartMobile = () => {
    const theme = useTheme();
    const brandColors = Colors(theme);
    const floatY = useSharedValue(0);

    useEffect(() => {
        // Continuous floating breathing animation
        floatY.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const animatedCardStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: floatY.value }]
        };
    });

    return (
        <AppLayout withWebPadding={false}>
            <View style={[styles.container, { backgroundColor: brandColors.background }]}>
                {/* Background Marquee Layer */}
                <View style={styles.marqueeLayer}>
                    <View style={{ transform: [{ rotate: '-6deg' }, { scale: 1.2 }], opacity: 0.05 }}>
                        <InfiniteMarquee duration={60000}>
                            {MARQUEE_ICONS.map((icon, index) => (
                                <MaterialCommunityIcons 
                                    key={index} 
                                    name={icon as any} 
                                    size={80} 
                                    color={brandColors.text} 
                                    style={{ marginHorizontal: 30 }} 
                                />
                            ))}
                        </InfiniteMarquee>
                         <View style={{ height: 60 }} />
                        <InfiniteMarquee duration={70000} reverse>
                            {MARQUEE_ICONS.map((icon, index) => (
                                <MaterialCommunityIcons 
                                    key={index + 'rev'} 
                                    name={icon as any} 
                                    size={80} 
                                    color={brandColors.primary} 
                                    style={{ marginHorizontal: 30 }} 
                                />
                            ))}
                        </InfiniteMarquee>
                         <View style={{ height: 60 }} />
                        <InfiniteMarquee duration={55000}>
                            {MARQUEE_ICONS.map((icon, index) => (
                                <MaterialCommunityIcons 
                                    key={index + '3'} 
                                    name={icon as any} 
                                    size={80} 
                                    color={brandColors.secondary} 
                                    style={{ marginHorizontal: 30 }} 
                                />
                            ))}
                        </InfiniteMarquee>
                    </View>
                </View>

                {/* Foreground Card with Floating Animation */}
                <Animated.View 
                    style={[
                        styles.card,
                        animatedCardStyle,
                        { 
                            backgroundColor: theme.dark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)',
                            borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                        }
                    ]}
                    entering={FadeInUp.delay(200).springify()}
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
                    </Text>

                    <View style={styles.buttonContainer}>
                        <Button 
                            onPress={() => router.push("/pre-signin")}
                            contentStyle={{ paddingVertical: 8 }}
                            style={{ borderRadius: 12 }}
                            mode="contained"
                        >
                            Join as Brand / Agency
                        </Button>
                        
                        <Button 
                            mode={"outlined"} 
                            onPress={() => {
                                if (Platform.OS === "web")
                                    window.open(CREATORS_FE_URL, "_blank");
                                else
                                    router.push("/wrong-app")
                            }}
                            contentStyle={{ paddingVertical: 8 }}
                            style={{ borderRadius: 12, borderWidth: 1.5 }}
                        >
                            Join as Influencer
                        </Button>
                    </View>
                </Animated.View>
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
    },
    marqueeLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    card: {
        width: "90%",
        maxWidth: 400,
        padding: 32,
        borderRadius: 24,
        alignItems: "center",
        zIndex: 10,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logo: {
        height: 50,
        width: 180,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 32,
        textAlign: "center",
        opacity: 0.8,
    },
    buttonContainer: {
        width: "100%",
        gap: 16,
    },
});

export default LetsStartMobile;
