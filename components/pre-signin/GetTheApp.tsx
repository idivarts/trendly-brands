import AmbientBackground from "@/components/pre-signin/AmbientBackground";
import { fbox, fs, lh } from "@/constants/Typography";
import AppLayout from "@/layouts/app-layout";
import {
    BRANDS_APPSTORE_URL,
    BRANDS_PLAYSTORE_URL,
} from "@/shared-constants/app";
import { track } from "@/shared-libs/utils/analytics";
import { useMyNavigation } from "@/shared-libs/utils/router";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import {
    chooseWeb,
    guessDevicePlatform,
    type DevicePlatformGuess,
} from "@/utils/app-download-gate";
import { withAlpha } from "@/utils/color";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADLINE = "Trendly is built for\nyour phone";
const SUBHEAD =
    "Plan, create and schedule your posts from the app — the full studio, in your pocket.";

/**
 * The mobile-web interstitial. Sits between a marketing CTA and the web app,
 * and offers the native app first.
 *
 * Deliberately a single screenful with ONE illustration and two decisions:
 * install, or carry on. Anything more to read here is friction in front of a
 * product the visitor hasn't seen yet. The "continue on web" door is always
 * visible — a gate you cannot walk past is a bounce, not a conversion.
 */
const GetTheApp: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { height } = useBreakpoints();
    const insets = useSafeAreaInsets();

    // A 568pt-tall phone in landscape, or a short browser window, can't hold the
    // full-size mock plus both buttons — shrink the illustration rather than
    // pushing the primary action below the fold.
    const compactArt = height < 720;
    const styles = useMemo(
        () => makeStyles(colors, insets.top, insets.bottom, compactArt),
        [colors, insets.top, insets.bottom, compactArt],
    );

    // One dot per platform the post is queued for — three distinct brand tokens
    // rather than three shades of primary, so the rows read as different
    // destinations at thumbnail size.
    const postRowColors = useMemo(
        () => [colors.gold, colors.green, colors.onPrimary],
        [colors.gold, colors.green, colors.onPrimary],
    );

    const platform = useMemo<DevicePlatformGuess>(() => guessDevicePlatform(), []);
    const { resetAndNavigate } = useMyNavigation();

    // The gate's own impression. Without it the action events have no
    // denominator, and "did the interstitial help or cost us signups" is
    // unanswerable — which is the only question this screen raises.
    const shownRef = useRef(false);
    useEffect(() => {
        if (shownRef.current) return;
        shownRef.current = true;
        track("app_download_gate_shown", { platform_guess: platform });
    }, [platform]);

    const openStore = (store: "appstore" | "playstore") => {
        track("app_download_gate_action", { action: store, platform_guess: platform });
        const url = store === "appstore" ? BRANDS_APPSTORE_URL : BRANDS_PLAYSTORE_URL;
        Linking.openURL(url).catch(() => { });
    };

    const continueOnWeb = async () => {
        track("app_download_gate_action", {
            action: "continue_web",
            platform_guess: platform,
        });
        // Remember the choice BEFORE navigating: /lets-start reads the same flag
        // on mount, so a race here would bounce the user straight back to this
        // screen they just dismissed.
        await chooseWeb().catch(() => { });
        resetAndNavigate("/lets-start");
    };

    // Lead with the store the device can actually use. An unknown UA (desktop
    // browser at a narrow width, an in-app webview) gets both, iOS first.
    const primaryStore = platform === "android" ? "playstore" : "appstore";
    const secondaryStore = primaryStore === "appstore" ? "playstore" : "appstore";
    const showBothStores = platform === "unknown";

    const storeButton = (store: "appstore" | "playstore", primary: boolean) => (
        <Pressable
            onPress={() => openStore(store)}
            accessibilityRole="button"
            accessibilityLabel={
                store === "appstore"
                    ? "Download on the App Store"
                    : "Get it on Google Play"
            }
            style={({ pressed }) => [
                styles.storeBtn,
                primary ? styles.storeBtnPrimary : styles.storeBtnSecondary,
                pressed && styles.pressed,
            ]}
        >
            <Ionicons
                name={store === "appstore" ? "logo-apple" : "logo-google-playstore"}
                size={22}
                color={primary ? colors.onPrimary : colors.text}
            />
            <View style={styles.storeLabels}>
                <Text
                    style={[styles.storeKicker, !primary && styles.storeKickerSecondary]}
                >
                    {store === "appstore" ? "Download on the" : "Get it on"}
                </Text>
                <Text style={[styles.storeName, !primary && styles.storeNameSecondary]}>
                    {store === "appstore" ? "App Store" : "Google Play"}
                </Text>
            </View>
        </Pressable>
    );

    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["left", "right"]}>
            <AmbientBackground>
                <ScrollView
                    style={styles.fill}
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    <Image
                        source={require("@/assets/images/branding/trendly-primary-horizontal-navy.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    {/* ── Illustration ───────────────────────────────────────
                        Drawn from primitives rather than shipped as a PNG: it
                        has to read correctly in both themes and at any phone
                        width, which a flat raster export cannot do. */}
                    {/* No entering animation: reanimated's web `entering` starts at
                        opacity 0 and is driven by rAF, which a backgrounded or
                        throttled tab never runs — the whole illustration then
                        stays invisible. On the one screen standing between a
                        marketing click and the product, a blank frame costs more
                        than the fade is worth. */}
                    <View style={styles.art}>
                        <View style={styles.artGlow} />

                        <View style={styles.phone}>
                            <View style={styles.notch} />
                            <View style={styles.phoneHeader}>
                                {/* The app tile. `app-icon.png` is the store
                                    export — a navy badge baked onto a pink/
                                    yellow gradient canvas — so at 26pt it reads
                                    as a pink square. The transparent symbol on
                                    a white tile is the same mark, cleanly. */}
                                <View style={styles.phoneAppIcon}>
                                    <Image
                                        source={require("@/assets/images/branding/trendly-symbol.png")}
                                        style={styles.phoneAppIconMark}
                                        resizeMode="contain"
                                    />
                                </View>
                                <View style={styles.phoneHeaderText}>
                                    <View style={styles.barWide} />
                                    <View style={styles.barNarrow} />
                                </View>
                            </View>

                            {postRowColors.map((dotColor, i) => (
                                <View key={i} style={styles.postCard}>
                                    <View
                                        style={[styles.platformDot, { backgroundColor: dotColor }]}
                                    />
                                    <View style={styles.postLines}>
                                        <View style={styles.barWide} />
                                        <View style={styles.barNarrow} />
                                    </View>
                                </View>
                            ))}

                            <View style={styles.composer}>
                                <Ionicons name="sparkles" size={12} color={colors.primary} />
                                <View style={styles.composerBar} />
                            </View>
                        </View>

                        {/* Floating proof chips — they say what the app does
                            (schedules, publishes) without another paragraph. */}
                        <View style={[styles.chip, styles.chipTop]}>
                            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                            <Text style={styles.chipText}>Posted</Text>
                        </View>
                        <View style={[styles.chip, styles.chipBottom]}>
                            <Ionicons name="time-outline" size={14} color={colors.primary} />
                            <Text style={styles.chipText}>Tomorrow, 9:00</Text>
                        </View>
                    </View>

                    <View style={styles.copy}>
                        <Text style={styles.eyebrow}>Available on iOS & Android</Text>
                        <Text style={styles.headline}>{HEADLINE}</Text>
                        <Text style={styles.subhead}>{SUBHEAD}</Text>
                    </View>

                    <View style={styles.actions}>
                        {storeButton(primaryStore, true)}
                        {showBothStores && storeButton(secondaryStore, false)}

                        <Pressable
                            onPress={continueOnWeb}
                            accessibilityRole="button"
                            accessibilityLabel="Continue on web"
                            hitSlop={10}
                            style={({ pressed }) => [styles.webBtn, pressed && styles.pressed]}
                        >
                            <Text style={styles.webBtnText}>Continue on web</Text>
                            <Ionicons name="arrow-forward" size={15} color={colors.textSecondary} />
                        </Pressable>
                    </View>
                </ScrollView>
            </AmbientBackground>
        </AppLayout>
    );
};

