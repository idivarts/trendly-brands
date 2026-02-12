import ActionCard from "@/components/pre-signin/ActionCard";
import IntroSplash from "@/components/pre-signin/IntroSplash";
import AppLayout from "@/layouts/app-layout";
import { CREATORS_FE_URL } from "@/shared-constants/app";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const LetsStartMobile = () => {
    const theme = useTheme();
    const brandColors = Colors(theme);
    const [showSplash, setShowSplash] = React.useState(true);

    const handleBrandPress = React.useCallback(() => {
        router.push("/pre-signin");
    }, []);

    const handleInfluencerPress = React.useCallback(() => {
        if (Platform.OS === "web") {
            window.open(CREATORS_FE_URL, "_blank");
        } else {
            router.push("/wrong-app");
        }
    }, []);

    if (showSplash) {
        return <IntroSplash onComplete={() => setShowSplash(false)} />;
    }

    return (
        <AppLayout withWebPadding={false}>
            {/* ScrollView allows content to fit on small screens without cut-off */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.container, { backgroundColor: brandColors.background }]}>

                    {/* Header Section */}
                    <View style={styles.header}>
                        <Animated.View entering={FadeInDown.duration(800)}>
                            <Text
                                style={[
                                    styles.heroText,
                                    {
                                        color: brandColors.primary,
                                        textShadowColor: '#00ffff', // Neon cyan glow
                                        textShadowRadius: 20,
                                        textShadowOffset: { width: 0, height: 0 },
                                    }
                                ]}
                            >
                                TRENDLY
                            </Text>
                        </Animated.View>
                        <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                            <Text style={[styles.tagline, { color: brandColors.gray300 }]}>
                                Where Brands Meet Creators.
                            </Text>
                        </Animated.View>
                        <Animated.View entering={FadeInDown.delay(300).duration(800)}>
                            <Text style={[styles.description, { color: brandColors.gray300 }]}>
                                Scale your marketing with data-driven collaborations in real-time.
                            </Text>
                        </Animated.View>
                    </View>

                    {/* Action Cards Section */}
                    <Animated.View
                        entering={FadeInDown.delay(400).duration(800)}
                        style={styles.cardsContainer}
                    >
                        <ActionCard
                            title="Join as Brand / Agency"
                            description="Connect with creators. Amplify your reach."
                            colors={['#0F2027', '#203A43', '#2C5364']}
                            onPress={handleBrandPress}
                        />

                        <ActionCard
                            title="Join as Influencer"
                            description="Monetize your content. Grow your community."
                            colors={['#FF512F', '#DD2476']}
                            onPress={handleInfluencerPress}
                        />
                    </Animated.View>
                </View>
            </ScrollView>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        padding: 24,
        paddingTop: 24,
        justifyContent: 'center', // Center vertically if space allows
    },
    header: {
        marginBottom: 48,
        alignItems: 'center',
    },
    heroText: {
        fontSize: 56,
        fontWeight: '900',
        letterSpacing: -2,
        marginBottom: 8,
        textAlign: 'center',
        fontFamily: Platform.select({
            ios: 'System',
            android: 'sans-serif',
            default: 'System',
        }),
    },
    tagline: {
        fontSize: 18,
        textAlign: 'center',
        opacity: 0.8,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.7,
        marginTop: 12,
        maxWidth: 320,
        lineHeight: 24,
    },
    cardsContainer: {
        width: '100%',
        gap: 16, // Gap support depends on RN version, spacer used above as backup
        paddingBottom: 40,
    },
});

export default LetsStartMobile;
