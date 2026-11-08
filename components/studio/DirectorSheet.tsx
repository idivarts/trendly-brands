/**
 * DirectorSheet — ask the AI to plan the whole thing, then read it before it runs.
 *
 * ── Why the storyboard is the product ───────────────────────────────────────
 * The plan is shown in full, as text, and nothing happens until someone
 * approves it. That is the point of a director rather than a generate button: a
 * run of six generated clips is real money, and a person reading six lines can
 * tell in ten seconds whether it is the video they wanted. A spinner cannot.
 *
 * ── Three answers, three different screens ─────────────────────────────────
 * A plan you can approve, a plan that cannot run (with the reasons), and a
 * refusal about money. The middle one is NOT an error — the planner tried, the
 * validator refused, and the problems are the useful part. Showing it as a
 * failure would make the user retry the same brief.
 *
 * ── Why the mode is three words and not a model list ───────────────────────
 * People choose an intent. "Economy" refuses generated video outright and
 * builds from what the brand owns; "cinematic" will spend the cap. Nobody picks
 * a model, and offering the list would make the cheapest decision look like a
 * technical one.
 */
import { fs, lh, fbox } from "@/constants/Typography";
import { TokenMeterNotice } from "@/components/billing/TokenMeter";
import { useEntitlements } from "@/hooks/use-entitlements";
import { DirectorMode, UseStudioDirectorResult } from "@/hooks/use-studio-director";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { goToBilling } from "@/utils/billing-navigation";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const MODES: { value: DirectorMode; label: string; hint: string }[] = [
    {
        value: "economy",
        label: "Economy",
        hint: "Builds from media you already own. No generated video at all.",
    },
    {
        value: "balanced",
        label: "Balanced",
        hint: "Reuses what fits and generates what it has to.",
    },
    {
        value: "cinematic",
        label: "Cinematic",
        hint: "Generates freely, up to the run's cap.",
    },
];

export interface DirectorSheetProps {
    visible: boolean;
    director: UseStudioDirectorResult;
    onClose: () => void;
    /** Called after a plan has been approved and the scenes exist. */
    onApproved: () => void;
    /**
     * Switch to the simpler motion-only flow.
     *
     * Kept as a way out because the director plans the WHOLE video — cast,
     * audio, generated clips — and sometimes the honest ask is just "lay out
     * six animated scenes about this". Making that only reachable through a
     * director run would mean paying a planner to arrive at it.
     */
    onUseSimpleFlow?: () => void;
}

