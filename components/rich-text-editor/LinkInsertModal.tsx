import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { normalizeUrl } from "./normalizeUrl";

interface LinkInsertModalProps {
    visible: boolean;
    /** Text currently selected in the editor — prefilled as the link label. */
    initialText?: string;
    onClose: () => void;
    /** Fired with the (possibly empty) label and the normalised URL. */
    onInsert: (text: string, url: string) => void;
}

const LinkInsertModal: React.FC<LinkInsertModalProps> = ({
    visible,
    initialText = "",
    onClose,
    onInsert,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const [text, setText] = useState(initialText);
    const [url, setUrl] = useState("");

    // Reset fields each time the modal is (re)opened.
    useEffect(() => {
        if (visible) {
            setText(initialText);
            setUrl("");
        }
    }, [visible, initialText]);

    const canInsert = url.trim().length > 0;

    const handleInsert = () => {
        const finalUrl = normalizeUrl(url);
        if (!finalUrl) return;
        onInsert(text.trim() || finalUrl, finalUrl);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
                    <Text style={styles.title}>Insert link</Text>

                    <Text style={styles.label}>Text to display</Text>
                    <TextInput
                        value={text}
                        onChangeText={setText}
                        placeholder="Link text"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.input}
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>URL</Text>
                    <TextInput
                        value={url}
                        onChangeText={setUrl}
                        placeholder="https://example.com"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        autoFocus
                        onSubmitEditing={handleInsert}
                    />

                    <View style={styles.actions}>
                        <Pressable style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.insertBtn, !canInsert && styles.insertBtnDisabled]}
                            onPress={handleInsert}
                            disabled={!canInsert}
                        >
                            <Text style={styles.insertText}>Insert</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: colors.backdrop,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
        },
        card: {
            width: "100%",
            maxWidth: 420,
            borderRadius: 16,
            padding: 22,
            backgroundColor: colors.modalBackground,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 28,
            shadowOpacity: 0.22,
            elevation: 16,
        },
        title: {
            fontSize: 17,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 16,
        },
        label: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: 6,
        },
        input: {
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 15,
            color: colors.text,
            marginBottom: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        actions: {
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 10,
            marginTop: 4,
        },
        cancelBtn: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        cancelText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        insertBtn: {
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        insertBtnDisabled: {
            opacity: 0.45,
            shadowOpacity: 0,
            elevation: 0,
        },
        insertText: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.onPrimary,
        },
    });
}

export default LinkInsertModal;
