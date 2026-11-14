/**
 * The left column: the conversation about the film, and the few actions
 * that are not part of it.
 *
 * ── It is mostly a frame now ─────────────────────────────────────────────
 * This started as the brief plus two buttons, and every piece of it has
 * since moved to where it belonged. Render went to the page header. The
 * status line went into the thread's own header, as its subtitle. The
 * scoped "change this element" box went away entirely, because the thread
 * carries the selection as a focus chip and was asking the same question
 * one box lower.
 *
 * What is left: the thread fills the column, and beneath it an action bar
 * that is drawn ONLY when it has something in it — a plan gate, the export
 * links once a render exists, a note about the linked post, a low-token
 * warning. The `brief` branch below is the no-thread fallback, which is
 * reached before the route resolves a designId.
 */
import { UpgradeInline } from "@/components/billing/EntitlementGate";
import { fs, lh } from "@/constants/Typography";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import * as Clipboard from "expo-clipboard";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { DesignGate, DesignStatus } from "./design-status";

export interface StudioBriefPanelProps {
    brief: string;
    /** The finished film, once there is one. */
    renderUrl?: string;
    onBriefChange: (text: string) => void;
    status: DesignStatus;
    gate: DesignGate;
    tokenState: string;

    written: boolean;
    authoring: boolean;
    rendering: boolean;
    /** True while the film is being finished: media resolved, gate run. */
    preparing: boolean;
    /** True when finishing the film failed and the user is stuck. */
    preparationFailed: boolean;
    submitting: boolean;
    linkedToContent: boolean;

    onAuthor: () => void;
    onRender: () => void;
    onRetryPreparation: () => void;

    /**
     * The conversation. This panel IS the conversation when it has one.
     *
     * ── Why there is no brief box beside it ──────────────────────────────
     * They are the same question asked twice. A brief box says "what should
     * this film be" and a thread says "what would you like"; a panel
     * holding both invites someone to rewrite the brief, press nothing, and
     * wonder why the film did not change.
     *
     * An empty film is no exception, and that is the part worth stating:
     * the first message IS the brief. The backend's start_design_authoring
     * tool takes it and queues the same authoring job the old button did,
     * so nothing is lost by the box going — the work still runs as a job
     * that survives a closed tab, and the user describes their film by
     * saying what they want rather than by filling in a field and hunting
     * for the button under it.
     *
     * The brief box below is the FALLBACK, for a studio mounted without a
     * thread at all. Without it this panel would be an empty box.
     */
    chat?: React.ReactNode;
}

