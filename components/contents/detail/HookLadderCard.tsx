/**
 * HookLadderCard — five ways to open this script, ranked.
 *
 * The hook is the one multiplicative gate in the funnel: everything downstream
 * is conditional on a stranger not scrolling past it. It is also fifteen words
 * long, so it is the cheapest thing in the whole product to iterate on — which
 * is why this offers five and lets the user choose, rather than quietly
 * replacing the one they have.
 *
 * Collapsed to a single row until asked. An occasional tool should not take
 * permanent space above the thing it is a tool for.
 */
import { fs, lh } from "@/constants/Typography";
import { useEntitlements } from "@/hooks/use-entitlements";
import { HookCandidate, useHookLadder } from "@/hooks/use-hook-ladder";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import {
    faArrowsRotate,
    faLightbulb,
    faTriangleExclamation,
    faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { UpgradeInline } from "@/components/billing/EntitlementGate";
import SectionLabel from "./SectionLabel";
import { dimensionTone } from "./virality";

interface Props {
    contentId: string;
    script: string;
    title?: string;
    topic?: string;
    format?: string;
    platforms?: string[];
    /** Sends one instruction to the AI chat, scoped to this content. */
    onAskAI: (instruction: string) => void;
    readOnly?: boolean;
}

/**
 * Swapping the hook goes through the chat rather than editing the script here.
 * The script is rich text and the hook's boundaries in it are a judgement —
 * "the first beat" is not a thing a string replace can find reliably, and
 * getting it wrong would silently eat a scene.
 */
function swapInstruction(h: HookCandidate): string {
    const lines = [
        "Replace the opening hook of the script with this, and change nothing else:",
        `Spoken: ${h.text}`,
    ];
    if (h.onScreen) lines.push(`On-screen: ${h.onScreen}`);
    return lines.join("\n");
}

const HookLadderCard: React.FC<Props> = ({
    contentId,
    script,
    title,
    topic,
    format,
    platforms,
    onAskAI,
    readOnly,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { hooks, unranked, loading, gate, error, run } = useHookLadder();
    const { tokens } = useEntitlements();

    // Pre-empt, don't punish — see the matching note in ViralityPanel.
    const effectiveGate = gate ?? (tokens.state === "exhausted" ? "tokens_exhausted" : null);

    const tone = useMemo(
        () => ({
            danger: colors.statusRejectedFg,
            warn: colors.statusReviewFg,
            neutral: colors.statusScheduledFg,
            good: colors.statusApprovedFg,
        }),
        [colors]
    );

    const hasScript = script.trim().length > 0;
    const onRun = () =>
        run({ contextId: contentId, script, title, topic, format, platforms });

    return (
        <>
            <SectionLabel>HOOK OPTIONS</SectionLabel>
            <View style={styles.card}>
                <View style={styles.head}>
                    <View style={styles.headIcon}>
                        <FontAwesomeIcon icon={faLightbulb} size={14} color={colors.primary} />
                    </View>
                    <View style={styles.headText}>
                        <Text style={styles.title}>Five ways to open this</Text>
                        <Text style={styles.sub}>
                            The hook decides whether anything else gets watched, and it is the
                            cheapest part to rewrite. Each uses a different angle.
                        </Text>
                    </View>
                </View>

                {hooks ? (
                    <View style={styles.list}>
                        {unranked ? (
                            <View style={styles.notice}>
                                <View style={[styles.noticeAccent, { backgroundColor: tone.warn }]} />
                                <Text style={styles.noticeText}>
                                    These could not be scored this time, so the order is arbitrary.
                                </Text>
                            </View>
                        ) : null}
                        {hooks.map((h, i) => (
                            <View key={`${i}-${h.text.slice(0, 24)}`} style={styles.row}>
                                <View
                                    style={[
                                        styles.rowAccent,
                                        { backgroundColor: tone[dimensionTone(h.score)] },
                                    ]}
                                />
                                <View style={styles.rowBody}>
                                    <View style={styles.rowMeta}>
                                        {unranked ? null : (
                                            <Text
                                                style={[
                                                    styles.rowScore,
                                                    { color: tone[dimensionTone(h.score)] },
                                                ]}
                                            >
                                                {h.score}
                                            </Text>
                                        )}
                                        {h.archetype ? (
                                            <Text style={styles.rowArchetype}>
                                                {h.archetype.toUpperCase()}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <Text style={styles.rowText}>{h.text}</Text>
                                    {h.onScreen ? (
                                        <Text style={styles.rowOnScreen}>On-screen: {h.onScreen}</Text>
                                    ) : null}
                                    {(h.problems ?? []).map((p) => (
                                        <View key={p.id} style={styles.rowProblem}>
                                            <FontAwesomeIcon
                                                icon={faTriangleExclamation}
                                                size={10}
                                                color={p.severity === "warn" ? tone.warn : tone.danger}
                                            />
                                            <Text style={styles.rowNote}>{p.message}</Text>
                                        </View>
                                    ))}
                                    {(h.notes ?? []).map((n, k) => (
                                        <Text key={k} style={styles.rowNote}>
                                            · {n}
                                        </Text>
                                    ))}
                                </View>
                                {!readOnly ? (
                                    <Pressable
                                        style={({ pressed }) => [styles.useBtn, pressed && styles.pressed]}
                                        onPress={() => onAskAI(swapInstruction(h))}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Use this hook: ${h.text}`}
                                        hitSlop={6}
                                    >
                                        <FontAwesomeIcon
                                            icon={faWandMagicSparkles}
                                            size={11}
                                            color={colors.primary}
                                        />
                                        <Text style={styles.useBtnText}>Use</Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        ))}
                    </View>
                ) : null}

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {effectiveGate === "tokens_exhausted" ? (
                    <UpgradeInline
                        message="You're out of AI tokens this month. Add a top-up to keep writing hooks."
                        ctaLabel="Add tokens"
                        feature="hook_ladder"
                        reason="tokens_exhausted"
                    />
                ) : effectiveGate === "plan_locked" ? (
                    <UpgradeInline
                        message="Hook options are on the paid plans."
                        feature="hook_ladder"
                        reason="plan_locked"
                    />
                ) : (
                    <Pressable
                        style={({ pressed }) => [
                            styles.cta,
                            (!hasScript || loading) && styles.btnDisabled,
                            pressed && styles.pressed,
                        ]}
                        onPress={onRun}
                        disabled={!hasScript || loading}
                        accessibilityRole="button"
                        accessibilityLabel={hooks ? "Write five more hooks" : "Write five hooks"}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.onPrimary} />
                        ) : (
                            <FontAwesomeIcon
                                icon={hooks ? faArrowsRotate : faLightbulb}
                                size={13}
                                color={colors.onPrimary}
                            />
                        )}
                        <Text style={styles.ctaText}>
                            {loading ? "Writing…" : hooks ? "Five more" : "Write 5 hooks"}
                        </Text>
                    </Pressable>
                )}

                {!hasScript ? (
                    <Text style={styles.footnote}>Write or generate a script first.</Text>
                ) : null}
            </View>
        </>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                pressed: { opacity: 0.75 },
                card: {
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    padding: 16,
                    gap: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                head: { flexDirection: "row", gap: 10 },
                headIcon: {
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                headText: { flex: 1, gap: 3 },
                title: {
                    fontSize: fs(15),
                    lineHeight: lh(21),
                    fontWeight: "800",
                    color: colors.text,
                },
                sub: {
                    fontSize: fs(12.5),
                    lineHeight: lh(18),
                    color: colors.textSecondary,
                },
                list: { gap: 8 },
                notice: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: colors.tag,
                    paddingRight: 10,
                    paddingVertical: 8,
                },
                noticeAccent: { width: 4, alignSelf: "stretch" },
                noticeText: {
                    flex: 1,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.text,
                    paddingLeft: 2,
                },
                row: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 10,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: withAlpha(colors.textSecondary, 0.07),
                    paddingRight: 10,
                    paddingVertical: 10,
                },
                rowAccent: { width: 4, alignSelf: "stretch" },
                rowBody: { flex: 1, gap: 3 },
                rowMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
                rowScore: { fontSize: fs(13), fontWeight: "800" },
                rowArchetype: {
                    fontSize: fs(10),
                    fontWeight: "700",
                    letterSpacing: 0.8,
                    color: colors.textSecondary,
                },
                rowText: {
                    fontSize: fs(13.5),
                    lineHeight: lh(19),
                    color: colors.text,
                },
                rowOnScreen: {
                    fontSize: fs(11.5),
                    lineHeight: lh(16),
                    color: colors.textSecondary,
                },
                rowProblem: { flexDirection: "row", alignItems: "center", gap: 5 },
                rowNote: {
                    flex: 1,
                    fontSize: fs(11.5),
                    lineHeight: lh(16),
                    color: colors.textSecondary,
                },
                useBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    minHeight: 32,
                    paddingHorizontal: 10,
                    borderRadius: 9,
                    backgroundColor: colors.card,
                },
                useBtnText: { fontSize: fs(12), fontWeight: "700", color: colors.primary },
                cta: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    alignSelf: "flex-start",
                    gap: 8,
                    minHeight: 44,
                    paddingHorizontal: 18,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                ctaText: { fontSize: fs(14), fontWeight: "700", color: colors.onPrimary },
                btnDisabled: { opacity: 0.45 },
                error: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.statusRejectedFg,
                },
                footnote: {
                    fontSize: fs(10.5),
                    lineHeight: lh(15),
                    color: colors.textSecondary,
                },
            }),
        [colors]
    );
}

export default HookLadderCard;
