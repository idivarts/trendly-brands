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
import { IStudioScene } from "@/shared-libs/firestore/trendly-pro/models/studio";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { goToBilling } from "@/utils/billing-navigation";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    BriefAttachment,
    MAX_ATTACHMENTS,
    insertHandle,
    matchHandles,
    mentionQuery,
    nextHandle,
    unresolvedHandles,
} from "@/components/studio/brief-attachments";
import { UseStudioUploadResult } from "@/hooks/use-studio-upload";

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
    /**
     * Called after a plan has been approved, with the scenes it created that
     * still have to be made. The caller starts the fill — approval only
     * writes the scenes.
     */
    onApproved: (pendingScenes: IStudioScene[]) => void;
    /**
     * Switch to the simpler motion-only flow.
     *
     * Kept as a way out because the director plans the WHOLE video — cast,
     * audio, generated clips — and sometimes the honest ask is just "lay out
     * six animated scenes about this". Making that only reachable through a
     * director run would mean paying a planner to arrive at it.
     */
    onUseSimpleFlow?: () => void;
    /**
     * The studio's uploader, so a brief can carry files.
     *
     * Passed in rather than hooked here for the same reason `director` is: the
     * screen already owns one, and a second would have its own `uploading`
     * flag that nothing else could see.
     */
    upload?: UseStudioUploadResult;
}

