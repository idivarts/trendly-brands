import AIModelSelector from "@/components/ai/AIModelSelector/AIModelSelector";
import { AIModel } from "@/hooks/use-ai-models";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AIQuickEditModal from "./AIQuickEditModal";

interface Props {
    selectedText: string;
    module: string;
    contextId?: string;
    models: AIModel[];
    defaultModel: string;
    presets?: { label: string; prompt: string; icon?: string }[];
    onAccept: (newText: string) => void;
    onClose?: () => void;
}

const DEFAULT_PRESETS = [
    { icon: "✏️", label: "Improve", prompt: "Improve the text — clearer, tighter, more impactful. Keep the same meaning." },
    { icon: "📝", label: "Summarise", prompt: "Summarise the text into one short paragraph." },
    { icon: "🔁", label: "Rewrite", prompt: "Rewrite the text in a different way while keeping the meaning." },
];

const AIQuickEditToolbar: React.FC<Props> = ({
    selectedText,
    module,
    contextId,
    models,
    defaultModel,
    presets,
    onAccept,
    onClose,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const [model, setModel] = useState(defaultModel);
    const [modalOpen, setModalOpen] = useState(false);
    const [initialPrompt, setInitialPrompt] = useState<string | undefined>();

    const handlePreset = (prompt: string) => {
        setInitialPrompt(prompt);
        setModalOpen(true);
    };

    const handleCustom = () => {
        setInitialPrompt(undefined);
        setModalOpen(true);
    };

    return (
        <View style={styles.wrap}>
            <View style={styles.row}>
                {(presets ?? DEFAULT_PRESETS).map((p) => (
                    <Pressable
                        key={p.label}
                        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                        onPress={() => handlePreset(p.prompt)}
                    >
                        <Text style={styles.btnText}>
                            {p.icon ? `${p.icon} ` : ""}{p.label}
                        </Text>
                    </Pressable>
                ))}
                <Pressable
                    style={({ pressed }) => [styles.btn, styles.customBtn, pressed && styles.btnPressed]}
                    onPress={handleCustom}
                >
                    <Text style={styles.customText}>✨ Custom…</Text>
                </Pressable>
                <AIModelSelector
                    models={models}
                    selectedModel={model}
                    onSelect={setModel}
                    compact
                />
                {onClose ? (
                    <Pressable hitSlop={6} onPress={onClose}>
                        <Text style={styles.close}>✕</Text>
                    </Pressable>
                ) : null}
            </View>

            <AIQuickEditModal
                visible={modalOpen}
                onClose={() => setModalOpen(false)}
                selectedText={selectedText}
                initialPrompt={initialPrompt}
                module={module}
                contextId={contextId}
                model={model}
                onAccept={onAccept}
            />
        </View>
    );
};

export default AIQuickEditToolbar;

const makeStyles = (colors: any) =>
    StyleSheet.create({
        wrap: {
            padding: 8,
            backgroundColor: colors.card,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            shadowOpacity: 0.12,
            elevation: 6,
        },
        row: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
        btn: {
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: colors.tag,
            borderRadius: 14,
        },
        btnPressed: { opacity: 0.7 },
        btnText: { color: colors.text, fontSize: 12, fontWeight: "600" },
        customBtn: { backgroundColor: colors.primaryLight ?? colors.tag },
        customText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
        close: { color: colors.textSecondary, fontSize: 16, paddingHorizontal: 4 },
    });