const DirectorSheet: React.FC<DirectorSheetProps> = ({
    visible,
    director,
    onClose,
    onApproved,
    onUseSimpleFlow,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { tokens } = useEntitlements();

    const [brief, setBrief] = useState("");
    const [mode, setMode] = useState<DirectorMode>("balanced");
    const [seconds, setSeconds] = useState(30);

    const { plan, planning, approving, blocked, error, refused } = director;
    const warnings = (plan?.problems ?? []).filter((p) => !p.fatal);
    const fatals = (plan?.problems ?? []).filter((p) => p.fatal);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {plan ? "The plan" : "Let AI direct it"}
                        </Text>
                        <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
                            <FontAwesomeIcon icon={faXmark} size={14} color={colors.text} />
                        </Pressable>
                    </View>

                    {blocked ? (
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>
                                {blocked === "plan_locked"
                                    ? "Your plan doesn't include the director yet"
                                    : "You're out of AI tokens"}
                            </Text>
                            <Text style={styles.note}>
                                {blocked === "plan_locked"
                                    ? "Everything you've already built stays exactly as it is."
                                    : "Nothing was charged for this attempt."}
                            </Text>
                            <Pressable
                                style={styles.primary}
                                onPress={() =>
                                    goToBilling("ai_generate_blocked", { reason: blocked })
                                }
                            >
                                <Text style={styles.primaryText}>
                                    {blocked === "plan_locked" ? "See the plans" : "Top up"}
                                </Text>
                            </Pressable>
                        </View>
                    ) : planning ? (
                        <View style={styles.block}>
                            <ActivityIndicator color={colors.primary} />
                            <Text style={styles.note}>
                                Working out the scenes. One call, so this is seconds rather than
                                minutes — nothing is generated yet.
                            </Text>
                        </View>
                    ) : plan ? (
                        <ScrollView contentContainerStyle={styles.body}>
                            {/* The storyboard verbatim, in a monospace block:
                                it is laid out with alignment that matters, and
                                reflowing it would make the run graph
                                unreadable. */}
                            <Text style={styles.storyboard}>{plan.storyboard}</Text>

                            {plan.estCostUsd > 0 ? (
                                <Text style={styles.price}>
                                    About ${plan.estCostUsd.toFixed(2)} if you approve it · priced
                                    from our own rates, not the planner's estimate
                                </Text>
                            ) : (
                                <Text style={styles.note}>
                                    Nothing in this plan costs anything — it builds from media you
                                    already own.
                                </Text>
                            )}

                            {fatals.length > 0 ? (
                                <View style={styles.problems}>
                                    <Text style={styles.problemsTitle}>
                                        This plan can&apos;t run as it stands
                                    </Text>
                                    {fatals.map((p, i) => (
                                        <Text key={i} style={styles.problem}>
                                            • {p.message}
                                        </Text>
                                    ))}
                                    <Text style={styles.note}>
                                        Try describing it differently, or in a different mode.
                                    </Text>
                                </View>
                            ) : null}

                            {warnings.length > 0 ? (
                                <View style={styles.warnings}>
                                    <Text style={styles.problemsTitle}>Worth a look</Text>
                                    {warnings.map((p, i) => (
                                        <Text key={i} style={styles.problem}>
                                            • {p.message}
                                        </Text>
                                    ))}
                                </View>
                            ) : null}

                            {error ? <Text style={styles.error}>{error}</Text> : null}

                            <View style={styles.actions}>
                                <Pressable style={styles.secondary} onPress={director.reset}>
                                    <Text style={styles.secondaryText}>Plan it again</Text>
                                </Pressable>
                                {/* No Approve button on a refused plan. The
                                    API refuses it too, so this is for the
                                    user's benefit rather than for safety. */}
                                {/* Also requires a plan that EXISTS. `refused`
                                    is computed from fatal problems, so a run
                                    still being planned has none and would read
                                    as approvable — the 180s polling cap
                                    returns exactly that shape. */}
                                {refused || plan.status !== "planned" ? null : (
                                    <Pressable
                                        style={[styles.primary, approving && styles.off]}
                                        onPress={async () => {
                                            if (await director.approve()) onApproved();
                                        }}
                                        disabled={approving}
                                    >
                                        {approving ? (
                                            <ActivityIndicator color={colors.white} size="small" />
                                        ) : (
                                            <Text style={styles.primaryText}>
                                                Approve and build it
                                            </Text>
                                        )}
                                    </Pressable>
                                )}
                            </View>
                        </ScrollView>
                    ) : (
                        <ScrollView contentContainerStyle={styles.body}>
                            {tokens.state === "low" || tokens.state === "critical" ? (
                                <TokenMeterNotice tokens={tokens} />
                            ) : null}

                            <TextInput
                                style={styles.input}
                                value={brief}
                                onChangeText={setBrief}
                                placeholder="What should this video be? A sentence or two is plenty — it reads your script, your brand and what you already own."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                            />

                            <Text style={styles.label}>How freely it may spend</Text>
                            {MODES.map((m) => (
                                <Pressable
                                    key={m.value}
                                    style={[styles.modeRow, mode === m.value && styles.modeRowOn]}
                                    onPress={() => setMode(m.value)}
                                >
                                    <Text
                                        style={[
                                            styles.modeLabel,
                                            mode === m.value && styles.modeLabelOn,
                                        ]}
                                    >
                                        {m.label}
                                    </Text>
                                    <Text style={styles.note}>{m.hint}</Text>
                                </Pressable>
                            ))}

                            <Text style={styles.label}>Roughly how long</Text>
                            <View style={styles.chips}>
                                {[15, 30, 45, 60].map((n) => (
                                    <Pressable
                                        key={n}
                                        style={[styles.chip, seconds === n && styles.chipOn]}
                                        onPress={() => setSeconds(n)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                seconds === n && styles.chipTextOn,
                                            ]}
                                        >
                                            {n}s
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {error ? <Text style={styles.error}>{error}</Text> : null}

                            <Pressable
                                style={[styles.primary, !brief.trim() && styles.off]}
                                onPress={() =>
                                    director.makePlan({
                                        brief: brief.trim(),
                                        mode,
                                        targetSeconds: seconds,
                                    })
                                }
                                disabled={!brief.trim()}
                            >
                                <Text style={styles.primaryText}>Plan it</Text>
                            </Pressable>
                            {/* Said before the button, because "will this spend
                                my tokens" is the first question. */}
                            <Text style={styles.note}>
                                Planning is one cheap call and generates nothing. You see the whole
                                plan and its price before anything runs.
                            </Text>
                            {onUseSimpleFlow ? (
                                <Pressable style={styles.secondary} onPress={onUseSimpleFlow}>
                                    <Text style={styles.secondaryText}>
                                        Or just lay out motion scenes
                                    </Text>
                                </Pressable>
                            ) : null}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    useMemo(
        () =>
            StyleSheet.create({
                backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
                sheet: {
                    maxHeight: "90%",
                    backgroundColor: colors.background,
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                    padding: 16,
                    gap: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -6 },
                    shadowRadius: 18,
                    shadowOpacity: 0.18,
                    elevation: 12,
                },
                header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
                title: { color: colors.text, fontSize: fs(16), lineHeight: lh(22), fontWeight: "700" },
                close: {
                    width: fbox(30),
                    height: fbox(30),
                    borderRadius: 15,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                body: { gap: 10, paddingBottom: 20 },
                input: {
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    padding: 12,
                    minHeight: fbox(90),
                    color: colors.text,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    textAlignVertical: "top",
                },
                label: {
                    marginTop: 4,
                    color: colors.textSecondary,
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                },
                modeRow: {
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    padding: 11,
                    gap: 3,
                },
                modeRowOn: { backgroundColor: withAlpha(colors.primary, 0.16) },
                modeLabel: {
                    color: colors.text,
                    fontSize: fs(13),
                    lineHeight: lh(18),
                    fontWeight: "600",
                },
                modeLabelOn: { color: colors.primary },
                chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
                chip: {
                    paddingHorizontal: 13,
                    paddingVertical: 9,
                    borderRadius: 8,
                    minHeight: fbox(36),
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                chipOn: { backgroundColor: colors.primary },
                chipText: { color: colors.text, fontSize: fs(12), lineHeight: lh(17) },
                chipTextOn: { color: colors.white, fontWeight: "600" },
                storyboard: {
                    fontFamily: "monospace",
                    color: colors.text,
                    fontSize: fs(10),
                    lineHeight: lh(15),
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    padding: 11,
                },
                price: { color: colors.text, fontSize: fs(12), lineHeight: lh(17), fontWeight: "600" },
                note: { color: colors.textSecondary, fontSize: fs(11), lineHeight: lh(16) },
                error: { color: colors.red, fontSize: fs(11), lineHeight: lh(16) },
                problems: {
                    gap: 5,
                    backgroundColor: withAlpha(colors.red, 0.08),
                    borderRadius: 10,
                    padding: 11,
                },
                warnings: {
                    gap: 5,
                    backgroundColor: withAlpha(colors.text, 0.05),
                    borderRadius: 10,
                    padding: 11,
                },
                problemsTitle: {
                    color: colors.text,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    fontWeight: "700",
                },
                problem: { color: colors.text, fontSize: fs(11), lineHeight: lh(16) },
                block: {
                    gap: 8,
                    alignItems: "flex-start",
                    backgroundColor: withAlpha(colors.primary, 0.08),
                    borderRadius: 12,
                    padding: 14,
                },
                blockTitle: {
                    color: colors.text,
                    fontSize: fs(14),
                    lineHeight: lh(20),
                    fontWeight: "700",
                },
                actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
                off: { opacity: 0.45 },
                primary: {
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 10,
                    minHeight: 44,
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                primaryText: {
                    color: colors.white,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    fontWeight: "600",
                },
                secondary: {
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 10,
                    minHeight: 44,
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                secondaryText: {
                    color: colors.text,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    fontWeight: "600",
                },
            }),
        [colors]
    );

export default DirectorSheet;
