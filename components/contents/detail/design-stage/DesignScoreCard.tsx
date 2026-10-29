/**
 * DesignScoreCard — the virality read on a design, floating over the canvas.
 *
 * The same rubric and the same band-led presentation as the script panel, in a
 * narrower card, because the useful thing here is a verdict and three fixes
 * while you are looking at the artefact — not a page to read.
 *
 * What it is NOT, stated in the card itself, is a prediction. And when the
 * renderer was unavailable the judge only read the slide copy, which the card
 * says plainly: a score taken without looking at a visual piece is a weaker
 * claim and hiding that would be the dishonest option.
 */
import { fs, lh } from "@/constants/Typography";
import { useDesignScore } from "@/hooks/use-design-score";
import { IViralityScore } from "@/shared-libs/firestore/trendly-pro/models/contents";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import {
    faEye,
    faEyeSlash,
    faGaugeHigh,
    faRotateRight,
    faWandMagicSparkles,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { UpgradeInline } from "@/components/billing/EntitlementGate";
import {
    SCORE_PRECISION,
    bandMeaning,
    bandTone,
    dimensionTone,
    fixInstruction,
} from "../virality";

interface Props {
    contentId: string;
    /** The score already on the content doc, if it has been scored before. */
    stored?: IViralityScore;
    hasDesign: boolean;
    /** Sends one instruction to the AI chat, scoped to this design. */
    onAskAI: (instruction: string) => void;
    onClose: () => void;
    readOnly?: boolean;
}

const DesignScoreCard: React.FC<Props> = ({
    contentId,
    stored,
    hasDesign,
    onAskAI,
    onClose,
    readOnly,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { score, band, loading, gate, error, run } = useDesignScore(stored);

    const tone = useMemo(
        () => ({
            danger: colors.statusRejectedFg,
            warn: colors.statusReviewFg,
            neutral: colors.statusScheduledFg,
            good: colors.statusApprovedFg,
        }),
        [colors]
    );

    // The backend marks a score it could not see by appending to judgeModel,
    // which is the only field that travels with the verdict.
    const copyOnly = !!score?.judgeModel?.includes("copy only");

    return (
        <View style={styles.card}>
            <View style={styles.head}>
                <FontAwesomeIcon icon={faGaugeHigh} size={13} color={colors.primary} />
                <Text style={styles.headTitle}>Virality check</Text>
                <Pressable
                    onPress={onClose}
                    style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Close the virality check"
                    hitSlop={8}
                >
                    <FontAwesomeIcon icon={faXmark} size={13} color={colors.textSecondary} />
                </Pressable>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody}>
                {score ? (
                    <>
                        <View style={styles.headline}>
                            <Text style={[styles.band, { color: tone[bandTone(band)] }]}>{band}</Text>
                            <View style={styles.scoreChip}>
                                <Text style={styles.scoreNum}>{score.overall}</Text>
                                <Text style={styles.scorePrecision}>± {SCORE_PRECISION}</Text>
                            </View>
                        </View>
                        <Text style={styles.meaning}>{bandMeaning(band)}</Text>

                        <View style={styles.sawRow}>
                            <FontAwesomeIcon
                                icon={copyOnly ? faEyeSlash : faEye}
                                size={10}
                                color={copyOnly ? tone.warn : colors.textSecondary}
                            />
                            <Text style={[styles.sawText, copyOnly && { color: tone.warn }]}>
                                {copyOnly
                                    ? "Judged on the slide copy only — the design could not be rendered."
                                    : "Judged on the rendered frames."}
                            </Text>
                        </View>

                        {score.cap ? (
                            <Text style={[styles.capText, { color: tone.danger }]}>
                                Held at {score.cap.at} — {score.cap.reason}
                            </Text>
                        ) : null}

                        <View style={styles.dims}>
                            {(score.dimensions ?? []).map((d) => (
                                <View key={d.key} style={styles.dimRow}>
                                    <Text style={styles.dimLabel}>{d.label}</Text>
                                    <View style={styles.track}>
                                        <View
                                            style={[
                                                styles.fill,
                                                {
                                                    width: `${Math.max(0, Math.min(100, d.score))}%`,
                                                    backgroundColor: tone[dimensionTone(d.score)],
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.dimScore, { color: tone[dimensionTone(d.score)] }]}>
                                        {d.score}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {(score.fixes ?? []).length > 0 ? (
                            <View style={styles.fixes}>
                                <Text style={styles.fixesTitle}>FIX FIRST</Text>
                                {(score.fixes ?? []).map((f) => (
                                    <View key={f.criterion} style={styles.fixRow}>
                                        <Text style={styles.fixText}>{f.message}</Text>
                                        {!readOnly ? (
                                            <Pressable
                                                onPress={() => onAskAI(fixInstruction(f.message))}
                                                style={({ pressed }) => [
                                                    styles.fixBtn,
                                                    pressed && styles.pressed,
                                                ]}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Ask AI to fix: ${f.message}`}
                                                hitSlop={6}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faWandMagicSparkles}
                                                    size={10}
                                                    color={colors.primary}
                                                />
                                                <Text style={styles.fixBtnText}>Fix</Text>
                                            </Pressable>
                                        ) : null}
                                    </View>
                                ))}
                            </View>
                        ) : null}
                    </>
                ) : (
                    <Text style={styles.meaning}>
                        Rates the hook, the body, the ask, how shareable it is and whether it fits
                        the platform — by rendering this design and looking at it.
                    </Text>
                )}

                <Text style={styles.disclaimer}>
                    Not a prediction. It measures how well this does the things the platforms rank on.
                </Text>

                {error ? <Text style={styles.error}>{error}</Text> : null}
            </ScrollView>

            {gate === "tokens_exhausted" ? (
                <UpgradeInline
                    message="You're out of AI tokens this month."
                    ctaLabel="Add tokens"
                    feature="design_score"
                    reason="tokens_exhausted"
                />
            ) : gate === "plan_locked" ? (
                <UpgradeInline
                    message="Scoring is on the paid plans."
                    feature="design_score"
                    reason="plan_locked"
                />
            ) : (
                <Pressable
                    onPress={() => run(contentId)}
                    disabled={!hasDesign || loading}
                    style={({ pressed }) => [
                        styles.cta,
                        (!hasDesign || loading) && styles.disabled,
                        pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={score ? "Score this design again" : "Score this design"}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                        <FontAwesomeIcon
                            icon={score ? faRotateRight : faGaugeHigh}
                            size={12}
                            color={colors.onPrimary}
                        />
                    )}
                    <Text style={styles.ctaText}>
                        {loading ? "Rendering and scoring…" : score ? "Re-score" : "Score this design"}
                    </Text>
                </Pressable>
            )}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                pressed: { opacity: 0.75 },
                card: {
                    width: 300,
                    maxHeight: 460,
                    gap: 10,
                    borderRadius: 14,
                    backgroundColor: colors.card,
                    padding: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 24,
                    shadowOpacity: 0.18,
                    elevation: 10,
                },
                head: { flexDirection: "row", alignItems: "center", gap: 8 },
                headTitle: {
                    flex: 1,
                    fontSize: fs(11),
                    fontWeight: "800",
                    letterSpacing: 1,
                    color: colors.textSecondary,
                },
                closeBtn: { padding: 2 },
                scroll: { flexGrow: 0 },
                scrollBody: { gap: 8 },
                headline: { flexDirection: "row", alignItems: "center", gap: 10 },
                band: { flex: 1, fontSize: fs(22), lineHeight: lh(27), fontWeight: "800" },
                scoreChip: {
                    alignItems: "center",
                    borderRadius: 10,
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    backgroundColor: colors.tag,
                },
                scoreNum: { fontSize: fs(16), lineHeight: lh(20), fontWeight: "800", color: colors.text },
                scorePrecision: { fontSize: fs(9.5), lineHeight: lh(13), color: colors.textSecondary },
                meaning: { fontSize: fs(12), lineHeight: lh(17), color: colors.textSecondary },
                sawRow: { flexDirection: "row", alignItems: "center", gap: 6 },
                sawText: { flex: 1, fontSize: fs(10.5), lineHeight: lh(15), color: colors.textSecondary },
                capText: { fontSize: fs(11), lineHeight: lh(16), fontWeight: "600" },
                dims: { gap: 5, marginTop: 2 },
                dimRow: { flexDirection: "row", alignItems: "center", gap: 8 },
                dimLabel: { width: 50, fontSize: fs(11), fontWeight: "700", color: colors.text },
                track: {
                    flex: 1,
                    height: 5,
                    borderRadius: 3,
                    overflow: "hidden",
                    backgroundColor: withAlpha(colors.textSecondary, 0.18),
                },
                fill: { height: 5, borderRadius: 3 },
                dimScore: { width: 26, textAlign: "right", fontSize: fs(11), fontWeight: "800" },
                fixes: { gap: 6, marginTop: 4 },
                fixesTitle: {
                    fontSize: fs(10),
                    fontWeight: "700",
                    letterSpacing: 1,
                    color: colors.textSecondary,
                },
                fixRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
                fixText: { flex: 1, fontSize: fs(11.5), lineHeight: lh(16), color: colors.text },
                fixBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    minHeight: 28,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                fixBtnText: { fontSize: fs(11), fontWeight: "700", color: colors.primary },
                disclaimer: { fontSize: fs(10), lineHeight: lh(14), color: colors.textSecondary },
                error: { fontSize: fs(11), lineHeight: lh(16), color: colors.statusRejectedFg },
                cta: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    minHeight: 40,
                    borderRadius: 11,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                ctaText: { fontSize: fs(13), fontWeight: "700", color: colors.onPrimary },
                disabled: { opacity: 0.45 },
            }),
        [colors]
    );
}

export default DesignScoreCard;
