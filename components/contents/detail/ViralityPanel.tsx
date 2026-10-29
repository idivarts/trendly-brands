/**
 * ViralityPanel — the pre-publish read on a script.
 *
 * ── Why the band leads, and the number does not ─────────────────────────────
 * The scorer is stable to about ±5 points, and on a script sitting near a band
 * boundary it moved 10 across five identical runs on dev. The variance lives
 * almost entirely in Share and Action, the two criteria where the judge is
 * genuinely undecided on borderline material — it is not a plumbing defect and
 * no amount of temperature tuning removes it.
 *
 * So the band is the headline and the integer is a footnote with its precision
 * attached. A user who edits nothing, re-scores, and watches 83 become 92 is
 * right to stop trusting the panel — and would take the fixes with it, which
 * are the part that actually helps. `displayBand` additionally holds a band
 * that has only just crossed a boundary, because a verdict appearing to change
 * its mind is worse than a number moving.
 *
 * ── What it is not ──────────────────────────────────────────────────────────
 * Not a prediction. Pre-publication virality is dominated by channel size, not
 * by the content, and claiming otherwise would be the single most dishonest
 * thing this app could show. It measures conformance to the craft that drives
 * the metrics the platforms demonstrably rank on. That framing is in the
 * subtitle, not a tooltip.
 */
