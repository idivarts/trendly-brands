import { useAIGenerate } from "@/hooks/use-ai-generate";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
    contextId?: string;
    initialTopic?: string;
    platform?: string;
    onApply: (hashtags: string) => void;
}

const AIHashtagSuggester: React.FC<Props> = ({ contextId, initialTopic, platform, onApply }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const [topic, setTopic] = useState(initialTopic ?? "");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const { hashtags, hashtagLoading, generateHashtags } = useAIGenerate();

    const run = () => {
        if (!topic.trim()) return;
        setSelected(new Set());
        generateHashtags({ topic: topic.trim(), platform, contextId });
    };

    const toggle = (tag: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(tag)) next.delete(tag);
            else next.add(tag);
            return next;
        });
    };

    const apply = () => {
        const out = Array.from(selected).map((t) => `#${t}`).join(" ");
        onApply(out);
    };

    return (
        <View style={styles.wrap}>
            <Text style={styles.title}>Suggest hashtags</Text>
            <TextInput
                style={styles.input}
                placeholder="Topic"
                placeholderTextColor={colors.textSecondary}
                value={topic}
                onChangeText={setTopic}
            />
            <Pressable
                style={({ pressed }) => [
                    styles.runBtn,
                    (!topic.trim() || hashtagLoading) && styles.btnDisabled,
                    pressed && styles.btnPressed,
                ]}
                onPress={run}
                disabled={!topic.trim() || hashtagLoading}
            >
                <Text style={styles.runText}>{hashtagLoading ? "Searching…" : "Suggest"}</Text>
            </Pressable>

            {hashtagLoading ? <ActivityIndicator color={colors.primary} /> : null}

            {hashtags.map((g) => (
                <View key={g.tier} style={styles.group}>
                    <Text style={styles.groupTitle}>{g.tier}</Text>
                    <View style={styles.tagWrap}>
                        {g.tags.map((t) => {
                            const isSel = selected.has(t);
                            return (
                                <Pressable
                                    key={t}
                                    style={[styles.tag, isSel && styles.tagActive]}
                                    onPress={() => toggle(t)}
                                >
                                    <Text style={[styles.tagText, isSel && styles.tagTextActive]}>
                                        #{t}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            ))}

            {selected.size > 0 ? (
                <Pressable style={styles.applyBtn} onPress={apply}>
                    <Text style={styles.applyText}>Apply {selected.size} hashtag{selected.size !== 1 ? "s" : ""}</Text>
                </Pressable>
            ) : null}
        </View>
    );
};

export default AIHashtagSuggester;

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
        group: { gap: 6 },
        groupTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
        tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
        tag: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.tag, borderRadius: 12 },
        tagActive: { backgroundColor: colors.primary },
        tagText: { color: colors.text, fontSize: 12 },
        tagTextActive: { color: "#fff", fontWeight: "700" },
        applyBtn: {
            alignSelf: "flex-start",
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: colors.primary,
            borderRadius: 10,
        },
        applyText: { color: "#fff", fontWeight: "700", fontSize: 13 },
    });
