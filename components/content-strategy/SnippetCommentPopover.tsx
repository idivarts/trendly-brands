/**
 * SnippetCommentPopover
 *
 * A small popover that appears when the user selects text inside the strategy
 * markdown editor. It lets them type a comment anchored to the selected snippet.
 *
 * The parent (StrategyEditorPanel) is responsible for detecting text selection
 * and providing the selected text + character offsets. On web this is done via
 * the Selection API; on native via `onSelectionChange` on the TextInput.
 *
 * Usage:
 *   <SnippetCommentPopover
 *     visible={!!selection}
 *     snippet={selection?.text ?? ""}
 *     anchorStart={selection?.start ?? 0}
 *     anchorEnd={selection?.end ?? 0}
 *     onSubmit={(text, snippet, start, end) => addSnippetComment(text, snippet, start, end)}
 *     onDismiss={() => setSelection(null)}
 *   />
 */
import Colors from "@/shared-uis/constants/Colors";
import { faCommentDots, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

interface SnippetCommentPopoverProps {
    visible: boolean;
    snippet: string;
    anchorStart: number;
    anchorEnd: number;
    onSubmit: (
        text: string,
        snippet: string,
        anchorStart: number,
        anchorEnd: number
    ) => Promise<void>;
    onDismiss: () => void;
}

const SnippetCommentPopover: React.FC<SnippetCommentPopoverProps> = ({
    visible,
    snippet,
    anchorStart,
    anchorEnd,
    onSubmit,
    onDismiss,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!text.trim() || submitting) return;
        setSubmitting(true);
        await onSubmit(text.trim(), snippet, anchorStart, anchorEnd);
        setText("");
        setSubmitting(false);
        onDismiss();
    };

    const handleClose = () => {
        setText("");
        onDismiss();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.backdrop}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
                <View style={styles.popover}>
                    {/* Header */}
                    <View style={styles.header}>
                        <FontAwesomeIcon icon={faCommentDots} size={14} color={colors.primary} />
                        <Text style={styles.title}>Comment on selection</Text>
                        <Pressable onPress={handleClose} style={styles.closeBtn}>
                            <FontAwesomeIcon icon={faXmark} size={13} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {/* Quoted snippet */}
                    {snippet.length > 0 && (
                        <View style={styles.quote}>
                            <Text style={styles.quoteText} numberOfLines={3}>
                                "{snippet.length > 160 ? snippet.slice(0, 160) + "…" : snippet}"
                            </Text>
                        </View>
                    )}

                    {/* Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Add your comment..."
                        placeholderTextColor={colors.textSecondary}
                        value={text}
                        onChangeText={setText}
                        multiline
                        maxLength={600}
                        textAlignVertical="top"
                        autoFocus
                    />

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Pressable
                            style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
                            onPress={handleClose}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.submitBtn,
                                !text.trim() && styles.submitBtnDisabled,
                                pressed && styles.btnPressed,
                            ]}
                            onPress={handleSubmit}
                            disabled={!text.trim() || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color={colors.onPrimary} />
                            ) : (
                                <Text style={styles.submitText}>Comment</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: colors.backdrop,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
        },
        popover: {
            width: "100%",
            maxWidth: 420,
            backgroundColor: colors.card,
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowRadius: 28,
            shadowOpacity: 0.15,
            elevation: 10,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        title: {
            flex: 1,
            fontSize: 14,
            fontWeight: "700",
            color: colors.text,
        },
        closeBtn: { padding: 4 },
        quote: {
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
            marginHorizontal: 16,
            marginTop: 12,
            paddingLeft: 10,
        },
        quoteText: {
            fontSize: 12,
            color: colors.textSecondary,
            fontStyle: "italic",
            lineHeight: 17,
        },
        input: {
            margin: 16,
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
            color: colors.text,
            minHeight: 80,
            maxHeight: 160,
        },
        footer: {
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: 16,
            paddingBottom: 16,
        },
        cancelBtn: {
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
            backgroundColor: colors.tag,
        },
        cancelText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        submitBtn: {
            flex: 2,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        submitBtnDisabled: {
            opacity: 0.4,
            shadowOpacity: 0,
            elevation: 0,
        },
        submitText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        btnPressed: { opacity: 0.72 },
    });
}

export default SnippetCommentPopover;
