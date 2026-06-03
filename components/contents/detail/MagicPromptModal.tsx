import { View } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import {
    faMagicWandSparkles,
    faPaperPlane,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput } from "react-native";

// ─── Magic Wand Prompt Modal ──────────────────────────────────────────────────
// Self-contained AI-prompt sheet used by the content detail page for caption /
// hashtag generation. Extracted from the screen as part of the Phase 0 refactor.

export interface MagicPromptModalProps {
    visible: boolean;
    title: string;
    placeholder: string;
    onClose: () => void;
    onGenerate: (prompt: string) => void;
}

const MagicPromptModal: React.FC<MagicPromptModalProps> = ({
    visible,
    title,
    placeholder,
    onClose,
    onGenerate,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [prompt, setPrompt] = useState("");
    const styles = useMemo(() => magicStyles(colors), [colors]);

    const handleGenerate = () => {
        if (!prompt.trim()) return;
        onGenerate(prompt.trim());
        setPrompt("");
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.wand}>
                            <FontAwesomeIcon
                                icon={faMagicWandSparkles}
                                size={16}
                                color={colors.primary}
                            />
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <FontAwesomeIcon icon={faXmark} size={15} color={colors.textSecondary} />
                        </Pressable>
                    </View>
                    <View style={styles.body}>
                        <TextInput
                            style={styles.input}
                            placeholder={placeholder}
                            placeholderTextColor={colors.textSecondary}
                            value={prompt}
                            onChangeText={setPrompt}
                            multiline
                            maxLength={300}
                            textAlignVertical="top"
                            autoFocus
                        />
                    </View>
                    <View style={styles.footer}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.cancelBtn,
                                pressed && styles.btnPressed,
                            ]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.generateBtn,
                                !prompt.trim() && styles.generateBtnDisabled,
                                pressed && styles.btnPressed,
                            ]}
                            onPress={handleGenerate}
                            disabled={!prompt.trim()}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} size={13} color={colors.onPrimary} />
                            <Text style={styles.generateText}>Generate</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

function magicStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: colors.backdrop,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
        },
        sheet: {
            width: "100%",
            maxWidth: 440,
            backgroundColor: colors.card,
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.16,
            elevation: 12,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 18,
            paddingVertical: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        wand: {
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: colors.aliceBlue,
            alignItems: "center",
            justifyContent: "center",
        },
        title: {
            flex: 1,
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
        },
        closeBtn: {
            padding: 4,
        },
        body: {
            paddingHorizontal: 18,
            paddingVertical: 12,
        },
        input: {
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 14,
            color: colors.text,
            minHeight: 90,
            maxHeight: 160,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        footer: {
            flexDirection: "row",
            gap: 10,
            paddingHorizontal: 18,
            paddingBottom: 16,
        },
        cancelBtn: {
            flex: 1,
            paddingVertical: 11,
            borderRadius: 10,
            alignItems: "center",
            backgroundColor: colors.tag,
        },
        cancelText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        generateBtn: {
            flex: 2,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            paddingVertical: 11,
            borderRadius: 10,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        generateBtnDisabled: {
            opacity: 0.45,
            shadowOpacity: 0,
            elevation: 0,
        },
        generateText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        btnPressed: {
            opacity: 0.72,
        },
    });
}

export default MagicPromptModal;
