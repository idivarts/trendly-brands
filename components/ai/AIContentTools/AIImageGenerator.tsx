import { useAIGenerate } from "@/hooks/use-ai-generate";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const ASPECTS = ["1:1", "4:5", "16:9", "9:16"];
const STYLES = ["realistic", "illustrated", "minimal"];

interface Props {
    onSelectImage?: (url: string) => void;
}

const AIImageGenerator: React.FC<Props> = ({ onSelectImage }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const [description, setDescription] = useState("");
    const [style, setStyle] = useState("realistic");
    const [aspect, setAspect] = useState("1:1");
    const [count, setCount] = useState(1);

    const { images, imagesStreaming, generateImage } = useAIGenerate();

    const run = () => {
        if (!description.trim()) return;
        generateImage({ description: description.trim(), style, aspectRatio: aspect, count });
    };

    return (
        <View style={styles.wrap}>
            <Text style={styles.title}>Generate image{count > 1 ? "s" : ""}</Text>

            <TextInput
                style={styles.input}
                placeholder="Describe the image…"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
            />

            <Text style={styles.label}>Style</Text>
            <View style={styles.chipsRow}>
                {STYLES.map((s) => (
                    <Pressable key={s} style={[styles.chip, style === s && styles.chipActive]} onPress={() => setStyle(s)}>
                        <Text style={[styles.chipText, style === s && styles.chipTextActive]}>{s}</Text>
                    </Pressable>
                ))}
            </View>

            <Text style={styles.label}>Aspect ratio</Text>
            <View style={styles.chipsRow}>
                {ASPECTS.map((a) => (
                    <Pressable key={a} style={[styles.chip, aspect === a && styles.chipActive]} onPress={() => setAspect(a)}>
                        <Text style={[styles.chipText, aspect === a && styles.chipTextActive]}>{a}</Text>
                    </Pressable>
                ))}
            </View>

            <Text style={styles.label}>Carousel size</Text>
            <View style={styles.chipsRow}>
                {[1, 3, 5, 7, 10].map((n) => (
                    <Pressable key={n} style={[styles.chip, count === n && styles.chipActive]} onPress={() => setCount(n)}>
                        <Text style={[styles.chipText, count === n && styles.chipTextActive]}>{n}</Text>
                    </Pressable>
                ))}
            </View>

            <Pressable
                style={({ pressed }) => [
                    styles.runBtn,
                    (!description.trim() || imagesStreaming) && styles.btnDisabled,
                    pressed && styles.btnPressed,
                ]}
                onPress={run}
                disabled={!description.trim() || imagesStreaming}
            >
                <Text style={styles.runText}>{imagesStreaming ? "Generating…" : "Generate"}</Text>
            </Pressable>

            <ScrollView horizontal style={styles.gallery} contentContainerStyle={styles.galleryContent}>
                {images.map((img) => (
                    <Pressable key={img.s3Url} style={styles.imgBox} onPress={() => onSelectImage?.(img.s3Url)}>
                        <Image source={{ uri: img.s3Url }} style={styles.img} resizeMode="cover" />
                    </Pressable>
                ))}
                {imagesStreaming ? (
                    <View style={[styles.imgBox, styles.imgPlaceholder]}>
                        <ActivityIndicator color={colors.primary} />
                    </View>
                ) : null}
            </ScrollView>
        </View>
    );
};

export default AIImageGenerator;

const makeStyles = (colors: any) =>
    StyleSheet.create({
        wrap: { padding: 14, backgroundColor: colors.card, borderRadius: 12, gap: 10 },
        title: { color: colors.text, fontSize: 16, fontWeight: "700" },
        label: { color: colors.textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
        input: {
            backgroundColor: colors.tag,
            color: colors.text,
            borderRadius: 10,
            padding: 12,
            minHeight: 60,
            fontSize: 14,
        },
        chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
        chip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.tag, borderRadius: 14 },
        chipActive: { backgroundColor: colors.primary },
        chipText: { color: colors.text, fontSize: 12, fontWeight: "600" },
        chipTextActive: { color: "#fff" },
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
        gallery: { marginTop: 6 },
        galleryContent: { gap: 8 },
        imgBox: {
            width: 160,
            height: 160,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: colors.tag,
        },
        imgPlaceholder: { alignItems: "center", justifyContent: "center" },
        img: { width: "100%", height: "100%" },
    });
