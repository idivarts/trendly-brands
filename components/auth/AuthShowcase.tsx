import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const SCENE_MS = 3200;
const CAPTIONS = [
    "Map your content pillars",
    "Draft captions with AI",
    "Schedule it on your calendar",
    "Publish & watch it perform",
];

const prefersReducedMotion = () =>
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Self-playing product walkthrough for the auth left pane. A dark "studio"
 * stage runs a looping 4-scene demo reel — ideate → compose → schedule →
 * publish — so visitors *see* the content workflow in motion instead of
 * reading a feature list. Mock UI only; web-first (the pane is web-wide only).
 */
const AuthShowcase: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { height } = useBreakpoints();
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const reduced = useMemo(() => prefersReducedMotion(), []);
    const [idx, setIdx] = useState(0);
    const active = useSharedValue(0);

    const stageHeight = Math.max(560, Math.min(760, height - 120));

    // Scene loop
    useEffect(() => {
        if (reduced) return;
        const id = setInterval(() => {
            setIdx((prev) => {
                const next = (prev + 1) % CAPTIONS.length;
                active.value = next;
                return next;
            });
        }, SCENE_MS);
        return () => clearInterval(id);
    }, [reduced, active]);

    // Scene 2 — typewriter caption
    const FULL_CAPTION = "5 skincare myths, busted ✨";
    const [typed, setTyped] = useState("");
    useEffect(() => {
        if (idx !== 1) { setTyped(""); return; }
        let i = 0;
        const id = setInterval(() => {
            i += 1;
            setTyped(FULL_CAPTION.slice(0, i));
            if (i >= FULL_CAPTION.length) clearInterval(id);
        }, 55);
        return () => clearInterval(id);
    }, [idx]);

    // Scene 4 — ticking counters
    const [views, setViews] = useState(0);
    const [likes, setLikes] = useState(0);
    useEffect(() => {
        if (idx !== 3) { setViews(0); setLikes(0); return; }
        let f = 0;
        const id = setInterval(() => {
            f += 1;
            const p = Math.min(1, f / 22);
            setViews(Math.round(1240 * p));
            setLikes(Math.round(312 * p));
            if (f >= 22) clearInterval(id);
        }, 45);
        return () => clearInterval(id);
    }, [idx]);

    const sceneStyle = (i: number) =>
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useAnimatedStyle(() => ({
            opacity: withTiming(active.value === i ? 1 : 0, { duration: 550 }),
            transform: [{ translateY: withTiming(active.value === i ? 0 : 18, { duration: 550 }) }],
        }));

    const s0 = sceneStyle(0);
    const s1 = sceneStyle(1);
    const s2 = sceneStyle(2);
    const s3 = sceneStyle(3);

    return (
        <LinearGradient
            colors={[colors.primaryDark, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.stage, { height: stageHeight }]}
        >
            {/* ambient glow accents */}
            <View pointerEvents="none" style={[styles.glow, styles.glowTop, { backgroundColor: colors.secondary }]} />
            <View pointerEvents="none" style={[styles.glow, styles.glowBottom, { backgroundColor: colors.success }]} />

            <Text style={styles.kicker}>TRENDLY · SOCIAL CONTENT, AUTOMATED</Text>
            <Text style={styles.title}>From idea to published — without the busywork.</Text>

            {/* Scene stage */}
            <View style={styles.canvas}>
                <Animated.View style={[styles.scene, s0]}>{renderIdeate(styles, colors)}</Animated.View>
                <Animated.View style={[styles.scene, s1]}>{renderCompose(styles, colors, typed)}</Animated.View>
                <Animated.View style={[styles.scene, s2]}>{renderSchedule(styles, colors)}</Animated.View>
                <Animated.View style={[styles.scene, s3]}>{renderPublish(styles, colors, views, likes)}</Animated.View>
            </View>

            {/* Caption + progress */}
            <View style={styles.footer}>
                <Text style={styles.caption}>{CAPTIONS[idx]}</Text>
                <View style={styles.dots}>
                    {CAPTIONS.map((_, i) => (
                        <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
                    ))}
                </View>
            </View>
        </LinearGradient>
    );
};

/* ---------------- Scenes ---------------- */

