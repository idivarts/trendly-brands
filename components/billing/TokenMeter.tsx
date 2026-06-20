import { TokenStatus, formatTokens } from "@/hooks/use-entitlements";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { faBolt, faCircleArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// The AI-token meter family. Three presentations off one TokenStatus:
//   • TokenMeterBar    — ambient compact strip (panel header). Quiet until low.
//   • TokenMeterNotice — non-blocking low/critical banner (above the composer).
//   • TokenMeterBlock  — exhausted state (REPLACES the composer; no redirect).
// All read design-system tokens, never encode state in colour alone (always a
// text label), and keep the upgrade CTA ≥ 44px.

function goToBilling() {
    router.push("/billing");
}

function resetLabel(periodResetAt: number): string {
    if (!periodResetAt) return "the 1st";
    return new Date(periodResetAt).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// ── Ambient bar (header) ──────────────────────────────────────────────────────
export const TokenMeterBar: React.FC<{ tokens: TokenStatus }> = ({ tokens }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    if (tokens.state === "none") return null;

    const fill = tokens.state === "critical" || tokens.state === "exhausted"
        ? colors.red
        : tokens.state === "low"
            ? colors.gold
            : colors.primary;
    const widthPct = Math.round(tokens.pctLeft * 100);

    return (
        <View style={styles.barWrap} accessibilityLabel={`AI tokens: ${formatTokens(tokens.total)} left`}>
            <FontAwesomeIcon icon={faBolt} size={11} color={fill} />
            <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${widthPct}%`, backgroundColor: fill }]} />
            </View>
            <Text style={styles.barLabel} numberOfLines={1}>{formatTokens(tokens.total)}</Text>
        </View>
    );
};

// ── Low / critical notice (above composer) ────────────────────────────────────
export const TokenMeterNotice: React.FC<{ tokens: TokenStatus }> = ({ tokens }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    if (tokens.state !== "low" && tokens.state !== "critical") return null;

    const critical = tokens.state === "critical";
    const accent = critical ? colors.red : colors.gold;
    const msg = critical
        ? `Almost out of AI tokens — ${formatTokens(tokens.total)} left. Renews ${resetLabel(tokens.periodResetAt)}.`
        : `Running low on AI tokens — ${formatTokens(tokens.total)} left this month.`;

    return (
        <View style={styles.noticeWrap}>
            <View style={[styles.noticeAccent, { backgroundColor: accent }]} />
            <View style={styles.noticeBody}>
                <Text style={styles.noticeText} numberOfLines={2}>{msg}</Text>
            </View>
            <Pressable
                onPress={goToBilling}
                style={({ pressed }) => [styles.noticeCta, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Add tokens or upgrade"
                hitSlop={6}
            >
                <Text style={styles.noticeCtaText}>Add tokens</Text>
            </Pressable>
        </View>
    );
};

// ── Exhausted block (replaces composer) ───────────────────────────────────────
export const TokenMeterBlock: React.FC<{ tokens: TokenStatus; safeBottom?: number }> = ({ tokens, safeBottom = 0 }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);

    return (
        <View style={[styles.blockWrap, { paddingBottom: (xl ? 16 : 14) + safeBottom }]}>
            <View style={styles.blockHeaderRow}>
                <FontAwesomeIcon icon={faBolt} size={14} color={colors.red} />
                <Text style={styles.blockTitle}>You're out of AI tokens this month</Text>
            </View>
            <Text style={styles.blockSubtitle}>
                Your monthly AI allowance is used up. Tokens renew on {resetLabel(tokens.periodResetAt)} — or keep going now.
            </Text>
            <View style={styles.blockCtaRow}>
                <Pressable
                    onPress={goToBilling}
                    style={({ pressed }) => [styles.blockPrimary, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Upgrade your plan"
                >
                    <FontAwesomeIcon icon={faCircleArrowUp} size={14} color={colors.onPrimary} />
                    <Text style={styles.blockPrimaryText}>Upgrade</Text>
                </Pressable>
                <Pressable
                    onPress={goToBilling}
                    style={({ pressed }) => [styles.blockSecondary, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Add a top-up token pack"
                >
                    <Text style={styles.blockSecondaryText}>Add top-up</Text>
                </Pressable>
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                pressed: { opacity: 0.75 },
                // ── Ambient bar ──
                barWrap: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    maxWidth: 120,
                },
                barTrack: {
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.tag,
                    overflow: "hidden",
                },
                barFill: { height: 6, borderRadius: 3 },
                barLabel: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
                // ── Notice banner ──
                noticeWrap: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginHorizontal: 12,
                    marginBottom: 8,
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: colors.tag,
                    paddingRight: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 4,
                    shadowOpacity: 0.06,
                    elevation: 1,
                },
                noticeAccent: { width: 4, alignSelf: "stretch" },
                noticeBody: { flex: 1, paddingVertical: 10 },
                noticeText: { fontSize: 12.5, color: colors.text, lineHeight: 17 },
                noticeCta: {
                    minHeight: 44,
                    justifyContent: "center",
                    paddingHorizontal: 12,
                },
                noticeCtaText: { fontSize: 13, fontWeight: "700", color: colors.primary },
                // ── Exhausted block ──
                blockWrap: {
                    paddingHorizontal: 16,
                    paddingTop: 14,
                    gap: 10,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 4,
                },
                blockHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
                blockTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.text },
                blockSubtitle: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
                blockCtaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 },
                blockPrimary: {
                    flexDirection: "row",
                    alignItems: "center",
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
                blockPrimaryText: { fontSize: 14, fontWeight: "700", color: colors.onPrimary },
                blockSecondary: {
                    minHeight: 44,
                    justifyContent: "center",
                    paddingHorizontal: 12,
                },
                blockSecondaryText: { fontSize: 13, fontWeight: "700", color: colors.primary },
            }),
        [colors]
    );
}
