import Colors from "@/shared-uis/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const SCENE_MS = 3600;

const SCENES = [
    { heading: "Start with a clear strategy", desc: "Turn scattered ideas into content pillars so every post ladders up to a goal." },
    { heading: "Draft on-brand in seconds", desc: "Generate captions and creative with AI, then tweak them to sound like you." },
    { heading: "Plan your whole calendar", desc: "Drop posts onto the right dates and keep a consistent, healthy cadence." },
    { heading: "Publish, then learn", desc: "Auto-publish across channels and watch the results roll in — all in one place." },
];

const prefersReducedMotion = () =>
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Module-level so the walkthrough resumes from where it was when the auth
// layout remounts on navigation between auth pages — the left panel then reads
// as continuous instead of restarting at scene 1.
let persistedScene = 0;

/**
 * Self-playing product walkthrough for the auth left pane. Each toggle changes
 * the visual AND its heading + description together, so the panel teaches the
 * content workflow (ideate → compose → schedule → publish) rather than just
 * cycling images. Lives directly on the branded panel; web-first.
 */
const AuthShowcase: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const reduced = useMemo(() => prefersReducedMotion(), []);
    const [idx, setIdx] = useState(persistedScene);
    const active = useSharedValue(persistedScene);

    useEffect(() => {
        if (reduced) return;
        const id = setInterval(() => {
            setIdx((prev) => {
                const next = (prev + 1) % SCENES.length;
                active.value = next;
                persistedScene = next;
                return next;
            });
        }, SCENE_MS);
        return () => clearInterval(id);
    }, [reduced, active]);

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
            opacity: withTiming(active.value === i ? 1 : 0, { duration: 500 }),
            transform: [{ translateY: withTiming(active.value === i ? 0 : 16, { duration: 500 }) }],
        }));

    const sStyles = [sceneStyle(0), sceneStyle(1), sceneStyle(2), sceneStyle(3)];
    const visuals = [
        renderIdeate(styles, colors),
        renderCompose(styles, colors, typed),
        renderSchedule(styles, colors),
        renderPublish(styles, colors, views, likes),
    ];

    return (
        <View style={styles.wrap}>
            <Text style={styles.kicker}>TRENDLY · SOCIAL CONTENT, AUTOMATED</Text>

            <View style={styles.main}>
                {/* Big animated visual */}
                <View style={styles.visualStage}>
                    {visuals.map((v, i) => (
                        <Animated.View key={i} style={[styles.scene, sStyles[i]]}>{v}</Animated.View>
                    ))}
                </View>

                {/* Per-scene heading + description (crossfades with the visual) */}
                <View style={styles.textStage}>
                    {SCENES.map((sc, i) => (
                        <Animated.View key={i} style={[styles.textScene, sStyles[i]]}>
                            <Text style={styles.heading}>{sc.heading}</Text>
                            <Text style={styles.desc}>{sc.desc}</Text>
                        </Animated.View>
                    ))}
                </View>
            </View>

            <View style={styles.dots}>
                {SCENES.map((_, i) => (
                    <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
                ))}
            </View>
        </View>
    );
};

/* ---------------- Scenes ---------------- */

