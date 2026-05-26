import { AIModel } from "@/hooks/use-ai-models";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
    models: AIModel[];
    selectedModel: string;
    onSelect: (modelId: string) => void;
    compact?: boolean;
}

const AIModelSelector: React.FC<Props> = ({ models, selectedModel, onSelect, compact }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [open, setOpen] = useState(false);
    const styles = useMemo(() => makeStyles(colors, !!compact), [colors, compact]);

    const current = models.find((m) => m.id === selectedModel) ?? models[0];

    const handlePick = (m: AIModel) => {
        if (!m.unlocked) {
            setOpen(false);
            router.push("/billing");
            return;
        }
        onSelect(m.id);
        setOpen(false);
    };

    return (
        <>
            <Pressable style={styles.chip} onPress={() => setOpen(true)}>
                <Text style={styles.chipText} numberOfLines={1}>
                    {current?.displayName ?? "Model"}
                </Text>
                <Text style={styles.chipCaret}>▾</Text>
            </Pressable>

            <Modal
                transparent
                visible={open}
                animationType="fade"
                onRequestClose={() => setOpen(false)}
            >
                <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
                    <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.sheetTitle}>Choose model</Text>
                        {models.map((m) => {
                            const isSelected = m.id === selectedModel;
                            return (
                                <Pressable
                                    key={m.id}
                                    style={[styles.row, isSelected && styles.rowSelected]}
                                    onPress={() => handlePick(m)}
                                >
                                    <View style={styles.rowText}>
                                        <Text style={styles.rowTitle}>{m.displayName}</Text>
                                        <Text style={styles.rowSubtitle}>{m.provider}</Text>
                                    </View>
                                    {!m.unlocked ? (
                                        <View style={styles.lockBadge}>
                                            <Text style={styles.lockText}>🔒 Pro</Text>
                                        </View>
                                    ) : isSelected ? (
                                        <Text style={styles.check}>✓</Text>
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

export default AIModelSelector;

const makeStyles = (colors: any, compact: boolean) =>
    StyleSheet.create({
        chip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: compact ? 8 : 10,
            paddingVertical: compact ? 4 : 6,
            backgroundColor: colors.tag,
            borderRadius: 14,
            maxWidth: 180,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        chipText: {
            color: colors.tagForeground ?? colors.text,
            fontSize: 12,
            fontWeight: "600",
        },
        chipCaret: { color: colors.tagForeground ?? colors.text, fontSize: 10 },
        backdrop: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
        },
        sheet: {
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            width: "100%",
            maxWidth: 380,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 24,
            shadowOpacity: 0.18,
            elevation: 12,
        },
        sheetTitle: {
            color: colors.text,
            fontSize: 16,
            fontWeight: "700",
            marginBottom: 12,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 10,
            borderRadius: 10,
            gap: 8,
        },
        rowSelected: { backgroundColor: colors.tag },
        rowText: { flex: 1 },
        rowTitle: { color: colors.text, fontSize: 14, fontWeight: "600" },
        rowSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
        lockBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: colors.primaryLight ?? colors.tag,
            borderRadius: 10,
        },
        lockText: { fontSize: 11, fontWeight: "700", color: colors.primary },
        check: { color: colors.primary, fontSize: 18, fontWeight: "700" },
    });
