import { useAIGenerate } from "@/hooks/use-ai-generate";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
    contextId?: string;
    initialTopic?: string;
    onAccept?: (script: string) => void;
}

const VIDEO_TYPES = ["Reel", "YouTube Short", "TikTok"];

const AIScriptGenerator: React.FC<Props> = ({ contextId, initialTopic, onAccept }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const [videoType, setVideoType] = useState("Reel");
    const [topic, setTopic] = useState(initialTopic ?? "");
    const [keyMessage, setKeyMessage] = useState("");
    const [tone, setTone] = useState("friendly");

    const { script, scriptStreaming, generateScript } = useAIGenerate();

    const run = () => {
        if (!topic.trim() || !keyMessage.trim()) return;
        generateScript({ videoType, topic: topic.trim(), keyMessage: keyMessage.trim(), tone, contextId });
    };

    const copy = async () => {
        if (script) await Clipboard.setStringAsync(script);
    };

    return (
        <View style={styles.wrap}>
            <Text style={styles.title}>Generate script</Text>

            <View style={styles.chipsRow}>
                {VIDEO_TYPES.map((t) => (
                    <Pressable
                        key={t}
                        style={[styles.chip, videoType === t && styles.chipActive]}
                        onPress={() => setVideoType(t)}
                    >
                        <Text style={[styles.chipText, videoType === t && styles.chipTextActive]}>{t}</Text>
                    </Pressable>
                ))}
            </View>

            <TextInput
                style={styles.input}
                placeholder="Topic — e.g. 'Diwali skincare unboxing'"
                placeholderTextColor={colors.textSecondary}
                value={topic}
                onChangeText={setTopic}
            />
            <TextInput
                style={styles.input}
                placeholder="Key message"
                placeholderTextColor={colors.textSecondary}
                value={keyMessage}
                onChangeText={setKeyMessage}
            />
            <TextInput
                style={styles.input}
                placeholder="Tone — friendly, expert, playful…"
                placeholderTextColor={colors.textSecondary}
                value={tone}
                onChangeText={setTone}
            />

            <View style={styles.actionsRow}>
                <Pressable
                    style={({ pressed }) => [
                        styles.runBtn,
                        (!topic.trim() || !keyMessage.trim() || scriptStreaming) && styles.btnDisabled,
                        pressed && styles.btnPressed,
                    ]}
                    onPress={run}
                    disabled={!topic.trim() || !keyMessage.trim() || scriptStreaming}
                >
                    <Text style={styles.runText}>{scriptStreaming ? "Writing…" : script ? "Regenerate" : "Generate"}</Text>
                </Pressable>
                {script ? (
                    <Pressable style={styles.secondaryBtn} onPress={copy}>
                        <Text style={styles.secondaryText}>Copy</Text>
                    </Pressable>
                ) : null}
                {script && onAccept ? (
                    <Pressable style={styles.secondaryBtn} onPress={() => onAccept(script)}>
                        <Text style={styles.secondaryText}>Use as script</Text>
                    </Pressable>
                ) : null}
            </View>

            <ScrollView style={styles.resultBox}>
                {scriptStreaming && !script ? (
                    <ActivityIndicator color={colors.primary} />
                ) : (
                    <Text style={styles.resultText}>{script || "Your script will appear here."}</Text>
                )}
            </ScrollView>
        </View>
    );
};

export default AIScriptGenerator;

const makeStyles = (colors: any) =>
    StyleSheet.create({
        wrap: { padding: 14, backgroundColor: colors.card, borderRadius: 12, gap: 10 },
        title: { color: colors.text, fontSize: 16, fontWeight: "700" },
        chipsRow: { flexDirection: "row", gap: 6 },
        chip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.tag, borderRadius: 14 },
        chipActive: { backgroundColor: colors.primary },
        chipText: { color: colors.text, fontSize: 12, fontWeight: "600" },
        chipTextActive: { color: "#fff" },
        input: {
            backgroundColor: colors.tag,
            color: colors.text,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
        },
        actionsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
        runBtn: {
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
        runText: { color: "#fff", fontWeight: "700", fontSize: 13 },
        secondaryBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.tag, borderRadius: 10 },
        secondaryText: { color: colors.text, fontWeight: "600", fontSize: 13 },
        btnDisabled: { opacity: 0.4 },
        btnPressed: { opacity: 0.85 },
        resultBox: {
            backgroundColor: colors.tag,
            borderRadius: 10,
            padding: 12,
            minHeight: 200,
            maxHeight: 400,
        },
        resultText: { color: colors.text, fontSize: 14, lineHeight: 20 },
    });
