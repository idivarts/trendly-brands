/**
 * ScriptEditorBody — the script authoring surface itself: the rich text editor,
 * the optional AI-model selector, and the AI prompt row.
 *
 * Extracted so one implementation can live in two chromes. A `live` content is
 * script-only, so its editor stays inline on the page (ScriptEditor); a reel or
 * video treats the script as a production document, so it gets the full width of
 * a modal (ScriptModal) instead of a cramped page column.
 */
import AIModelSelector from "@/components/ai/AIModelSelector/AIModelSelector";
import RichTextEditor from "@/components/rich-text-editor";
import { fs, lh } from "@/constants/Typography";
import { useAIConfig } from "@/contexts/ai-config-context.provider";
import Colors from "@/shared-uis/constants/Colors";
import { faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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
    /** Let the editor fill the available height (modal) rather than sit at its
     *  natural height (inline page card). */
    fill?: boolean;
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
    fill = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const { modelsForTask, resolveForTask } = useAIConfig();
    const taskModels = task ? modelsForTask(task) : [];
    const [modelOverride, setModelOverride] = useState<string | undefined>(undefined);
    const selectedModel = task ? resolveForTask(task, modelOverride).modelId ?? "" : "";

    return (
        <>
            {isGenerating ? (
                <TextInput
                    style={[styles.input, styles.editorWrap, fill && styles.editorFill]}
                    placeholder={"[Scene 1 - Hook]\nHey everyone...\n\n[Scene 2 - Main content]\n...\n\n[Scene 3 - CTA]\nFollow for more!"}
                    placeholderTextColor={colors.textSecondary}
                    value={script}
                    onChangeText={() => { }}
                    multiline
                    textAlignVertical="top"
                />
            ) : (
                <View style={[styles.editorWrap, fill && styles.editorFill]}>
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

            {!readOnly ? (
                <>
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
                    <View style={styles.aiPromptRow}>
                        <TextInput
                            style={[styles.input, styles.aiPromptInput]}
                            placeholder="Describe changes or ask AI to generate the script…"
                            placeholderTextColor={colors.textSecondary}
                            value={aiPrompt}
                            onChangeText={onAiPromptChange}
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
                                {isGenerating ? "Generating…" : "Enhance"}
                            </Text>
                        </Pressable>
                    </View>
                </>
            ) : null}
        </>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        editorWrap: {
            minHeight: 180,
            marginTop: 12,
        },
        editorFill: {
            flex: 1,
            minHeight: 240,
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