function renderIdeate(s: any, colors: ReturnType<typeof Colors>) {
    const pillars = [
        { t: "Education", chips: ["5 skincare myths", "Ingredient 101", "How-to routines"] },
        { t: "Social proof", chips: ["Before / after", "Reviews", "UGC"] },
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
                    <Ionicons name="image-outline" size={30} color={colors.secondary} />
                </View>
                <View style={s.aiBadge}>
                    <Ionicons name="sparkles" size={13} color={colors.onPrimary} />
                    <Text style={s.aiBadgeText}>AI draft</Text>
                </View>
            </View>
            <Text style={s.composeLabel}>Caption</Text>
            <Text style={s.composeCaption}>
                {typed}
                <Text style={s.caret}>|</Text>
            </Text>
            <View style={s.composeActions}>
                <View style={s.composeChip}><Text style={s.composeChipText}># skincare</Text></View>
                <View style={s.composeChip}><Text style={s.composeChipText}># routine</Text></View>
            </View>
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
                    <Ionicons name="time-outline" size={13} color={colors.primary} />
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
                <View style={s.thumbSm}><Ionicons name="image-outline" size={16} color={colors.secondary} /></View>
                <Text style={s.schedChipText}>Reel · “5 skincare myths”</Text>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
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
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            </View>
            <View style={s.thumbWide}>
                <Ionicons name="play-circle" size={38} color={colors.secondary} />
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
    const cardShadow = {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.18,
        shadowRadius: 32,
        ...Platform.select({ android: { elevation: 8 } }),
    } as const;

    return StyleSheet.create({
        wrap: {
            flex: 1,
            width: "100%",
            maxWidth: 500,
            alignSelf: "center",
            justifyContent: "space-between",
        },
        kicker: {
            color: colors.secondary,
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 1.8,
        },

        main: {
            flex: 1,
            justifyContent: "center",
        },
        visualStage: {
            height: 380,
            alignItems: "center",
            justifyContent: "center",
        },
        scene: {
            ...StyleSheet.absoluteFillObject,
            alignItems: "center",
            justifyContent: "center",
        },

        textStage: {
            height: 120,
            marginTop: 28,
        },
        textScene: {
            ...StyleSheet.absoluteFillObject,
        },
        heading: {
            color: colors.white,
            fontSize: 26,
            lineHeight: 32,
            fontWeight: "800",
        },
        desc: {
            color: colors.authPanelMuted,
            fontSize: 16,
            lineHeight: 24,
            marginTop: 10,
            maxWidth: 440,
        },

        card: {
            width: "100%",
            maxWidth: 440,
            backgroundColor: colors.card,
            borderRadius: 22,
            padding: 22,
            ...cardShadow,
        },
        cardHead: { color: colors.text, fontSize: 15, fontWeight: "800", marginBottom: 14 },

        pillarRow: { flexDirection: "row", gap: 14 },
        pillarCol: { flex: 1, gap: 9 },
        pillarTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
        ideaChip: { backgroundColor: colors.tag, borderRadius: 11, paddingVertical: 11, paddingHorizontal: 12 },
        ideaChipText: { color: colors.text, fontSize: 13, fontWeight: "600" },

        composeTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
        thumb: { width: 76, height: 76, borderRadius: 14, backgroundColor: colors.tag, alignItems: "center", justifyContent: "center" },
        aiBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999 },
        aiBadgeText: { color: colors.onPrimary, fontSize: 12, fontWeight: "800" },
        composeLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
        composeCaption: { color: colors.text, fontSize: 18, fontWeight: "600", lineHeight: 26, marginTop: 8, minHeight: 56 },
        caret: { color: colors.secondary, fontWeight: "400" },
        composeActions: { flexDirection: "row", gap: 8, marginTop: 14 },
        composeChip: { backgroundColor: colors.tag, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
        composeChipText: { color: colors.primary, fontSize: 12, fontWeight: "700" },

        schedRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
        timePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.tag, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
        timePillText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
        calRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
        calCell: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, gap: 9 },
        calCellActive: { backgroundColor: colors.tag },
        calDay: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
        calDayActive: { color: colors.primary },
        calDot: { width: 7, height: 7, borderRadius: 4 },
        calDotEmpty: { width: 7, height: 7, borderRadius: 4, backgroundColor: "transparent" },
        schedChip: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16, backgroundColor: colors.tag, borderRadius: 14, padding: 12 },
        thumbSm: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
        schedChipText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "700" },

        publishHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
        liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.success },
        publishLive: { color: colors.text, fontSize: 14, fontWeight: "800", flex: 1 },
        thumbWide: { width: "100%", height: 120, borderRadius: 14, backgroundColor: colors.tag, alignItems: "center", justifyContent: "center" },
        statRow: { flexDirection: "row", gap: 14, marginTop: 16 },
        stat: { flex: 1, backgroundColor: colors.tag, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
        statNum: { color: colors.primary, fontSize: 22, fontWeight: "900" },
        statLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "600", marginTop: 2 },

        dots: { flexDirection: "row", gap: 8 },
        dot: { width: 26, height: 4, borderRadius: 2, backgroundColor: colors.authPanelMuted, opacity: 0.4 },
        dotActive: { backgroundColor: colors.white, opacity: 1 },
    });
}

export default AuthShowcase;
