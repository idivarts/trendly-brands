/**
 * The left panel: what the film should be, and the two things you can do
 * about it.
 *
 * In the Hyperframes editor this column is a chat with the agent. Here it is
 * the brief plus the actions, which is the same idea at the stage v3 is at:
 * you say what you want, the AI writes it, you look, you render. When the
 * design chat lands this panel is where it goes, and the brief becomes its
 * first message.
 */
import { UpgradeInline } from "@/components/billing/EntitlementGate";
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { DesignGate, DesignStatus } from "./design-status";

export interface StudioBriefPanelProps {
    brief: string;
    onBriefChange: (text: string) => void;
    status: DesignStatus;
    gate: DesignGate;
    tokenState: string;

    written: boolean;
    seen: boolean;
    authoring: boolean;
    rendering: boolean;
    previewing: boolean;
    submitting: boolean;
    linkedToContent: boolean;

    onAuthor: () => void;
    onPreview: () => void;
    onRender: () => void;
}

const StudioBriefPanel: React.FC<StudioBriefPanelProps> = ({
    brief,
    onBriefChange,
    status,
    gate,
    tokenState,
    written,
    seen,
    authoring,
    rendering,
    previewing,
    submitting,
    linkedToContent,
    onAuthor,
    onPreview,
    onRender,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    return (
        <View style={styles.root}>
            <ScrollView contentContainerStyle={styles.body}>
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

                {linkedToContent && (
                    <Text style={styles.note}>Linked to a post — the export lands on it.</Text>
                )}
            </ScrollView>

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

                            {/* The free look leads until there has been one.
                                Approving a film you have not seen is not
                                approval. */}
                            {!seen ? (
                                <Pressable
                                    onPress={onPreview}
                                    disabled={submitting || previewing || !written}
                                    style={({ pressed }) => [
                                        styles.secondaryBtn,
                                        (pressed || submitting || previewing || !written) && styles.dim,
                                    ]}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.secondaryLabel}>
                                        {previewing ? "Looking…" : "Preview — free"}
                                    </Text>
                                </Pressable>
                            ) : (
                                <Pressable
                                    onPress={onRender}
                                    disabled={submitting || rendering || !written}
                                    style={({ pressed }) => [
                                        styles.secondaryBtn,
                                        (pressed || submitting || rendering || !written) && styles.dim,
                                    ]}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.secondaryLabel}>
                                        {rendering ? "Rendering…" : "Render"}
                                    </Text>
                                </Pressable>
                            )}
                        </View>

                        {seen && written && (
                            <Pressable
                                onPress={onPreview}
                                disabled={submitting || previewing}
                                style={({ pressed }) => [pressed && styles.dim]}
                                accessibilityRole="button"
                            >
                                <Text style={styles.linkAction}>
                                    {previewing ? "Taking frames…" : "Preview again — free"}
                                </Text>
                            </Pressable>
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