function makeStyles(
    colors: ReturnType<typeof Colors>,
    topInset: number,
    bottomInset: number,
    compactArt: boolean,
) {
    const phoneWidth = compactArt ? 134 : 164;
    const phoneHeight = compactArt ? 212 : 254;

    return StyleSheet.create({
        fill: { flex: 1 },
        scroll: {
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingTop: topInset + 20,
            paddingBottom: bottomInset + 28,
            gap: compactArt ? 18 : 26,
        },
        logo: {
            width: 92,
            height: 40,
        },

        // ── Illustration ────────────────────────────────────────────────────
        art: {
            width: "100%",
            maxWidth: 320,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 8,
        },
        artGlow: {
            position: "absolute",
            width: 236,
            height: 236,
            borderRadius: 118,
            backgroundColor: withAlpha(colors.primary, 0.12),
        },
        // A brand-navy slab, not a white one. A `colors.card` phone sits white-
        // on-white against this page and disappears into it — shadow alone is
        // not enough separation at thumbnail size, and the floating chips had
        // nothing to pop against either.
        phone: {
            width: phoneWidth,
            height: phoneHeight,
            borderRadius: 26,
            backgroundColor: colors.primary,
            paddingHorizontal: 10,
            paddingTop: 12,
            paddingBottom: 10,
            gap: 7,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 16 },
            shadowRadius: 32,
            shadowOpacity: 0.3,
            elevation: 12,
        },
        notch: {
            alignSelf: "center",
            width: 34,
            height: 4,
            borderRadius: 2,
            backgroundColor: withAlpha(colors.onPrimary, 0.35),
        },
        phoneHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 2,
        },
        phoneAppIcon: {
            width: 26,
            height: 26,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.onPrimary,
        },
        phoneAppIconMark: {
            width: 15,
            height: 15,
        },
        phoneHeaderText: {
            flex: 1,
            gap: 4,
        },
        postCard: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderRadius: 12,
            backgroundColor: withAlpha(colors.onPrimary, 0.14),
            paddingHorizontal: 8,
            paddingVertical: 9,
        },
        platformDot: {
            width: 14,
            height: 14,
            borderRadius: 7,
        },
        postLines: {
            flex: 1,
            gap: 4,
        },
        barWide: {
            height: 5,
            borderRadius: 3,
            backgroundColor: withAlpha(colors.onPrimary, 0.55),
        },
        barNarrow: {
            height: 5,
            width: "55%",
            borderRadius: 3,
            backgroundColor: withAlpha(colors.onPrimary, 0.28),
        },
        // Inverted against the rows above it: on the navy screen the one solid
        // white element is unambiguously the primary action.
        composer: {
            marginTop: "auto",
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            borderRadius: 14,
            backgroundColor: colors.onPrimary,
            paddingHorizontal: 10,
            paddingVertical: 9,
        },
        composerBar: {
            flex: 1,
            height: 5,
            borderRadius: 3,
            backgroundColor: withAlpha(colors.primary, 0.35),
        },
        chip: {
            position: "absolute",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderRadius: 999,
            backgroundColor: colors.card,
            paddingHorizontal: 11,
            paddingVertical: 7,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            shadowOpacity: 0.12,
            elevation: 6,
        },
        chipTop: {
            top: compactArt ? 26 : 42,
            right: compactArt ? 8 : 14,
        },
        chipBottom: {
            bottom: compactArt ? 44 : 70,
            left: compactArt ? 8 : 14,
        },
        chipText: {
            color: colors.text,
            fontSize: fs(11),
            lineHeight: lh(14),
            fontWeight: "700",
        },

        // ── Copy ────────────────────────────────────────────────────────────
        copy: {
            width: "100%",
            maxWidth: 360,
            alignItems: "center",
        },
        eyebrow: {
            color: colors.textSecondary,
            fontSize: fs(11),
            lineHeight: lh(15),
            fontWeight: "700",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            textAlign: "center",
        },
        headline: {
            marginTop: 10,
            color: colors.text,
            fontSize: fs(27),
            lineHeight: lh(34),
            fontWeight: "600",
            letterSpacing: -0.4,
            textAlign: "center",
        },
        subhead: {
            marginTop: 10,
            color: colors.textSecondary,
            fontSize: fs(15),
            lineHeight: lh(22),
            textAlign: "center",
            maxWidth: 320,
        },

        // ── Actions ─────────────────────────────────────────────────────────
        actions: {
            width: "100%",
            maxWidth: 360,
            gap: 12,
        },
        storeBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            borderRadius: 16,
            height: fbox(56),
            paddingHorizontal: 20,
        },
        storeBtnPrimary: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        storeBtnSecondary: {
            backgroundColor: colors.tag,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 2,
        },
        storeLabels: {
            alignItems: "flex-start",
        },
        storeKicker: {
            color: withAlpha(colors.onPrimary, 0.75),
            fontSize: fs(10),
            lineHeight: lh(13),
            fontWeight: "600",
            letterSpacing: 0.3,
            textTransform: "uppercase",
        },
        storeKickerSecondary: {
            color: colors.textSecondary,
        },
        storeName: {
            color: colors.onPrimary,
            fontSize: fs(16),
            lineHeight: lh(21),
            fontWeight: "700",
        },
        storeNameSecondary: {
            color: colors.text,
        },
        webBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            height: fbox(44),
        },
        webBtnText: {
            color: colors.textSecondary,
            fontSize: fs(14),
            lineHeight: lh(19),
            fontWeight: "700",
        },
        pressed: {
            opacity: 0.85,
        },
    });
}

export default GetTheApp;
