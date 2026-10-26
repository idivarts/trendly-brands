/**
 * ScriptEditorBody — the script authoring surface itself: the rich text editor,
 * the optional AI-model selector, and the AI prompt row.
 *
 * Extracted so one implementation can live in two chromes. A `live` content is
 * script-only, so its editor stays inline on the page (ScriptEditor); a reel or
 * video treats the script as a production document, so it gets the full width of
 * the Overview tab's own section.
 */
import AIModelSelector from "@/components/ai/AIModelSelector/AIModelSelector";
import RichTextEditor from "@/components/rich-text-editor";
import { fs, lh } from "@/constants/Typography";
import { useAIConfig } from "@/contexts/ai-config-context.provider";
import { withAlpha } from "@/utils/color";
import Colors from "@/shared-uis/constants/Colors";
import { faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

/**
 * Starters for an empty script. They are examples of the KIND of brief that
 * works — a length, a subject, a mood, an ending — which is the part people
 * stall on, not the typing.
 */
const AI_SCRIPT_EXAMPLES = [
    "A 20s reel explaining our best-selling product",
    "Punchy launch teaser, ends on a discount code",
    "Three quick tips, one per scene",
];

export interface ScriptEditorBodyProps {
    script: string;
    onScriptChange: (s: string) => void;
    aiPrompt: string;
    onAiPromptChange: (s: string) => void;
    /** Fires with the chosen AI model (when a selector is shown). */
    onEnhance: (model?: string) => void;
    isGenerating: boolean;
    /** When set, shows an AI-model selector for this task (e.g. "script"). */
    task?: string;
    contentId?: string;
    onSendToChat: (text: string) => void;
    /** When true the script is read-only (content is scheduled or posted). */
    readOnly?: boolean;
}

const ScriptEditorBody: React.FC<ScriptEditorBodyProps> = ({
    script,
    onScriptChange,
    aiPrompt,
    onAiPromptChange,
    onEnhance,
    isGenerating,
    task,
    contentId,
    onSendToChat,
    readOnly = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const { modelsForTask, resolveForTask } = useAIConfig();
    const taskModels = task ? modelsForTask(task) : [];
    const [modelOverride, setModelOverride] = useState<string | undefined>(undefined);
    const selectedModel = task ? resolveForTask(task, modelOverride).modelId ?? "" : "";

    // Empty script → the AI panel leads and the editor follows. Once there is
    // something to edit, the editor leads. Order is the strongest statement of
    // what this surface is for, and it was making the wrong one.
    const hasScript = !!script && script.replace(/<[^>]*>/g, "").trim().length > 0;

    const editor = (
        <>
            {isGenerating ? (
                <TextInput
                    style={[styles.input, styles.editorWrap]}
                    placeholder={"[Scene 1 - Hook]\nHey everyone...\n\n[Scene 2 - Main content]\n...\n\n[Scene 3 - CTA]\nFollow for more!"}
                    placeholderTextColor={colors.textSecondary}
                    value={script}
                    onChangeText={() => { }}
                    multiline
                    textAlignVertical="top"
                />
            ) : (
                <View style={styles.editorWrap}>
                    <RichTextEditor
                        content={script}
                        onChange={onScriptChange}
                        onSendToChat={onSendToChat}
                        strategyId={contentId}
                        module="content"
                        lock={readOnly ? { editable: false } : undefined}
                    />
                </View>
            )}
        </>
    );

    const aiPanel = !readOnly ? (
                /* The AI panel, deliberately loud.
                 *
                 * It used to be the quietest thing here: a grey input and a
                 * button, below a 180px blank canvas, labelled "Enhance". The
                 * reading order taught the wrong habit — write it yourself,
                 * then maybe ask — and "enhance" asks for something to improve,
                 * which on an empty script there is not. The product's whole
                 * claim is the other way round: describe the reel, the AI
                 * writes it.
                 *
                 * So on an empty script it sits ABOVE the editor, tinted and
                 * titled, offering examples to tap. Once a script exists it
                 * drops below and becomes "refine", because then the editor IS
                 * the subject and the AI is editing it. */
                <View style={[styles.aiPanel, hasScript && styles.aiPanelAfter]}>
                    <View style={styles.aiHead}>
                        <View style={styles.aiIcon}>
                            <FontAwesomeIcon
                                icon={faMagicWandSparkles}
                                size={14}
                                color={colors.onPrimary}
                            />
                        </View>
                        <View style={styles.aiHeadText}>
                            <Text style={styles.aiTitle}>
                                {hasScript ? "Refine it with AI" : "Let AI write it"}
                            </Text>
                            <Text style={styles.aiSub}>
                                {hasScript
                                    ? "Describe what to change — tighten the hook, add a scene, change the tone."
                                    : "Describe the reel — the idea, the mood, who it is for. You get a shot-by-shot script to edit."}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.aiPromptRow}>
                        <TextInput
                            style={[styles.input, styles.aiPromptInput]}
                            placeholder={
                                hasScript
                                    ? "Describe what to change…"
                                    : "e.g. A 20s reel on why our cold brew is less acidic — warm, upbeat, ends on the 20% off code"
                            }
                            placeholderTextColor={colors.textSecondary}
                            value={aiPrompt}
                            onChangeText={onAiPromptChange}
                            multiline={!hasScript}
                        />
                        <Pressable
                            style={({ pressed }) => [
                                styles.aiSendBtn,
                                (!aiPrompt.trim() || isGenerating) && styles.aiSendBtnDisabled,
                                pressed && styles.btnPressed,
                            ]}
                            onPress={() => onEnhance(task ? selectedModel || undefined : undefined)}
                            disabled={!aiPrompt.trim() || isGenerating}
                        >
                            <FontAwesomeIcon icon={faMagicWandSparkles} size={14} color={colors.onPrimary} />
                            <Text style={styles.aiSendBtnText}>
                                {isGenerating
                                    ? "Writing…"
                                    : hasScript
                                        ? "Update script"
                                        : "Write the script"}
                            </Text>
                        </Pressable>
                    </View>

                    {/* The primary action is disabled until something is typed,
                        so on an empty script the loudest element on the panel
                        would be dead on arrival. These give it something to do
                        AND show the KIND of thing to say, which is the part
                        people get stuck on. */}
                    {!hasScript && !aiPrompt.trim() && !isGenerating ? (
                        <View style={styles.aiExamples}>
                            {AI_SCRIPT_EXAMPLES.map((ex) => (
                                <Pressable
                                    key={ex}
                                    style={({ pressed }) => [styles.aiChip, pressed && styles.btnPressed]}
                                    onPress={() => onAiPromptChange(ex)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Use example: ${ex}`}
                                >
                                    <Text style={styles.aiChipText}>{ex}</Text>
                                </Pressable>
                            ))}
                        </View>
                    ) : null}

                    {task && taskModels.length > 0 ? (
                        <View style={styles.modelRow}>
                            <Text style={styles.modelLabel}>Model</Text>
                            <AIModelSelector
                                models={taskModels}
                                selectedModel={selectedModel}
                                onSelect={setModelOverride}
                                compact
                            />
                        </View>
                    ) : null}
                </View>
    ) : null;

    return (
        <>
            {hasScript ? editor : aiPanel}
            {hasScript ? aiPanel : editor}
        </>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        editorWrap: {
            minHeight: 110,
            marginTop: 12,
        },
        input: {
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: fs(14),
            lineHeight: lh(21),
            color: colors.text,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        // Tinted, bordered and titled — an OFFER, not another form field. The
        // old row used the same grey as every input on the page, so the one
        // thing the product wants people to try looked like plumbing.
        aiPanel: {
            marginBottom: 14,
            padding: 14,
            borderRadius: 14,
            backgroundColor: withAlpha(colors.primary, 0.06),
            borderWidth: 1,
            borderColor: withAlpha(colors.primary, 0.22),
        },
        // Below an existing script it is a refinement, not the headline, so it
        // gives the weight back to the editor above it.
        aiPanelAfter: {
            marginTop: 14,
            marginBottom: 0,
            backgroundColor: colors.tag,
            borderColor: "transparent",
        },
        aiHead: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 11,
        },
        aiIcon: {
            width: 30,
            height: 30,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
        },
        aiHeadText: {
            flex: 1,
        },
        aiTitle: {
            fontSize: fs(14),
            lineHeight: lh(19),
            fontWeight: "700",
            color: colors.text,
        },
        aiSub: {
            fontSize: fs(12.5),
            lineHeight: lh(18),
            color: colors.textSecondary,
            marginTop: 2,
        },
        aiExamples: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 10,
        },
        aiChip: {
            paddingHorizontal: 11,
            paddingVertical: 7,
            borderRadius: 9,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: withAlpha(colors.primary, 0.25),
        },
        aiChipText: {
            fontSize: fs(12),
            lineHeight: lh(16),
            color: colors.primary,
            fontWeight: "600",
        },
        modelRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginTop: 12,
        },
        modelLabel: {
            fontSize: fs(12),
            fontWeight: "700",
            color: colors.textSecondary,
        },
        aiPromptRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginTop: 12,
        },
        aiPromptInput: {
            flex: 1,
        },
        aiSendBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        aiSendBtnDisabled: {
            opacity: 0.5,
        },
        aiSendBtnText: {
            fontSize: fs(13),
            fontWeight: "700",
            color: colors.onPrimary,
        },
        btnPressed: {
            opacity: 0.72,
        },
    });
}

export default ScriptEditorBody;