const DirectorSheet: React.FC<DirectorSheetProps> = ({
    visible,
    director,
    onClose,
    onApproved,
    onUseSimpleFlow,
    upload,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { tokens } = useEntitlements();

    const [brief, setBrief] = useState("");
    const [mode, setMode] = useState<DirectorMode>("balanced");
    const [seconds, setSeconds] = useState(30);

    // ── Attachments ──
    const [attachments, setAttachments] = useState<BriefAttachment[]>([]);
    // The caret, tracked only so `@` can tell where it is being typed. A
    // TextInput does not otherwise tell you.
    const [caret, setCaret] = useState(0);
    // A one-shot forced selection, cleared as soon as it has been applied.
    // Rewriting `value` to insert a handle does NOT move the real caret —
    // it lands at the end of the text — so without this, picking a suggestion
    // mid-sentence throws the user to the bottom of their own brief. Same
    // pattern as `components/shared/MentionInput.tsx`, which solved this
    // already.
    const [pendingSelection, setPendingSelection] = useState<
        { start: number; end: number } | undefined
    >(undefined);

    const mention = mentionQuery(brief, caret);
    const suggestions = mention ? matchHandles(attachments, mention.query) : [];
    const unresolved = unresolvedHandles(brief, attachments);
    const full = attachments.length >= MAX_ATTACHMENTS;

    const attach = async () => {
        if (!upload || full) return;
        const picked = await upload.pickAndUpload("all");
        if (!picked) return;
        setAttachments((prev) => [
            ...prev,
            {
                // Allocated off the existing handles, never off the count —
                // see `nextHandle`. A handle is never reused.
                ref: nextHandle(prev),
                mediaId: picked.mediaId,
                url: picked.url,
                kind: picked.kind,
            },
        ]);
    };

    const pickSuggestion = (ref: string) => {
        if (!mention) return;
        const next = insertHandle(brief, mention, caret, ref);
        setBrief(next.text);
        setCaret(next.caret);
        setPendingSelection({ start: next.caret, end: next.caret });
    };

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
                                            const made = await director.approve();
                                            if (made) onApproved(made);
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
                                onChangeText={(t) => setBrief(t)}
                                selection={pendingSelection}
                                onSelectionChange={(e) => {
                                    setCaret(e.nativeEvent.selection.end);
                                    // Released as soon as it has landed, or the
                                    // input is stuck and cannot be clicked into.
                                    if (pendingSelection) setPendingSelection(undefined);
                                }}
                                placeholder="What should this video be? A sentence or two is plenty — it reads your script, your brand and what you already own."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                            />

                            {/* The @ list. Directly under the box rather than
                                floating over the caret: an overlay positioned
                                against a multiline TextInput's caret is not
                                something React Native will tell you where to
                                put, on any of the three platforms. */}
                            {mention && suggestions.length > 0 ? (
                                <View style={styles.suggestions}>
                                    {suggestions.map((a) => (
                                        <Pressable
                                            key={a.ref}
                                            style={styles.suggestion}
                                            onPress={() => pickSuggestion(a.ref)}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Insert @${a.ref}`}
                                        >
                                            <Image
                                                source={{ uri: a.url }}
                                                style={styles.suggestionThumb}
                                            />
                                            <Text style={styles.suggestionText}>@{a.ref}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            ) : null}

                            {upload ? (
                                <View style={styles.attachRow}>
                                    <Pressable
                                        style={[
                                            styles.attachBtn,
                                            (full || upload.uploading) && styles.off,
                                        ]}
                                        onPress={() => void attach()}
                                        disabled={full || upload.uploading}
                                        accessibilityRole="button"
                                        accessibilityLabel="Attach a file to this brief"
                                    >
                                        <Text style={styles.attachBtnText}>
                                            {upload.uploading ? "Uploading…" : "Attach"}
                                        </Text>
                                    </Pressable>
                                    {attachments.map((a) => (
                                        <View key={a.ref} style={styles.chip2}>
                                            <Image
                                                source={{ uri: a.url }}
                                                style={styles.chipThumb}
                                            />
                                            <Text style={styles.chipLabel}>@{a.ref}</Text>
                                            <Pressable
                                                onPress={() =>
                                                    // Deliberately does NOT edit the
                                                    // brief. Reaching into someone's
                                                    // prose to delete words they typed
                                                    // is worse than a handle that stops
                                                    // resolving — and the line below
                                                    // tells them it has.
                                                    setAttachments((prev) =>
                                                        prev.filter((x) => x.ref !== a.ref)
                                                    )
                                                }
                                                accessibilityRole="button"
                                                accessibilityLabel={`Remove @${a.ref}`}
                                                style={styles.chipX}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faXmark}
                                                    size={11}
                                                    color={colors.textSecondary}
                                                />
                                            </Pressable>
                                        </View>
                                    ))}
                                </View>
                            ) : null}

                            {upload?.error ? (
                                <Text style={styles.error}>{upload.error}</Text>
                            ) : null}

                            {attachments.length > 0 && !unresolved.length ? (
                                <Text style={styles.note}>
                                    Point at one in the brief by typing @ — &quot;@
                                    {attachments[0].ref} is the face of the video&quot;.
                                </Text>
                            ) : null}

                            {full ? (
                                <Text style={styles.note}>
                                    That is the most you can attach to one brief.
                                </Text>
                            ) : null}

                            {/* Said before Plan is pressed, because the backend
                                treats an unresolved handle as fatal — rightly,
                                but learning that from a refused run two minutes
                                later is a worse way to hear it. */}
                            {unresolved.length > 0 ? (
                                <Text style={styles.error}>
                                    {unresolved.map((r) => "@" + r).join(", ")}
                                    {unresolved.length === 1
                                        ? " is not attached any more. Attach it again or take it out of the brief — a plan will be refused while it points at nothing."
                                        : " are not attached any more. Attach them again or take them out of the brief — a plan will be refused while they point at nothing."}
                                </Text>
                            ) : null}

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
                                style={[
                                    styles.primary,
                                    (!brief.trim() || unresolved.length > 0) && styles.off,
                                ]}
                                onPress={() =>
                                    director.makePlan({
                                        brief: brief.trim(),
                                        mode,
                                        targetSeconds: seconds,
                                        // Handle and id only. Everything else
                                        // about the file is read from the
                                        // library row server-side.
                                        attachments: attachments.map((a) => ({
                                            ref: a.ref,
                                            mediaId: a.mediaId,
                                        })),
                                    })
                                }
                                // Held back on an unresolved handle rather than
                                // letting the request go and be refused: the
                                // refusal is correct but costs a round trip to
                                // learn something already visible here.
                                disabled={!brief.trim() || unresolved.length > 0}
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

                // ── Attachments ──
                attachRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
                attachBtn: {
                    paddingHorizontal: 13,
                    paddingVertical: 8,
                    borderRadius: 9,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                attachBtnText: {
                    color: colors.text,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    fontWeight: "600",
                },
                chip2: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingLeft: 4,
                    paddingRight: 6,
                    paddingVertical: 4,
                    borderRadius: 9,
                    backgroundColor: colors.tag,
                },
                // A thumbnail is an image, not a text box, so these stay
                // unwrapped by fbox.
                chipThumb: { width: 24, height: 24, borderRadius: 6 },
                chipLabel: { color: colors.text, fontSize: fs(11), lineHeight: lh(15) },
                chipX: { padding: 3 },
                suggestions: {
                    gap: 2,
                    padding: 4,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                suggestion: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 7,
                },
                suggestionThumb: { width: 22, height: 22, borderRadius: 5 },
                suggestionText: {
                    color: colors.text,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    fontWeight: "600",
                },
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