const StudioBriefPanel: React.FC<StudioBriefPanelProps> = ({
    chat,
    brief,
    renderUrl,
    onBriefChange,
    status,
    gate,
    tokenState,
    written,
    authoring,
    rendering,
    preparing,
    preparationFailed,
    submitting,
    linkedToContent,
    onAuthor,
    onRender,
    onRetryPreparation,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    // Whether the thread is the panel. Read in three places — which of the
    // two fills it, whether Render is the primary action, and whether the
    // authoring button is offered at all — so it is decided once rather
    // than re-derived and allowed to disagree.
    //
    // NOT gated on the film existing: an empty film is exactly where the
    // conversation should start, because the first message is the brief.
    const showChat = !!chat;

    // ── Why there is no "change this element" box here ──────────────────
    // There used to be one, above the thread: a heading naming the
    // selection, a text box and a Change button, posting to the narrower
    // element/ai endpoint. It was two inputs stacked on one another asking
    // the same question, and the lower one had already won — the thread
    // carries the selection as a focus chip, so "make this bigger" typed
    // there means that element and nothing else.
    //
    // The scoped endpoint is cheaper and cannot wander, which is why the
    // box survived Phase 20. It is not worth a second composer: a person
    // reading "Change “Morning”" above a chat that is already focused on
    // Morning has to work out which of the two to use, and either answer
    // is a change to the same element.

    // ── Anything to put in the action bar? ──────────────────────────────
    // Asked before drawing it, because the bar used to render regardless:
    // in chat mode on a written film every child is conditional and all of
    // them were false, leaving 28px of padding and an empty flex row under
    // the composer — a band of nothing between the thread and the edge of
    // the screen that looked like a component failing to load.
    const gated = gate === "tokens_exhausted" || gate === "plan_locked";
    const hasActions =
        gated ||
        !showChat ||
        preparationFailed ||
        !!renderUrl ||
        linkedToContent ||
        tokenState === "critical" ||
        tokenState === "low";

    return (
        <View style={styles.root}>
            {/* ── The status, where the thread's header shows it ──────────
                In chat mode this is the AIChatPanel's own subtitle, under
                "Design Studio" — see the subtitle prop passed at the mount.
                A strip of its own above the panel spent a whole band of a
                narrow column on one sentence and pushed the conversation
                down. Without a thread there is no header to carry it, so
                the strip stays for that case. */}
            {!showChat && (
                <View style={styles.statusStrip}>
                    <View style={styles.statusRow}>
                        <View
                            style={[
                                styles.dot,
                                status.bad && styles.dotBad,
                                status.busy && styles.dotBusy,
                            ]}
                        />
                        <Text style={[styles.statusText, status.bad && styles.statusBad]}>
                            {status.detail || "Ready when you are."}
                        </Text>
                    </View>
                </View>
            )}

            {showChat ? (
                // The thread fills everything between the status line and
                // the actions. It brings its own scrolling, composer and
                // history, so it must not be nested in the ScrollView below.
                <View style={styles.chat}>{chat}</View>
            ) : (
            <ScrollView contentContainerStyle={styles.body}>
                <Text style={styles.label}>What should this film be?</Text>
                <TextInput
                    value={brief}
                    onChangeText={onBriefChange}
                    placeholder="A 10-second vertical reel for our cold brew: a hook, three benefits, a sign-off."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    style={styles.input}
                    editable={!authoring}
                />
            </ScrollView>
            )}

            {hasActions && (
            <View style={styles.actions}>
                {gate === "tokens_exhausted" ? (
                    <UpgradeInline
                        message="You're out of AI tokens this month. Add a top-up to keep making designs."
                        ctaLabel="Add tokens"
                        feature="design_studio"
                        reason="tokens_exhausted"
                    />
                ) : gate === "plan_locked" ? (
                    <UpgradeInline
                        message="Design Studio is on the paid plans."
                        feature="design_studio"
                        reason="plan_locked"
                    />
                ) : (
                    <>
                        {/* ── ⚠️ Not offered while the thread is showing ──
                                This re-runs the authoring job from the STORED
                                brief, and in chat mode that brief is not on
                                screen. A button labelled "Rewrite with AI",
                                sitting under ten minutes of conversation, is
                                read as "apply what we just discussed" — and it
                                would instead discard every one of those changes
                                and re-author from a sentence the user can no
                                longer see. The thread rewrites the film itself,
                                and keeps the revisions. */}
                        {/* ── Render lives in the page header ───────────
                            Moved out of this panel: it is the one
                            high-stakes action on the screen and it belongs
                            where the screen's other page-level actions
                            are, not at the foot of the conversation where
                            it sat under whatever the user last typed. Its
                            row went with it — an empty flex row is still a
                            gap. */}
                        {!showChat && (
                            <View style={styles.row}>
                                <Pressable
                                    onPress={onAuthor}
                                    disabled={submitting || authoring}
                                    style={({ pressed }) => [
                                        styles.primaryBtn,
                                        (pressed || submitting || authoring) && styles.dim,
                                    ]}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.primaryLabel}>
                                        {authoring ? "Writing…" : written ? "Rewrite with AI" : "Write with AI"}
                                    </Text>
                                </Pressable>
                            </View>
                        )}

                        {/* ── The one case where preparation is manual ────
                            If finishing the film failed — a gate finding, a
                            provider that would not answer — there has to be
                            a way back. Without it the only recovery is
                            Render, which charges for the same failure.

                            It appears ONLY on failure. In the normal flow
                            there is no preview action at all. */}
                        {preparationFailed && (
                            <Pressable
                                onPress={onRetryPreparation}
                                disabled={submitting || preparing}
                                style={({ pressed }) => [pressed && styles.dim]}
                                accessibilityRole="button"
                            >
                                <Text style={styles.linkAction}>
                                    {preparing ? "Preparing…" : "Try preparing again"}
                                </Text>
                            </Pressable>
                        )}

                        {/* The export. A linked design also lands on its post
                            automatically, but the file itself is what a
                            standalone design has, so it is reachable here
                            either way rather than only through the post. */}
                        {!!renderUrl && (
                            <View style={styles.row}>
                                <Pressable
                                    onPress={() => {
                                        Clipboard.setStringAsync(renderUrl);
                                        Toaster.success("Link copied", "The film's URL is on your clipboard.");
                                    }}
                                    style={({ pressed }) => [styles.exportBtn, pressed && styles.dim]}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.exportLabel}>Copy link</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => Linking.openURL(renderUrl)}
                                    style={({ pressed }) => [styles.exportBtn, pressed && styles.dim]}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.exportLabel}>Open file</Text>
                                </Pressable>
                            </View>
                        )}

                        {/* Where the finished film lands. One line, not two:
                            before it is rendered this says where it will go,
                            after it says where it went. */}
                        {linkedToContent && (
                            <Text style={styles.note}>
                                {renderUrl
                                    ? "Added to the linked post."
                                    : "Linked to a post — the export lands on it."}
                            </Text>
                        )}

                        {(tokenState === "critical" || tokenState === "low") && (
                            <Text style={styles.note}>
                                Running low on AI tokens — writing and rendering spend from the
                                same wallet. Previewing does not.
                            </Text>
                        )}
                    </>
                )}
            </View>
            )}
        </View>
    );
};

