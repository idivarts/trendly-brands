import AmbientBackground from "@/components/pre-signin/AmbientBackground";
import AuthCard from "@/components/pre-signin/AuthCard";
import IntroSplash from "@/components/pre-signin/IntroSplash";
import AppLayout from "@/layouts/app-layout";
import { CREATORS_FE_URL } from "@/shared-constants/app";
import { analyticsLogEvent } from "@/shared-libs/utils/firebase/analytics";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Image,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

const HEADLINE = "What can I create for you?";
const PLACEHOLDER = "Describe what you need — a content plan, a week of posts, a campaign…";

const SUGGESTIONS = [
    { icon: "calendar-outline", label: "Plan a content calendar" },
    { icon: "color-wand-outline", label: "Design a post" },
    { icon: "megaphone-outline", label: "Launch a campaign" },
    { icon: "people-outline", label: "Find creators" },
];

const LetsStartAI: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 900;
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const [showSplash, setShowSplash] = useState(true);
    const [hydrated, setHydrated] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [authOpen, setAuthOpen] = useState(false);

    React.useEffect(() => {
        let cancelled = false;
        PersistentStorage.get("lets_start_intro_splash_seen")
            .then((seen) => {
                if (cancelled) return;
                setShowSplash(!seen);
            })
            .catch(() => {
                if (!cancelled) setShowSplash(true);
            })
            .finally(() => {
                if (!cancelled) setHydrated(true);
            });
        return () => { cancelled = true; };
    }, []);

    const handleSplashComplete = async () => {
        setShowSplash(false);
        try {
            await PersistentStorage.set("lets_start_intro_splash_seen", "true");
        } catch {
            // Non-fatal: splash stays hidden for this session regardless.
        }
    };

    const openAuth = (intent: string) => {
        if (intent?.trim()) {
            // Stash the intent so we can personalize once they're in.
            PersistentStorage.set("pending_brand_prompt", intent.trim()).catch(() => { });
        }
        analyticsLogEvent("lets_start_intent", { hasPrompt: !!intent?.trim() });
        setAuthOpen(true);
    };

    const handleCreatorPress = () => {
        if (Platform.OS === "web") {
            Linking.openURL(CREATORS_FE_URL).catch(() => { });
        } else {
            router.push("/wrong-app");
        }
    };

    if (!hydrated) return null;
    if (showSplash) return <IntroSplash onComplete={handleSplashComplete} />;

    return (
        <AppLayout withWebPadding={false}>
            <AmbientBackground>
                {/* Top nav */}
                <View style={[styles.nav, !isWide && styles.navNarrow]}>
                    <Pressable onPress={() => Linking.openURL("https://www.trendly.now")} accessibilityLabel="Trendly home">
                        <Image
                            source={require("@/assets/images/rectangluar blue logo transparent.png")}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </Pressable>
                    <View style={styles.navRight}>
                        {/* {isWide && (
                            <Pressable onPress={handleCreatorPress} hitSlop={8}>
                                <Text style={styles.creatorLink}>Are you an Influencer?</Text>
                            </Pressable>
                        )} */}
                        <Pressable
                            onPress={() => setAuthOpen(true)}
                            style={({ pressed }) => [styles.signInBtn, pressed && { opacity: 0.85 }]}
                        >
                            <Text style={styles.signInText}>Sign in</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setAuthOpen(true)}
                            style={({ pressed }) => [styles.signUpBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                        >
                            <Text style={styles.signUpText}>Sign up</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Hero */}
                <ScrollView
                    contentContainerStyle={styles.heroScroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.heroInner}>
                        <Text style={[styles.headline, { fontSize: isWide ? 52 : 34 }]}>{HEADLINE}</Text>
                        <Text style={styles.subhead}>
                            Your social content command center — describe a goal and Trendly helps you plan, create, and ship it.
                        </Text>

                        {/* Prompt box */}
                        <View style={styles.promptBox}>
                            <TextInput
                                value={prompt}
                                onChangeText={setPrompt}
                                placeholder={PLACEHOLDER}
                                placeholderTextColor={colors.gray100}
                                style={styles.promptInput}
                                multiline
                                onSubmitEditing={() => openAuth(prompt)}
                                returnKeyType="go"
                                accessibilityLabel="Describe what you want to create"
                            />
                            <View style={styles.promptFooter}>
                                <View style={styles.plusBtn}>
                                    <Ionicons name="add" size={22} color={colors.text} />
                                </View>
                                <Pressable
                                    onPress={() => openAuth(prompt)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Submit"
                                    style={({ pressed }) => [styles.sendBtn, pressed && { transform: [{ scale: 0.95 }] }]}
                                >
                                    <Ionicons name="arrow-up" size={20} color={colors.onPrimary} />
                                </Pressable>
                            </View>
                        </View>

                        {/* Suggestion chips */}
                        <View style={styles.chips}>
                            {SUGGESTIONS.map((s) => (
                                <Pressable
                                    key={s.label}
                                    onPress={() => setPrompt(s.label)}
                                    style={({ pressed }) => [styles.chip, pressed && { opacity: 0.8 }]}
                                    accessibilityRole="button"
                                    accessibilityLabel={s.label}
                                >
                                    <Ionicons name={s.icon as any} size={16} color={colors.gray300} />
                                    <Text style={styles.chipText}>{s.label}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Auth modal — floats over the same ambient canvas */}
                {authOpen && (
                    <View style={styles.modalRoot}>
                        <Animated.View entering={FadeIn.duration(180)} style={styles.modalBackdrop}>
                            <Pressable style={StyleSheet.absoluteFill} onPress={() => setAuthOpen(false)} accessibilityLabel="Dismiss" />
                        </Animated.View>
                        <Animated.View entering={FadeIn.duration(200)} style={styles.modalCardWrap} pointerEvents="box-none">
                            <View style={[styles.modalCard, { width: Math.min(420, width - 48) }]}>
                                <Pressable
                                    style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.7 }]}
                                    onPress={() => setAuthOpen(false)}
                                    hitSlop={8}
                                    accessibilityRole="button"
                                    accessibilityLabel="Close"
                                >
                                    <Ionicons name="close" size={20} color={colors.text} />
                                </Pressable>
                                <AuthCard />
                            </View>
                        </Animated.View>
                    </View>
                )}
            </AmbientBackground>
        </AppLayout>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        nav: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 32,
            paddingTop: 18,
            zIndex: 5,
        },
        navNarrow: {
            paddingHorizontal: 20,
        },
        logo: {
            width: 96,
            height: 44,
        },
        navRight: {
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
        },
        creatorLink: {
            color: colors.gray300,
            fontSize: 14,
            fontWeight: "600",
        },
        signInBtn: {
            paddingHorizontal: 16,
            height: 40,
            justifyContent: "center",
        },
        signInText: {
            color: colors.text,
            fontSize: 14,
            fontWeight: "700",
        },
        signUpBtn: {
            paddingHorizontal: 20,
            height: 40,
            borderRadius: 999,
            justifyContent: "center",
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.3,
            ...Platform.select({ android: { elevation: 4 } }),
        },
        signUpText: {
            color: colors.onPrimary,
            fontSize: 14,
            fontWeight: "700",
        },

        heroScroll: {
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 48,
        },
        heroInner: {
            width: "100%",
            maxWidth: 760,
            alignItems: "center",
        },
        headline: {
            fontWeight: "600",
            letterSpacing: -0.5,
            textAlign: "center",
            color: colors.text,
        },
        subhead: {
            marginTop: 16,
            fontSize: 16,
            lineHeight: 24,
            textAlign: "center",
            color: colors.gray300,
            maxWidth: 560,
        },

        promptBox: {
            width: "100%",
            marginTop: 36,
            backgroundColor: colors.card,
            borderRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 14,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 10 },
            shadowRadius: 28,
            shadowOpacity: 0.1,
            ...Platform.select({ android: { elevation: 6 } }),
        },
        promptInput: {
            minHeight: 48,
            maxHeight: 160,
            fontSize: 17,
            lineHeight: 24,
            color: colors.text,
            ...Platform.select({ web: { outlineStyle: "none" } as any }),
        },
        promptFooter: {
            marginTop: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        plusBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        sendBtn: {
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.3,
            ...Platform.select({ android: { elevation: 4 } }),
        },

        chips: {
            marginTop: 22,
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
        },
        chip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 16,
            height: 40,
            borderRadius: 999,
            backgroundColor: colors.tag,
        },
        chipText: {
            color: colors.text,
            fontSize: 14,
            fontWeight: "600",
        },

        modalRoot: {
            ...StyleSheet.absoluteFillObject,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 50,
        },
        modalBackdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors.backdropStrong,
        },
        modalCardWrap: {
            width: "100%",
            alignItems: "center",
        },
        modalCard: {
            alignSelf: "center",
            backgroundColor: colors.card,
            borderRadius: 24,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.22,
            shadowRadius: 44,
            ...Platform.select({ android: { elevation: 16 } }),
        },
        modalClose: {
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 2,
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
    });
}

export default LetsStartAI;
