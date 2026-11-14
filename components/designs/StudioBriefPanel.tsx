/**
 * The left panel: what the film should be, and the two things you can do
 * about it.
 *
 * In the Hyperframes editor this column is a chat with the agent. Here it is
 * the brief plus the actions, which is the same idea at the stage v3 is at:
 * you say what you want, the AI writes it, you look, you render. When the
 * design chat lands this panel is where it goes, and the brief becomes its
 * first message.
 *
 * ── Two scopes, one panel ────────────────────────────────────────────────
 * With nothing selected, what you say rewrites the WHOLE film. With an
 * element selected it changes THAT element and nothing else — a second box
 * appears, headed with what is selected, and the brief above it is left
 * alone. The scope is never implicit: the user can always see which of the
 * two they are about to do, because the box they are typing in says so.
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

    /** What the user picked in the player, or null. */
    selectionLabel?: string | null;
    /** Asks the AI to change that element alone. */
    onAskAboutSelection?: (instruction: string) => void;

    /**
     * The conversation, once this film has one.
     *
     * ── Why the brief and the chat are not both on screen ────────────────
     * They are the same question asked twice. A brief box says "what should
     * this film be" and a chat says "what would you like to change", and a
     * panel holding both invites someone to rewrite the brief, press
     * nothing, and wonder why the film did not change.
     *
     * So: a film with nothing in it shows the brief, because a brief is how
     * a film STARTS and there is nothing yet to have a conversation about.
     * Once it is written the thread takes over, and the brief lives on as
     * that thread's first message. The status line and the actions stay in
     * both, because they are about the film rather than about the request.
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
    selectionLabel,
    onAskAboutSelection,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const [instruction, setInstruction] = React.useState("");

    // The box is cleared when the selection changes, not kept: an
    // instruction written about a headline must not be sent, a click later,
    // about a photograph.
    React.useEffect(() => setInstruction(""), [selectionLabel]);

    const ask = () => {
        const text = instruction.trim();
        if (!text || !onAskAboutSelection) return;
        setInstruction("");
        onAskAboutSelection(text);
    };

    return (
        <View style={styles.root}>
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

            {chat && written ? (
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

                {/* ── The scoped box ───────────────────────────────────
                    Only here when something is selected, and headed with
                    what that is, so the difference between "change this"
                    and "rewrite everything" is never a guess. */}
                {!!selectionLabel && !!onAskAboutSelection && (
                    <View style={styles.scoped}>
                        <Text style={styles.scopedHead} numberOfLines={1}>
                            Change “{selectionLabel}”
                        </Text>
                        <TextInput
                            value={instruction}
                            onChangeText={setInstruction}
                            placeholder="Make it bigger and more urgent."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            style={styles.input}
                            editable={!submitting}
                        />
                        <Pressable
                            onPress={ask}
                            disabled={submitting || instruction.trim() === ""}
                            style={({ pressed }) => [
                                styles.scopedBtn,
                                (pressed || submitting || instruction.trim() === "") && styles.dim,
                            ]}
                            accessibilityRole="button"
                        >
                            <Text style={styles.scopedLabel}>
                                {submitting ? "Changing…" : "Change this element"}
                            </Text>
                        </Pressable>
                    </View>
                )}

                {linkedToContent && (
                    <Text style={styles.note}>Linked to a post — the export lands on it.</Text>
                )}
            </ScrollView>
            )}

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

                            {/* ── Render is the only action ─────────────────
                                There was a "Preview — free" button here, and
                                it existed because the film's media is
                                resolved by the worker, not by authoring — so
                                a design opened before pressing it was missing
                                the photograph the brief asked for. Making the
                                user press a button to complete their own film
                                is not a step, it is a gap.

                                Preparation now runs by itself the moment
                                authoring finishes, so the live player is the
                                finished film and this is the only thing left
                                to decide. */}
                            <Pressable
                                onPress={onRender}
                                disabled={submitting || rendering || preparing || !written}
                                style={({ pressed }) => [
                                    styles.secondaryBtn,
                                    (pressed || submitting || rendering || preparing || !written) && styles.dim,
                                ]}
                                accessibilityRole="button"
                            >
                                <Text style={styles.secondaryLabel}>
                                    {rendering ? "Rendering…" : preparing ? "Preparing…" : "Render"}
                                </Text>
                            </Pressable>
                        </View>

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

                        {linkedToContent && !!renderUrl && (
                            <Text style={styles.note}>Added to the linked post.</Text>
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
                scoped: {
                    gap: 6,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 4,
                    shadowOpacity: 0.05,
                    elevation: 1,
                },
                scopedHead: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    color: withAlpha(colors.text, 0.55),
                },
                scopedBtn: {
                    alignItems: "center",
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                scopedLabel: {
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    fontWeight: "700",
                    color: colors.white,
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
