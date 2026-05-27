import { useAIGenerate } from "@/hooks/use-ai-generate";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
    contextId?: string;
    initialTopic?: string;
    platform?: string;
    format?: string;
    onUse: (caption: string) => void;
}

const AICaptionSuggester: React.FC<Props> = ({ contextId, initialTopic, platform, format, onUse }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const [topic, setTopic] = useState(initialTopic ?? "");
    const [tone, setTone] = useState("warm");
    const { captions, captionLoading, generateCaption } = useAIGenerate();

    const run = () => {
        if (!topic.trim()) return;
        generateCaption({ topic: topic.trim(), platform, format, tone, contextId });
    };

    return (
        <View style={styles.wrap}>
            <Text style={styles.title}>Suggest captions</Text>
            <TextInput
                style={styles.input}
                placeholder="Topic"
                placeholderTextColor={colors.textSecondary}
                value={topic}
                onChangeText={setTopic}
            />
            <TextInput
                style={styles.input}
                placeholder="Tone"
                placeholderTextColor={colors.textSecondary}
                value={tone}
                onChangeText={setTone}
            />
            <Pressable
                style={({ pressed }) => [
                    styles.runBtn,
                    (!topic.trim() || captionLoading) && styles.btnDisabled,
                    pressed && styles.btnPressed,
                ]}
                onPress={run}
                disabled={!topic.trim() || captionLoading}
            >
                <Text style={styles.runText}>{captionLoading ? "Thinking…" : "Suggest"}</Text>
            </Pressable>

            {captionLoading ? <ActivityIndicator color={colors.primary} /> : null}

            <View style={styles.list}>
                {captions.map((c, i) => (
                    <View key={i} style={styles.card}>
                        <Text style={styles.cardLabel}>{c.length}</Text>
                        <Text style={styles.cardText}>{c.text}</Text>
                        <Pressable style={styles.useBtn} onPress={() => onUse(c.text)}>
                            <Text style={styles.useText}>Use this</Text>
                        </Pressable>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default AICaptionSuggester;

const makeStyles = (colors: any) =>
    StyleSheet.create({
        wrap: { padding: 14, backgroundColor: colors.card, borderRadius: 12, gap: 10 },
        title: { color: colors.text, fontSize: 16, fontWeight: "700" },
        input: {
            backgroundColor: colors.tag,
            color: colors.text,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
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
        runText: { color: "#fff", fontWeight: "700", fontSize: 13 },
        btnDisabled: { opacity: 0.4 },
        btnPressed: { opacity: 0.85 },
        list: { gap: 8 },
        card: { padding: 12, backgroundColor: colors.tag, borderRadius: 10, gap: 6 },
        cardLabel: { color: colors.primary, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
        cardText: { color: colors.text, fontSize: 14, lineHeight: 20 },
        useBtn: {
            alignSelf: "flex-start",
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: colors.primary,
            borderRadius: 8,
        },
        useText: { color: "#fff", fontWeight: "700", fontSize: 12 },
    });