import { fs, lh } from "@/constants/Typography";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useViralityScore } from "@/hooks/use-virality-score";
import Colors from "@/shared-uis/constants/Colors";
import { IViralityDimension, IViralityScore } from "@/shared-libs/firestore/trendly-pro/models/contents";
import { formatTimeToNow } from "@/utils/date";
import { withAlpha } from "@/utils/color";
import {
    faBolt,
    faChevronDown,
    faChevronUp,
    faGaugeHigh,
    faRotateRight,
    faTriangleExclamation,
    faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { UpgradeInline } from "@/components/billing/EntitlementGate";
import SectionLabel from "./SectionLabel";
import {
    BandTone,
    SCORE_PRECISION,
    SCORE_TOKEN_COST,
    bandMeaning,
    bandTone,
    dimensionMeaning,
    dimensionTone,
    fixInstruction,
    repairInstruction,
} from "./virality";

/** A failed check's colour family. A warning is amber, not red. */
function problemTone(severity: string): BandTone {
    return severity === "warn" ? "warn" : "danger";
}

interface Props {
    contentId: string;
    /** Live editor state — scored in preference to the saved doc. */
    script: string;
    format?: string;
    platforms?: string[];
    /** The score already on the content doc, if it has been scored before. */
    stored?: IViralityScore;
    /** Sends one instruction to the AI chat, scoped to this content. */
    onAskAI: (instruction: string) => void;
    readOnly?: boolean;
}

const ViralityPanel: React.FC<Props> = ({
    contentId,
    script,
    format,
    platforms,
    stored,
    onAskAI,
    readOnly,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { tokens } = useEntitlements();
    // `band` comes from the hook: it is steadied against the band that was
    // last DISPLAYED, which only the hook can know. See the note there.
    const { score, band, loading, gate, error, run, isStaleFor } = useViralityScore(stored);
    const [openDim, setOpenDim] = useState<string | null>(null);

    const tone = useToneMap(colors);
    const stale = isStaleFor(script);

    // Every problem, hardest first. Warnings are included: "no sound-off cues"
    // is concrete and the judge has no reason to raise it, so filtering to the
    // blocking ones would drop the most actionable thing the panel knows.
    const problems = useMemo(() => {
        const rank = { fatal: 0, cap: 1, warn: 2 } as const;
        return [...(score?.problems ?? [])].sort(
            (a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3)
        );
    }, [score?.problems]);

    const onScore = () =>
        run({ contextId: contentId, script, format, platforms });

    const hasScript = script.trim().length > 0;

    return (
        <>
            <SectionLabel>
                VIRALITY CHECK
            </SectionLabel>
            <View style={styles.card}>
                {/* ── Headline ─────────────────────────────────────────── */}
                {score ? (
                    <View style={styles.headline}>
                        <View style={styles.headlineText}>
                            <Text style={[styles.band, { color: tone[bandTone(band)].fg }]}>
                                {band}
                            </Text>
                            <Text style={styles.bandMeaning}>{bandMeaning(band)}</Text>
                        </View>
                        {/* The integer, with the precision it actually has.
                            Without the ±, 85 claims a certainty five judge
                            calls on a subjective rubric cannot deliver. */}
                        <View style={styles.scoreChip}>
                            <Text style={styles.scoreNum}>{score.overall}</Text>
                            <Text style={styles.scorePrecision}>± {SCORE_PRECISION}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.headlineText}>
                        <Text style={styles.emptyTitle}>Score this script</Text>
                        <Text style={styles.bandMeaning}>
                            Rates the hook, the body, the ask, how shareable it is and
                            whether it fits the platform — and says what to fix first.
                        </Text>
                    </View>
                )}

                <Text style={styles.disclaimer}>
                    Not a prediction. It measures how well the script does the things the
                    platforms rank on.
                </Text>

                {/* ── Why this score may no longer describe the script ──── */}
                {score && stale ? (
                    <View style={styles.notice}>
                        <View style={[styles.noticeAccent, { backgroundColor: tone.warn.fg }]} />
                        <Text style={styles.noticeText}>
                            The script has changed since this score. Re-score to see where it
                            stands now.
                        </Text>
                    </View>
                ) : null}

                {score?.cap ? (
                    <View style={styles.notice}>
                        <View style={[styles.noticeAccent, { backgroundColor: tone.danger.fg }]} />
                        <Text style={styles.noticeText}>
                            Held at {score.cap.at} — {score.cap.reason}
                        </Text>
                    </View>
                ) : null}

                {/* ── Dimensions ───────────────────────────────────────── */}
                {score ? (
                    <View style={styles.dims}>
                        {(score.dimensions ?? []).map((d) => (
                            <DimensionRow
                                key={d.key}
                                dimension={d}
                                open={openDim === d.key}
                                onToggle={() => setOpenDim(openDim === d.key ? null : d.key)}
                                colors={colors}
                                styles={styles}
                                tone={tone}
                            />
                        ))}
                    </View>
                ) : null}

                {/* ── Deterministic problems: concrete, and worth leading
                       with over the judge's opinions ───────────────────── */}
                {problems.length > 0 ? (
                    <View style={styles.problems}>
                        <View style={styles.problemsHead}>
                            <FontAwesomeIcon
                                icon={faTriangleExclamation}
                                size={12}
                                color={tone[problemTone(problems[0].severity)].fg}
                            />
                            <Text
                                style={[
                                    styles.problemsTitle,
                                    { color: tone[problemTone(problems[0].severity)].fg },
                                ]}
                            >
                                {problems.length === 1
                                    ? "1 thing to fix"
                                    : `${problems.length} things to fix`}
                            </Text>
                        </View>
                        {problems.map((p) => (
                            <View key={p.id} style={styles.problemRow}>
                                <View
                                    style={[
                                        styles.dimNoteAccent,
                                        { backgroundColor: tone[problemTone(p.severity)].fg },
                                    ]}
                                />
                                <Text style={styles.problemText}>{p.message}</Text>
                            </View>
                        ))}
                        {!readOnly ? (
                            <Pressable
                                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                                onPress={() => onAskAI(repairInstruction(problems.map((p) => p.message)))}
                                accessibilityRole="button"
                                accessibilityLabel="Ask AI to fix these"
                            >
                                <FontAwesomeIcon
                                    icon={faWandMagicSparkles}
                                    size={12}
                                    color={colors.primary}
                                />
                                <Text style={styles.secondaryBtnText}>
                                    {problems.length === 1 ? "Fix it with AI" : "Fix these with AI"}
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>
                ) : null}

                {/* ── What to change, ranked by what it would move ─────── */}
                {score && (score.fixes?.length ?? 0) > 0 ? (
                    <View style={styles.fixes}>
                        <Text style={styles.fixesTitle}>FIX FIRST</Text>
                        {(score.fixes ?? []).map((f) => (
                            <View key={f.criterion} style={styles.fixRow}>
                                <View style={styles.fixBody}>
                                    <Text style={styles.fixDim}>{f.dimension}</Text>
                                    <Text style={styles.fixText}>{f.message}</Text>
                                </View>
                                {!readOnly ? (
                                    <Pressable
                                        style={({ pressed }) => [styles.fixBtn, pressed && styles.pressed]}
                                        onPress={() => onAskAI(fixInstruction(f.message))}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Ask AI to fix: ${f.message}`}
                                        hitSlop={6}
                                    >
                                        <FontAwesomeIcon
                                            icon={faWandMagicSparkles}
                                            size={11}
                                            color={colors.primary}
                                        />
                                        <Text style={styles.fixBtnText}>Fix</Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        ))}
                    </View>
                ) : null}

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {/* ── The action, or why it is unavailable ─────────────── */}
                {gate === "tokens_exhausted" ? (
                    <UpgradeInline
                        message="You're out of AI tokens this month. Add a top-up to keep scoring."
                        ctaLabel="Add tokens"
                        feature="virality_score"
                        reason="tokens_exhausted"
                    />
                ) : gate === "plan_locked" ? (
                    <UpgradeInline
                        message="Scoring is on the paid plans."
                        feature="virality_score"
                        reason="plan_locked"
                    />
                ) : (
                    <View style={styles.actions}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.primaryBtn,
                                (!hasScript || loading) && styles.btnDisabled,
                                pressed && styles.pressed,
                            ]}
                            onPress={onScore}
                            disabled={!hasScript || loading}
                            accessibilityRole="button"
                            accessibilityLabel={score ? "Re-score script" : "Score script"}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={colors.onPrimary} />
                            ) : (
                                <FontAwesomeIcon
                                    icon={score ? faRotateRight : faGaugeHigh}
                                    size={13}
                                    color={colors.onPrimary}
                                />
                            )}
                            <Text style={styles.primaryBtnText}>
                                {loading ? "Scoring…" : score ? "Re-score" : "Score script"}
                            </Text>
                        </Pressable>

                        {/* Pre-emptive, not punitive: the cost is shown while the
                            wallet is thin, before the user spends it. */}
                        {tokens.state === "low" || tokens.state === "critical" ? (
                            <View style={styles.costHint}>
                                <FontAwesomeIcon icon={faBolt} size={10} color={tone.warn.fg} />
                                <Text style={[styles.costHintText, { color: tone.warn.fg }]}>
                                    ~{Math.round(SCORE_TOKEN_COST / 1000)}K tokens
                                </Text>
                            </View>
                        ) : null}
                    </View>
                )}

                {!hasScript ? (
                    <Text style={styles.footnote}>Write or generate a script first.</Text>
                ) : score ? (
                    <Text style={styles.footnote}>
                        Scored {formatTimeToNow(score.scoredAt)} · rubric {score.rubricVersion}
                    </Text>
                ) : null}
            </View>
        </>
    );
};

/**
 * One dimension. Collapsed it is a weighted bar; opened it shows the criteria
 * the judge marked down and why — which is where the actual reasoning lives,
 * and the only place the panel explains a number rather than asserting it.
 */
const DimensionRow: React.FC<{
    dimension: IViralityDimension;
    open: boolean;
    onToggle: () => void;
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof useStyles>;
    tone: Record<BandTone, { fg: string; bg: string }>;
}> = ({ dimension: d, open, onToggle, colors, styles, tone }) => {
    const t = tone[dimensionTone(d.score)];
    // Only the marked-down criteria. A list of things that were fine is noise,
    // and the judge writes no note for a full score anyway.
    const marked = (d.criteria ?? []).filter((c) => c.score < 2 && c.note);

    return (
        <View>
            <Pressable
                style={({ pressed }) => [styles.dimRow, pressed && styles.pressed]}
                onPress={onToggle}
                accessibilityRole="button"
                accessibilityLabel={`${d.label}, ${d.score} out of 100, ${d.weight} percent of the score`}
                accessibilityState={{ expanded: open }}
            >
                <View style={styles.dimLabelCol}>
                    <Text style={styles.dimLabel}>{d.label}</Text>
                    <Text style={styles.dimWeight}>{d.weight}%</Text>
                </View>
                <View style={styles.dimBarTrack}>
                    <View
                        style={[
                            styles.dimBarFill,
                            { width: `${Math.max(0, Math.min(100, d.score))}%`, backgroundColor: t.fg },
                        ]}
                    />
                </View>
                <Text style={[styles.dimScore, { color: t.fg }]}>{d.score}</Text>
                <FontAwesomeIcon
                    icon={open ? faChevronUp : faChevronDown}
                    size={10}
                    color={colors.textSecondary}
                />
            </Pressable>
            {open ? (
                <View style={styles.dimDetail}>
                    <Text style={styles.dimMeaning}>{dimensionMeaning(d.key)}</Text>
                    {marked.length === 0 ? (
                        <Text style={styles.dimNote}>Nothing marked down here.</Text>
                    ) : (
                        marked.map((c) => (
                            <View key={c.id} style={styles.dimNoteRow}>
                                <View
                                    style={[
                                        styles.dimNoteAccent,
                                        { backgroundColor: c.score === 0 ? tone.danger.fg : tone.warn.fg },
                                    ]}
                                />
                                <Text style={styles.dimNote}>
                                    {c.note}
                                    {c.prefilled ? " (checked in code, not judged)" : ""}
                                </Text>
                            </View>
                        ))
                    )}
                </View>
            ) : null}
        </View>
    );
};

/**
 * Tone → tokens. Reuses the status badge pairs rather than adding colours:
 * they already carry a themed foreground that clears AA on their own fill in
 * both light and dark.
 */
function useToneMap(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () => ({
            danger: { fg: colors.statusRejectedFg, bg: colors.statusRejectedBg },
            warn: { fg: colors.statusReviewFg, bg: colors.statusReviewBg },
            neutral: { fg: colors.statusScheduledFg, bg: colors.statusScheduledBg },
            good: { fg: colors.statusApprovedFg, bg: colors.statusApprovedBg },
        }),
        [colors]
    );
}

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
                // ── Headline ──
                headline: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                },
                headlineText: { flex: 1, gap: 4 },
                band: {
                    fontSize: fs(26),
                    lineHeight: lh(31),
                    fontWeight: "800",
                },
                emptyTitle: {
                    fontSize: fs(17),
                    lineHeight: lh(23),
                    fontWeight: "800",
                    color: colors.text,
                },
                bandMeaning: {
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    color: colors.textSecondary,
                },
                scoreChip: {
                    alignItems: "center",
                    borderRadius: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: colors.tag,
                },
                scoreNum: {
                    fontSize: fs(20),
                    lineHeight: lh(24),
                    fontWeight: "800",
                    color: colors.text,
                },
                scorePrecision: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    color: colors.textSecondary,
                },
                disclaimer: {
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    color: colors.textSecondary,
                },
                // ── Notices ──
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
                // ── Dimensions ──
                dims: { gap: 2 },
                dimRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 7,
                },
                dimLabelCol: { width: 86 },
                dimLabel: {
                    fontSize: fs(12.5),
                    lineHeight: lh(17),
                    fontWeight: "700",
                    color: colors.text,
                },
                dimWeight: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    color: colors.textSecondary,
                },
                dimBarTrack: {
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    overflow: "hidden",
                    backgroundColor: withAlpha(colors.textSecondary, 0.18),
                },
                dimBarFill: { height: 6, borderRadius: 3 },
                dimScore: {
                    width: 30,
                    textAlign: "right",
                    fontSize: fs(12.5),
                    fontWeight: "800",
                },
                dimDetail: {
                    gap: 6,
                    paddingBottom: 10,
                    paddingLeft: 86 + 10,
                },
                dimMeaning: {
                    fontSize: fs(11.5),
                    lineHeight: lh(16),
                    color: colors.textSecondary,
                },
                dimNoteRow: {
                    flexDirection: "row",
                    gap: 8,
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: colors.tag,
                    paddingRight: 8,
                    paddingVertical: 6,
                },
                dimNoteAccent: { width: 3, alignSelf: "stretch" },
                dimNote: {
                    flex: 1,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.text,
                },
                // ── Problems ──
                problems: {
                    gap: 6,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                    padding: 10,
                },
                problemsHead: { flexDirection: "row", alignItems: "center", gap: 6 },
                problemRow: { flexDirection: "row", gap: 8, overflow: "hidden" },
                problemsTitle: {
                    fontSize: fs(11),
                    fontWeight: "800",
                    letterSpacing: 0.8,
                },
                problemText: {
                    flex: 1,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.text,
                    paddingLeft: 2,
                },
                // ── Fixes ──
                fixes: { gap: 8 },
                fixesTitle: {
                    fontSize: fs(11),
                    fontWeight: "700",
                    letterSpacing: 1.1,
                    color: colors.textSecondary,
                },
                fixRow: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 10,
                },
                fixBody: { flex: 1, gap: 2 },
                fixDim: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    fontWeight: "700",
                    letterSpacing: 0.6,
                    color: colors.textSecondary,
                },
                fixText: {
                    fontSize: fs(12.5),
                    lineHeight: lh(18),
                    color: colors.text,
                },
                fixBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    minHeight: 32,
                    paddingHorizontal: 10,
                    borderRadius: 9,
                    backgroundColor: colors.tag,
                },
                fixBtnText: {
                    fontSize: fs(12),
                    fontWeight: "700",
                    color: colors.primary,
                },
                // ── Actions ──
                actions: { flexDirection: "row", alignItems: "center", gap: 10 },
                primaryBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
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
                primaryBtnText: {
                    fontSize: fs(14),
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                btnDisabled: { opacity: 0.45 },
                secondaryBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    gap: 6,
                    minHeight: 36,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: colors.card,
                },
                secondaryBtnText: {
                    fontSize: fs(12.5),
                    fontWeight: "700",
                    color: colors.primary,
                },
                costHint: { flexDirection: "row", alignItems: "center", gap: 5 },
                costHintText: { fontSize: fs(11), fontWeight: "700" },
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

export default ViralityPanel;