export default StudioBriefPanel;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                root: { flex: 1, backgroundColor: colors.card },
                body: { padding: 14, gap: 10 },
                // The status line sits above whichever of the two fills the
                // panel, so it reads the same in both.
                statusStrip: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
                // The thread brings its own scrolling; it takes the space and
                // is never nested in a ScrollView, which would give it two.
                chat: { flex: 1, minHeight: 0 },
                statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
                dot: {
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: colors.green,
                },
                dotBusy: { backgroundColor: colors.yellow },
                dotBad: { backgroundColor: colors.red },
                statusText: { flex: 1, fontSize: fs(11), lineHeight: lh(17), color: colors.textSecondary },
                statusBad: { color: colors.text },
                label: {
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    fontWeight: "700",
                    color: colors.text,
                    marginTop: 2,
                },
                input: {
                    minHeight: 120,
                    borderRadius: 12,
                    padding: 12,
                    textAlignVertical: "top",
                    color: colors.text,
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                note: {
                    fontSize: fs(10),
                    lineHeight: lh(15),
                    color: colors.textSecondary,
                    textAlign: "center",
                },
                actions: {
                    padding: 14,
                    gap: 8,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 4,
                },
                row: { flexDirection: "row", gap: 8 },
                primaryBtn: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 12,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                primaryLabel: {
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                secondaryBtn: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 12,
                    borderRadius: 999,
                    backgroundColor: withAlpha(colors.text, 0.08),
                },
                secondaryLabel: {
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    fontWeight: "700",
                    color: colors.text,
                },
                dim: { opacity: 0.55 },
                exportBtn: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: withAlpha(colors.primary, 0.12),
                },
                exportLabel: {
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    fontWeight: "700",
                    color: colors.primary,
                },
                linkAction: {
                    fontSize: fs(11),
                    lineHeight: lh(17),
                    fontWeight: "600",
                    color: colors.primary,
                    textAlign: "center",
                },
            }),
        [colors]
    );
}