function renderIdeate(s: any, colors: ReturnType<typeof Colors>) {
    const pillars = [
        { t: "Education", chips: ["5 skincare myths", "Ingredient 101"] },
        { t: "Social proof", chips: ["Before / after", "Reviews"] },
    ];
    return (
        <View style={s.card}>
            <Text style={s.cardHead}>Content pillars</Text>
            <View style={s.pillarRow}>
                {pillars.map((p) => (
                    <View key={p.t} style={s.pillarCol}>
                        <Text style={s.pillarTitle}>{p.t}</Text>
                        {p.chips.map((c) => (
                            <View key={c} style={s.ideaChip}>
                                <Text style={s.ideaChipText}>{c}</Text>
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
}

function renderCompose(s: any, colors: ReturnType<typeof Colors>, typed: string) {
    return (
        <View style={s.card}>
            <View style={s.composeTop}>
                <View style={s.thumb}>
                    <Ionicons name="image-outline" size={26} color={colors.secondary} />
                </View>
                <View style={s.aiBadge}>
                    <Ionicons name="sparkles" size={12} color={colors.onPrimary} />
                    <Text style={s.aiBadgeText}>AI draft</Text>
                </View>
            </View>
            <Text style={s.composeLabel}>Caption</Text>
            <Text style={s.composeCaption}>
                {typed}
                <Text style={s.caret}>|</Text>
            </Text>
        </View>
    );
}

function renderSchedule(s: any, colors: ReturnType<typeof Colors>) {
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const dots: Record<number, string> = { 1: colors.secondary, 2: colors.primary, 4: colors.success };
    return (
        <View style={s.card}>
            <View style={s.schedRow}>
                <Text style={s.cardHead}>This week</Text>
                <View style={s.timePill}>
                    <Ionicons name="time-outline" size={12} color={colors.primary} />
                    <Text style={s.timePillText}>Tue · 9:00 AM</Text>
                </View>
            </View>
            <View style={s.calRow}>
                {days.map((d, i) => (
                    <View key={i} style={[s.calCell, i === 1 && s.calCellActive]}>
                        <Text style={[s.calDay, i === 1 && s.calDayActive]}>{d}</Text>
                        {dots[i] ? <View style={[s.calDot, { backgroundColor: dots[i] }]} /> : <View style={s.calDotEmpty} />}
                    </View>
                ))}
            </View>
            <View style={s.schedChip}>
                <View style={s.thumbSm}><Ionicons name="image-outline" size={14} color={colors.secondary} /></View>
                <Text style={s.schedChipText}>Reel · “5 skincare myths”</Text>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            </View>
        </View>
    );
}

function renderPublish(s: any, colors: ReturnType<typeof Colors>, views: number, likes: number) {
    return (
        <View style={s.card}>
            <View style={s.publishHead}>
                <View style={s.liveDot} />
                <Text style={s.publishLive}>Published</Text>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            </View>
            <View style={s.thumbWide}>
                <Ionicons name="play-circle" size={30} color={colors.secondary} />
            </View>
            <View style={s.statRow}>
                <View style={s.stat}>
                    <Text style={s.statNum}>{views.toLocaleString()}</Text>
                    <Text style={s.statLabel}>views</Text>
                </View>
                <View style={s.stat}>
                    <Text style={s.statNum}>{likes.toLocaleString()}</Text>
                    <Text style={s.statLabel}>likes</Text>
                </View>
            </View>
        </View>
    );
}

/* ---------------- Styles ---------------- */

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        stage: {
            borderRadius: 28,
            padding: 28,
            overflow: "hidden",
            maxWidth: 520,
            alignSelf: "center",
            width: "100%",
            justifyContent: "space-between",
        },
        glow: {
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: 180,
            opacity: 0.18,
        },
        glowTop: { top: -150, right: -120 },
        glowBottom: { bottom: -160, left: -130 },

        kicker: {
            color: colors.secondary,
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 1.6,
        },
        title: {
            color: colors.white,
            fontSize: 26,
            lineHeight: 33,
            fontWeight: "800",
            marginTop: 10,
            maxWidth: 420,
        },

        canvas: {
            flex: 1,
            marginVertical: 22,
            alignItems: "center",
            justifyContent: "center",
        },
        scene: {
            ...StyleSheet.absoluteFillObject,
            alignItems: "center",
            justifyContent: "center",
        },

        // Generic mock card
        card: {
            width: "100%",
            maxWidth: 360,
            backgroundColor: colors.white,
            borderRadius: 18,
            padding: 18,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.28,
            shadowRadius: 30,
            elevation: 12,
        },
        cardHead: { color: colors.text, fontSize: 13, fontWeight: "800", marginBottom: 12 },

        // Ideate
        pillarRow: { flexDirection: "row", gap: 12 },
        pillarCol: { flex: 1, gap: 8 },
        pillarTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
        ideaChip: { backgroundColor: colors.aliceBlue, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 10 },
        ideaChipText: { color: colors.primary, fontSize: 12, fontWeight: "600" },

        // Compose
        composeTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
        thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.aliceBlue, alignItems: "center", justifyContent: "center" },
        aiBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.primary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
        aiBadgeText: { color: colors.onPrimary, fontSize: 11, fontWeight: "800" },
        composeLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
        composeCaption: { color: colors.text, fontSize: 16, fontWeight: "600", lineHeight: 24, marginTop: 6, minHeight: 48 },
        caret: { color: colors.secondary, fontWeight: "400" },

        // Schedule
        schedRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
        timePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.aliceBlue, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999 },
        timePillText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
        calRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
        calCell: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, gap: 8 },
        calCellActive: { backgroundColor: colors.aliceBlue },
        calDay: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
        calDayActive: { color: colors.primary },
        calDot: { width: 6, height: 6, borderRadius: 3 },
        calDotEmpty: { width: 6, height: 6, borderRadius: 3, backgroundColor: "transparent" },
        schedChip: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, backgroundColor: colors.aliceBlue, borderRadius: 12, padding: 10 },
        thumbSm: { width: 28, height: 28, borderRadius: 7, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
        schedChipText: { flex: 1, color: colors.text, fontSize: 12, fontWeight: "700" },

        // Publish
        publishHead: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 12 },
        liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
        publishLive: { color: colors.text, fontSize: 13, fontWeight: "800", flex: 1 },
        thumbWide: { width: "100%", height: 96, borderRadius: 12, backgroundColor: colors.aliceBlue, alignItems: "center", justifyContent: "center" },
        statRow: { flexDirection: "row", gap: 12, marginTop: 14 },
        stat: { flex: 1, backgroundColor: colors.aliceBlue, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
        statNum: { color: colors.primary, fontSize: 20, fontWeight: "900" },
        statLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 2 },

        // Footer
        footer: { gap: 12 },
        caption: { color: colors.white, fontSize: 15, fontWeight: "700" },
        dots: { flexDirection: "row", gap: 7 },
        dot: { width: 22, height: 4, borderRadius: 2, backgroundColor: colors.secondary, opacity: 0.35 },
        dotActive: { opacity: 1, backgroundColor: colors.white },
    });
}

export default AuthShowcase;
