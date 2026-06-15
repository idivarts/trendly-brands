import { useAIQuickEdit } from "@/hooks/use-ai-quick-edit";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
    visible: boolean;
    onClose: () => void;
    selectedText: string;
    initialPrompt?: string;
    module: string;
    contextId?: string;
    model?: string;
    onAccept: (newText: string) => void;
}

const AIQuickEditModal: React.FC<Props> = ({
    visible,
    onClose,
    selectedText,
    initialPrompt,
    module,
    contextId,
    model,
    onAccept,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const [prompt, setPrompt] = useState(initialPrompt ?? "");
    const { result, isStreaming, runEdit, reset } = useAIQuickEdit();

    useEffect(() => {
        if (visible) {
            setPrompt(initialPrompt ?? "");
            reset();
            if (initialPrompt) {
                runEdit({ selectedText, prompt: initialPrompt, model, module, contextId });
            }
        }
    }, [visible, initialPrompt, selectedText, model, module, contextId, runEdit, reset]);

    const run = () => {
        if (!prompt.trim()) return;
        Keyboard.dismiss();
        runEdit({ selectedText, prompt: prompt.trim(), model, module, contextId });
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.kav}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <Pressable style={styles.backdrop} onPress={onClose}>
                    <Pressable
                        style={styles.sheet}
                        onPress={(e) => {
                            e.stopPropagation();
                            // Tapping the sheet (outside the text field) dismisses
                            // the soft keyboard — native only. On web there's no
                            // soft keyboard, and the click bubbles up from the
                            // TextInput, so dismissing here would instantly blur
                            // the input the user just clicked into.
                            if (Platform.OS !== "web") Keyboard.dismiss();
                        }}
                    >
                    <Text style={styles.title}>Edit with AI</Text>

                    {selectedText.length > 0 && (
                        <View style={styles.selectedPreview}>
                            {/* Accent strip — using a child View instead of borderLeft per project rules */}
                            <View style={styles.selectedAccent} />
                            <View style={styles.selectedContent}>
                                <Text style={styles.selectedLabel}>Selected text</Text>
                                <ScrollView style={styles.selectedScroll}>
                                    <Text style={styles.selectedText}>{selectedText}</Text>
                                </ScrollView>
                            </View>
                        </View>
                    )}

                    <Text style={styles.label}>Instruction</Text>
                    <TextInput
                        style={styles.promptInput}
                        value={prompt}
                        onChangeText={setPrompt}
                        placeholder="e.g. Make it more punchy and add a CTA"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                    />
                    <Pressable
                        style={({ pressed }) => [styles.runBtn, !prompt.trim() && styles.runBtnDisabled, pressed && styles.runBtnPressed]}
                        onPress={run}
                        disabled={!prompt.trim() || isStreaming}
                    >
                        <Text style={styles.runText}>{isStreaming ? "Generating…" : "Generate"}</Text>
                    </Pressable>

                    <View style={styles.resultHeader}>
                        <Text style={styles.label}>Result</Text>
                        {isStreaming ? <ActivityIndicator size="small" color={colors.primary} /> : null}
                    </View>
                    <ScrollView style={styles.resultBox}>
                        <Text style={styles.resultText}>{result || "—"}</Text>
                    </ScrollView>

                    <View style={styles.actionsRow}>
                        <Pressable style={[styles.actionBtn, styles.discardBtn]} onPress={onClose}>
                            <Text style={styles.discardText}>Discard</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.actionBtn, styles.acceptBtn, (!result || isStreaming) && styles.acceptDisabled]}
                            onPress={() => {
                                if (result) {
                                    onAccept(result);
                                    onClose();
                                }
                            }}
                            disabled={!result || isStreaming}
                        >
                            <Text style={styles.acceptText}>Accept</Text>
                        </Pressable>
                    </View>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default AIQuickEditModal;

const makeStyles = (colors: any) =>
    StyleSheet.create({
        kav: { flex: 1 },
        backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 16 },
        sheet: {
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            width: "100%",
            maxWidth: 560,
            maxHeight: "90%",
            gap: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 24,
            shadowOpacity: 0.2,
            elevation: 12,
        },
        title: { color: colors.text, fontSize: 18, fontWeight: "700" },
        label: { color: colors.textSecondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
        selectedPreview: {
            flexDirection: "row",
            backgroundColor: colors.aliceBlue,
            borderRadius: 10,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 4,
            shadowOpacity: 0.05,
            elevation: 1,
        },
        selectedAccent: {
            width: 4,
            alignSelf: "stretch",
            backgroundColor: colors.primary,
        },
        selectedContent: {
            flex: 1,
            padding: 10,
        },
        selectedLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.primary,
            marginBottom: 4,
            textTransform: "uppercase",
            letterSpacing: 0.5,
        },
        selectedScroll: { maxHeight: 100 },
        selectedText: {
            fontSize: 13,
            color: colors.textSecondary,
            fontStyle: "italic",
            lineHeight: 18,
        },
        promptInput: {
            backgroundColor: colors.tag,
            color: colors.text,
            borderRadius: 10,
            padding: 10,
            minHeight: 50,
            fontSize: 14,
        },
        runBtn: {
            alignSelf: "flex-start",
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: colors.primary,
            borderRadius: 10,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.3,
            elevation: 4,
        },
        runBtnDisabled: { opacity: 0.4 },
        runBtnPressed: { opacity: 0.85 },
        runText: { color: "#fff", fontWeight: "700", fontSize: 13 },
        resultHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
        resultBox: {
            backgroundColor: colors.tag,
            borderRadius: 10,
            padding: 10,
            minHeight: 80,
            maxHeight: 240,
        },
        resultText: { color: colors.text, fontSize: 14, lineHeight: 20 },
        actionsRow: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
        actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
        discardBtn: { backgroundColor: colors.tag },
        discardText: { color: colors.text, fontWeight: "600" },
        acceptBtn: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.3,
            elevation: 4,
        },
        acceptDisabled: { opacity: 0.4 },
        acceptText: { color: "#fff", fontWeight: "700" },
    });
