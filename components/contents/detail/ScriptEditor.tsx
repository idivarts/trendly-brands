import AIModelSelector from "@/components/ai/AIModelSelector/AIModelSelector";
import RichTextEditor from "@/components/rich-text-editor";
import { useAIConfig } from "@/contexts/ai-config-context.provider";
import Colors from "@/shared-uis/constants/Colors";
import {
    faChevronDown,
    faChevronUp,
    faMagicWandSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface ScriptEditorProps {
    title: string;
    subtitle: string;
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
    /** Reel: script is optional and collapsed by default. Live: always open. */
    collapsible?: boolean;
    /** When true the script is read-only (content is scheduled or posted). */
    readOnly?: boolean;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({
    title,
    subtitle,
    script,
    onScriptChange,
    aiPrompt,
    onAiPromptChange,
    onEnhance,
    isGenerating,
    task,
    contentId,
    onSendToChat,
    collapsible = false,
    readOnly = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const { modelsForTask, resolveForTask } = useAIConfig();
    const taskModels = task ? modelsForTask(task) : [];
    const [modelOverride, setModelOverride] = useState<string | undefined>(undefined);
    const selectedModel = task ? resolveForTask(task, modelOverride).modelId ?? "" : "";

    // Reel: start collapsed unless a script already exists. Live: always expanded.
    const [expanded, setExpanded] = useState(!collapsible || !!script);

    return (
        <View style={[styles.card, collapsible && styles.cardCollapsible]}>
            <Pressable
                style={styles.header}
                onPress={collapsible ? () => setExpanded((v) => !v) : undefined}
                disabled={!collapsible}
            >
                <View style={styles.headerText}>
                    <Text style={styles.cardTitle}>
                        {title}
                        {collapsible ? <Text style={styles.optional}>  ·  optional</Text> : null}
                    </Text>
                    <Text style={styles.cardSub}>{subtitle}</Text>
                </View>
                {collapsible ? (
                    <FontAwesomeIcon
                        icon={expanded ? faChevronUp : faChevronDown}
                        size={14}
                        color={colors.textSecondary}
                    />
                ) : null}
            </Pressable>

            {expanded ? (
                <>
                    {isGenerating ? (
                        <TextInput
                            style={[styles.input, styles.scriptEditorContainer]}
                            placeholder={"[Scene 1 - Hook]\nHey everyone...\n\n[Scene 2 - Main content]\n...\n\n[Scene 3 - CTA]\nFollow for more!"}
                            placeholderTextColor={colors.textSecondary}
                            value={script}
                            onChangeText={() => { }}
                            multiline
                            textAlignVertical="top"
                        />
                    ) : (
                        <View style={styles.scriptEditorContainer}>
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

                    {!readOnly && (
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
                            <FontAwesomeIcon
                                icon={faMagicWandSparkles}
                                size={14}
                                color={colors.onPrimary}
                            />
                            <Text style={styles.aiSendBtnText}>
                                {isGenerating ? "Generating…" : "Enhance"}
                            </Text>
                        </Pressable>
                    </View>
                    </>
                    )}
                </>
            ) : null}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        card: {
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        cardCollapsible: {
            marginTop: 12,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
        },
        headerText: {
            flex: 1,
        },
        cardTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 4,
        },
        optional: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        cardSub: {
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 18,
        },
        input: {
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 14,
            color: colors.text,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        scriptEditorContainer: {
            height: 360,
            borderRadius: 10,
            overflow: "hidden",
            marginTop: 12,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        modelRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
        },
        modelLabel: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        aiPromptRow: {
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
        },
        aiPromptInput: {
            flex: 1,
        },
        aiSendBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        aiSendBtnDisabled: {
            opacity: 0.45,
            shadowOpacity: 0,
            elevation: 0,
        },
        aiSendBtnText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.onPrimary,
        },
        btnPressed: {
            opacity: 0.72,
        },
    });
}

export default ScriptEditor;
