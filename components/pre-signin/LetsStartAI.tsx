import AmbientBackground from "@/components/pre-signin/AmbientBackground";
import AuthCard from "@/components/pre-signin/AuthCard";
import { fbox, fs, lh } from "@/constants/Typography";
import AppLayout from "@/layouts/app-layout";
import { CREATORS_FE_URL } from "@/shared-constants/app";
import { track } from "@/shared-libs/utils/analytics";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADLINE = "What can I create for you?";
// Phone measure (~327pt) breaks the headline after "for", stranding "you?" as a
// centered orphan. Break it by hand instead, into two balanced lines.
const HEADLINE_NARROW = "What can I create\nfor you?";

const SUBHEAD =
    "Your social content command center — describe a goal and Trendly helps you plan, create, and ship it.";
// Same promise, two lines instead of three — a 2-line display headline followed
// by a 3-line centered paragraph is five stacked centered lines, which stops
// being scannable.
const SUBHEAD_NARROW = "Describe a goal — Trendly plans, creates, and ships it.";

const PLACEHOLDER = "Describe what you need — a content plan, a week of posts, a campaign…";
// Keeps the resting dock exactly one line tall.
const PLACEHOLDER_NARROW = "Describe what you need…";

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
    const insets = useSafeAreaInsets();
    const styles = useMemo(
        () => makeStyles(colors, insets.top, insets.bottom),
        [colors, insets.top, insets.bottom],
    );

    // KeyboardAvoidingView's `padding` math uses a parent-relative frame against a
    // screen-space keyboard, so the hero (which sits below the top nav) needs its
    // on-screen Y as keyboardVerticalOffset — otherwise the keyboard overlaps the
    // prompt box. Measure it and feed it back. iOS-only — Android relies on the
    // system window resize instead.
    const kbRootRef = useRef<View>(null);
    const [kbVerticalOffset, setKbVerticalOffset] = useState(0);
    const measureKbOffset = useCallback(() => {
        if (Platform.OS !== "ios") return;
        kbRootRef.current?.measureInWindow((_x, y) => {
            if (typeof y === "number" && Number.isFinite(y)) {
                setKbVerticalOffset((prev) => (Math.abs(prev - y) > 1 ? y : prev));
            }
        });
    }, []);

    const [prompt, setPrompt] = useState("");
    const [authOpen, setAuthOpen] = useState(false);
    const inputRef = useRef<TextInput>(null);

    // Tapping a suggestion fills the prompt — focus the input straight after so
    // the keyboard rising *is* the confirmation that the tap landed. Without it
    // the only feedback is text appearing in a box at the other end of the
    // screen, which on a phone reads as nothing having happened.
    const handleSuggestionPress = useCallback((label: string) => {
        setPrompt(label);
        requestAnimationFrame(() => inputRef.current?.focus());
    }, []);

    const showAuth = () => {
        // Drop the keyboard first so the auth modal isn't half-covered by it.
        Keyboard.dismiss();
        setAuthOpen(true);
    };

    const openAuth = (intent: string) => {
        if (intent?.trim()) {
            // Stash the intent so we can personalize once they're in.
            PersistentStorage.set("pending_brand_prompt", intent.trim()).catch(() => { });
        }
        track("lets_start_intent", { has_prompt: !!intent?.trim() });
        showAuth();
    };

    const handleCreatorPress = () => {
        if (Platform.OS === "web") {
            Linking.openURL(CREATORS_FE_URL).catch(() => { });
        } else {
            router.push("/wrong-app");
        }
    };

    const promptBox = (
        <View style={[styles.promptBox, !isWide && styles.promptBoxDocked]}>
            <TextInput
                ref={inputRef}
                value={prompt}
                onChangeText={setPrompt}
                placeholder={isWide ? PLACEHOLDER : PLACEHOLDER_NARROW}
                placeholderTextColor={colors.textSecondary}
                style={[styles.promptInput, !isWide && styles.promptInputDocked]}
                multiline
                onSubmitEditing={() => openAuth(prompt)}
                returnKeyType="go"
                accessibilityLabel="Describe what you want to create"
            />
            <View style={styles.promptFooter}>
                {/* Everything on this page funnels to the same auth modal —
                    attaching a file is no exception, so the affordance stays
                    live rather than being a decorative dead button. */}
                <Pressable
                    onPress={() => openAuth(prompt)}
                    accessibilityRole="button"
                    accessibilityLabel="Attach a file"
                    accessibilityHint="Sign in to attach files"
                    hitSlop={6}
                    style={({ pressed }) => [styles.plusBtn, pressed && { opacity: 0.7 }]}
                >
                    <Ionicons name="add" size={22} color={colors.text} />
                </Pressable>
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
    );

    // Wide: pills that wrap inside a roomy centered column.
    const suggestionChips = (
        <View style={styles.chips}>
            {SUGGESTIONS.map((s) => (
                <Pressable
                    key={s.label}
                    onPress={() => handleSuggestionPress(s.label)}
                    style={({ pressed }) => [styles.chip, pressed && { opacity: 0.8 }]}
                    accessibilityRole="button"
                    accessibilityLabel={s.label}
                >
                    <Ionicons name={s.icon as any} size={16} color={colors.textSecondary} />
                    <Text style={styles.chipText}>{s.label}</Text>
                </Pressable>
            ))}
        </View>
    );

    // Narrow: the same pills wrapped 1/2/1 into a staircase — four labels of very
    // different lengths can never align under a centered `flexWrap`. Full-width
    // rows share both edges instead, so the block is symmetric by construction,
    // and they give it enough mass to hold the center of the screen.
    const suggestionList = (
        <View style={styles.suggestionList}>
            {SUGGESTIONS.map((s) => (
                <Pressable
                    key={s.label}
                    onPress={() => handleSuggestionPress(s.label)}
                    style={({ pressed }) => [styles.suggestionRow, pressed && { opacity: 0.8 }]}
                    accessibilityRole="button"
                    accessibilityLabel={s.label}
                >
                    <Ionicons name={s.icon as any} size={18} color={colors.textSecondary} />
                    <Text style={styles.suggestionRowText} numberOfLines={1}>{s.label}</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
                </Pressable>
            ))}
        </View>
    );

    return (
        <AppLayout withWebPadding={false}>
            <AmbientBackground>
                {/* Top nav */}
                <View style={[styles.nav, !isWide && styles.navNarrow]}>
                    <Pressable onPress={() => Linking.openURL("https://www.trendly.now")} accessibilityLabel="Trendly home">
                        <Image
                            source={require("@/assets/images/branding/trendly-primary-horizontal-navy.png")}
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
                            onPress={showAuth}
                            hitSlop={8}
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.signInBtn, pressed && { opacity: 0.85 }]}
                        >
                            <Text style={styles.signInText}>Sign in</Text>
                        </Pressable>
                        <Pressable
                            onPress={showAuth}
                            hitSlop={8}
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.signUpBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                        >
                            <Text style={styles.signUpText}>Sign up</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Hero.
                    Wide (desktop web): one centered column — intent and input
                    read as a single block, the way a desktop prompt page should.
                    Narrow: the prompt is docked to the bottom edge above the
                    keyboard, and the intent block (headline → subhead →
                    suggestions) centers in the space left above it. That puts the
                    primary action in the thumb zone, keeps it visible while a
                    suggestion is tapped, and stops the keyboard from shoving the
                    whole hero off-screen. */}
                <View ref={kbRootRef} style={styles.fill} onLayout={measureKbOffset}>
                    <KeyboardAvoidingView
                        style={styles.fill}
                        // Android's window already resizes (Expo's default
                        // `softwareKeyboardLayoutMode: "resize"`), so `height`
                        // here would shrink the view a second time.
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        keyboardVerticalOffset={kbVerticalOffset}
                    >
                        <ScrollView
                            style={styles.fill}
                            contentContainerStyle={isWide ? styles.heroScroll : styles.heroScrollNarrow}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.heroInner}>
                                <Text style={[styles.headline, isWide ? styles.headlineWide : styles.headlineNarrow]}>
                                    {isWide ? HEADLINE : HEADLINE_NARROW}
                                </Text>
                                <Text style={[styles.subhead, !isWide && styles.subheadNarrow]}>
                                    {isWide ? SUBHEAD : SUBHEAD_NARROW}
                                </Text>

                                {isWide ? (
                                    <>
                                        {promptBox}
                                        {suggestionChips}
                                    </>
                                ) : (
                                    <>
                                        {/* Without a cue, four rows under a subhead
                                            read as feature blurbs rather than as things
                                            to tap — especially now that the input they
                                            fill is at the far end of the screen. */}
                                        <Text style={styles.suggestionsLabel}>Try one of these</Text>
                                        {suggestionList}
                                    </>
                                )}
                            </View>
                        </ScrollView>

                        {!isWide && <View style={styles.dock}>{promptBox}</View>}
                    </KeyboardAvoidingView>
                </View>

                {/* Auth modal — floats over the same ambient canvas. The card now
                    carries an email input (AuthCard), so it's wrapped in a
                    KeyboardAvoidingView: on native the centered card lifts above
                    the keyboard instead of being covered by it. The overlay is
                    absolute-fill from the screen top, so no keyboardVerticalOffset
                    is needed (unlike the hero, which sits below the nav). */}
                {authOpen && (
                    <KeyboardAvoidingView
                        style={styles.modalRoot}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                    >
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
                    </KeyboardAvoidingView>
                )}
            </AmbientBackground>
        </AppLayout>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>, topInset: number, bottomInset: number) {
    return StyleSheet.create({
        fill: { flex: 1 },
        nav: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 32,
            paddingTop: topInset + 18,
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
            color: colors.textSecondary,
            fontSize: fs(14),
            fontWeight: "600",
        },
        signInBtn: {
            paddingHorizontal: 16,
            height: 40,
            justifyContent: "center",
        },
        signInText: {
            color: colors.text,
            fontSize: fs(14),
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
            fontSize: fs(14),
            fontWeight: "700",
        },

        heroScroll: {
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 48,
        },
        // Narrow: top-aligned, so the intent block sits under the nav instead of
        // drifting to the middle once the dock takes the bottom of the screen.
        // Centered in whatever is left between the nav and the dock. `flexGrow: 1`
        // keeps the centering purely optical — once the block is taller than that
        // space (short device, keyboard up) it reverts to a normal scroll.
        heroScrollNarrow: {
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 24,
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
        headlineWide: {
            fontSize: fs(52),
            lineHeight: lh(60),
        },
        headlineNarrow: {
            fontSize: fs(30),
            lineHeight: lh(37),
        },
        subhead: {
            marginTop: 16,
            fontSize: fs(16),
            lineHeight: lh(24),
            textAlign: "center",
            color: colors.textSecondary,
            maxWidth: 560,
        },
        subheadNarrow: {
            marginTop: 12,
            fontSize: fs(15),
            lineHeight: lh(22),
            maxWidth: 320,
        },
        suggestionsLabel: {
            marginTop: 26,
            fontSize: fs(12),
            lineHeight: lh(16),
            fontWeight: "700",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            textAlign: "center",
            color: colors.textSecondary,
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
        // Docked variant: flush to the bottom bar, and the shadow points *up*
        // over the content it floats above.
        promptBoxDocked: {
            marginTop: 0,
            paddingTop: 14,
            paddingBottom: 12,
            shadowOffset: { width: 0, height: -4 },
            shadowRadius: 8,
            shadowOpacity: 0.05,
            ...Platform.select({ android: { elevation: 4 } }),
        },
        promptInput: {
            minHeight: fbox(48),
            maxHeight: 160,
            fontSize: fs(17),
            lineHeight: lh(24),
            color: colors.text,
            ...Platform.select({ web: { outlineStyle: "none" } as any }),
        },
        // With the keyboard up there is far less room, so the input grows less
        // before it starts scrolling internally.
        promptInputDocked: {
            maxHeight: 112,
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
            height: fbox(40),
            borderRadius: 999,
            backgroundColor: colors.tag,
        },
        chipText: {
            color: colors.text,
            fontSize: fs(14),
            fontWeight: "600",
        },

        suggestionList: {
            marginTop: 14,
            width: "100%",
            gap: 10,
        },
        suggestionRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            height: fbox(52),
            borderRadius: 16,
            backgroundColor: colors.tag,
        },
        suggestionRowText: {
            flex: 1,
            color: colors.text,
            fontSize: fs(15),
            lineHeight: lh(20),
            fontWeight: "600",
        },

        // Bottom-docked prompt bar. `bottomInset` keeps it clear of the home
        // indicator when the keyboard is down; when the keyboard is up the
        // KeyboardAvoidingView padding sits underneath it.
        dock: {
            // Matches `heroScrollNarrow` so the dock, the suggestion rows and the
            // text block all share one left/right edge.
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: Math.max(bottomInset, 12),
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
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 24,
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
