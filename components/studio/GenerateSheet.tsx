/**
 * GenerateSheet — ask the AI to build the scenes.
 *
 * ── Why this is an offer and not the front door ─────────────────────────────
 * The studio opens blank, and this is reached from a card beside "Add scene".
 * Someone who knows what they want should never have to decline help to get a
 * canvas — and someone who does not should not have to guess that help exists.
 *
 * ── Why the scene count is shown and adjustable ─────────────────────────────
 * Because it is the one number that decides what the run costs. Four scenes is
 * four designs; eight is eight. Hiding it would make the price of a run a
 * surprise, which is the thing a cost gate is supposed to prevent.
 */
import { fs, lh, fbox } from "@/constants/Typography";
import { TokenMeterNotice } from "@/components/billing/TokenMeter";
import { useEntitlements } from "@/hooks/use-entitlements";
import { GenerateApproach, GenerateProgress } from "@/hooks/use-studio-generate";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { goToBilling } from "@/utils/billing-navigation";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const COUNTS = [3, 4, 5, 6, 8];

export interface GenerateSheetProps {
    visible: boolean;
    /** Whether this format animates, which decides the approaches offered. */
    timed: boolean;
    running: boolean;
    progress: GenerateProgress | null;
    error: string | null;
    blocked: "tokens_exhausted" | "plan_locked" | null;

    onClose: () => void;
    onGenerate: (input: { brief: string; sceneCount: number; approach: GenerateApproach }) => void;
    onCancel: () => void;
}

const GenerateSheet: React.FC<GenerateSheetProps> = ({
    visible,
    timed,
    running,
    progress,
    error,
    blocked,
    onClose,
    onGenerate,
    onCancel,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { tokens } = useEntitlements();

    const [brief, setBrief] = useState("");
    const [count, setCount] = useState(4);
    const [approach, setApproach] = useState<GenerateApproach>(timed ? "motion" : "composite");

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Let AI plan the scenes</Text>
                        <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
                            <FontAwesomeIcon icon={faXmark} size={14} color={colors.text} />
                        </Pressable>
                    </View>

                    {blocked === "plan_locked" ? (
                        <View style={styles.blockCard}>
                            <Text style={styles.blockTitle}>Your plan doesn't include this yet</Text>
                            <Text style={styles.note}>
                                Designing scenes needs a plan with AI design. Everything you've
                                already built stays exactly as it is.
                            </Text>
                            <Pressable
                                style={styles.primary}
                                onPress={() =>
                                    // `ai_generate_blocked` rather than a new
                                    // source of its own: the upgrade-source
                                    // list lives in the shared-constants
                                    // submodule, and this IS an AI generation
                                    // being blocked — a separate label would
                                    // split one funnel across two names for no
                                    // analytical gain.
                                    goToBilling("ai_generate_blocked", { reason: "plan_locked" })
                                }
                            >
                                <Text style={styles.primaryText}>See the plans</Text>
                            </Pressable>
                        </View>
                    ) : blocked === "tokens_exhausted" ? (
                        <View style={styles.blockCard}>
                            <Text style={styles.blockTitle}>You're out of AI tokens</Text>
                            <Text style={styles.note}>
                                {progress && progress.done > 0
                                    ? `${progress.done} of ${progress.total} scenes were designed before this. They're kept.`
                                    : "Nothing was charged for this run."}
                            </Text>
                            <Pressable
                                style={styles.primary}
                                onPress={() =>
                                    goToBilling("ai_generate_blocked", {
                                        reason: "tokens_exhausted",
                                    })
                                }
                            >
                                <Text style={styles.primaryText}>Top up</Text>
                            </Pressable>
                        </View>
                    ) : running ? (
                        <View style={styles.blockCard}>
                            <Text style={styles.blockTitle}>
                                {progress
                                    ? `Designing scene ${Math.min(progress.done + 1, progress.total)} of ${progress.total}`
                                    : "Planning the scenes…"}
                            </Text>
                            <Text style={styles.note}>
                                Each scene appears on the rail as it lands. You can stop at any
                                point — the scenes already designed are kept.
                            </Text>
                            <Pressable style={styles.secondary} onPress={onCancel}>
                                <Text style={styles.secondaryText}>Stop after this scene</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <>
                            {tokens.state === "low" || tokens.state === "critical" ? (
                                <TokenMeterNotice tokens={tokens} />
                            ) : null}

                            <TextInput
                                style={styles.input}
                                value={brief}
                                onChangeText={setBrief}
                                placeholder="What should this be about? One or two sentences is plenty."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                            />

                            <Text style={styles.label}>How many scenes</Text>
                            <View style={styles.chips}>
                                {COUNTS.map((n) => (
                                    <Pressable
                                        key={n}
                                        style={[styles.chip, count === n && styles.chipOn]}
                                        onPress={() => setCount(n)}
                                    >
                                        <Text style={[styles.chipText, count === n && styles.chipTextOn]}>
                                            {n}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                            {/* The one number that decides what the run costs,
                                so it is shown rather than chosen for them. */}
                            <Text style={styles.note}>
                                Each scene is one design, so this is what the run costs.
                            </Text>

                            {timed ? (
                                <>
                                    <Text style={styles.label}>What kind of scenes</Text>
                                    <View style={styles.chips}>
                                        <Pressable
                                            style={[styles.chip, approach === "motion" && styles.chipOn]}
                                            onPress={() => setApproach("motion")}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    approach === "motion" && styles.chipTextOn,
                                                ]}
                                            >
                                                Animated
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            style={[styles.chip, approach === "composite" && styles.chipOn]}
                                            onPress={() => setApproach("composite")}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    approach === "composite" && styles.chipTextOn,
                                                ]}
                                            >
                                                Stills
                                            </Text>
                                        </Pressable>
                                    </View>
                                </>
                            ) : null}

                            {error ? <Text style={styles.error}>{error}</Text> : null}

                            <Pressable
                                style={[styles.primary, !brief.trim() && styles.primaryOff]}
                                onPress={() =>
                                    onGenerate({ brief: brief.trim(), sceneCount: count, approach })
                                }
                                disabled={!brief.trim()}
                            >
                                <Text style={styles.primaryText}>Plan the scenes</Text>
                            </Pressable>
                        </>
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
                backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
                sheet: {
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
                input: {
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    padding: 12,
                    minHeight: fbox(76),
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
                note: { color: colors.textSecondary, fontSize: fs(11), lineHeight: lh(16) },
                error: { color: colors.red, fontSize: fs(11), lineHeight: lh(16) },
                blockCard: {
                    gap: 8,
                    backgroundColor: withAlpha(colors.primary, 0.08),
                    borderRadius: 12,
                    padding: 14,
                },
                blockTitle: { color: colors.text, fontSize: fs(14), lineHeight: lh(20), fontWeight: "700" },
                primary: {
                    alignSelf: "flex-start",
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
                primaryOff: { opacity: 0.45 },
                primaryText: { color: colors.white, fontSize: fs(13), lineHeight: lh(19), fontWeight: "600" },
                secondary: {
                    alignSelf: "flex-start",
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    borderRadius: 10,
                    minHeight: 44,
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                secondaryText: { color: colors.text, fontSize: fs(12), lineHeight: lh(17), fontWeight: "600" },
            }),
        [colors]
    );

export default GenerateSheet;
