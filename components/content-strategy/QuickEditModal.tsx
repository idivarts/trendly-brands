import Colors from "@/shared-uis/constants/Colors";
import { faWandMagicSparkles, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

interface QuickEditModalProps {
    visible: boolean;
    selectedText: string;
    onClose: () => void;
    onApply: (prompt: string) => void;
}

const QuickEditModal: React.FC<QuickEditModalProps> = ({
    visible,
    selectedText,
    onClose,
    onApply,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [prompt, setPrompt] = useState("");
    const styles = useMemo(() => useStyles(colors), [colors]);

    const handleApply = () => {
        const trimmed = prompt.trim();
        if (!trimmed) return;
        onApply(trimmed);
        setPrompt("");
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={() => {}}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Quick Edit</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <FontAwesomeIcon icon={faXmark} size={16} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {selectedText.length > 0 && (
                        <View style={styles.selectedPreview}>
                            <Text style={styles.selectedLabel}>Selected text</Text>
                            <Text style={styles.selectedText} numberOfLines={3}>
                                {selectedText}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.inputLabel}>
                        How would you like to modify this text?
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Make it more concise, change tone to formal, expand with examples..."
                        placeholderTextColor={colors.textSecondary}
                        value={prompt}
                        onChangeText={setPrompt}
                        multiline
                        numberOfLines={3}
                        autoFocus
                    />

                    <View style={styles.actions}>
                        <Pressable style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.applyBtn, !prompt.trim() && styles.applyBtnDisabled]}
                            onPress={handleApply}
                            disabled={!prompt.trim()}
                        >
                            <FontAwesomeIcon icon={faWandMagicSparkles} size={14} color={colors.onPrimary} />
                            <Text style={styles.applyText}>Apply Edit</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: colors.backdrop,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                },
                sheet: {
                    width: "100%",
                    maxWidth: 480,
                    backgroundColor: colors.modalBackground,
                    borderRadius: 16,
                    padding: 24,
                    shadowColor: colors.panelShadow,
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 24,
                    shadowOpacity: 1,
                    elevation: 8,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                },
                title: {
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.text,
                },
                closeBtn: {
                    padding: 4,
                },
                selectedPreview: {
                    backgroundColor: colors.aliceBlue,
                    borderRadius: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.primary,
                    padding: 10,
                    marginBottom: 16,
                },
                selectedLabel: {
                    fontSize: 11,
                    fontWeight: "600",
                    color: colors.primary,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                },
                selectedText: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                    lineHeight: 18,
                },
                inputLabel: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: 10,
                },
                input: {
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    lineHeight: 21,
                    minHeight: 80,
                    textAlignVertical: "top",
                    marginBottom: 16,
                },
                actions: {
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: 10,
                },
                cancelBtn: {
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                cancelText: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    fontWeight: "500",
                },
                applyBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                },
                applyBtnDisabled: {
                    opacity: 0.4,
                },
                applyText: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.onPrimary,
                },
            }),
        [colors]
    );
}

export default QuickEditModal;
