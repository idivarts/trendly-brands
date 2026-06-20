import Colors from "@/shared-uis/constants/Colors";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
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
import { CalendarItem } from "./types";

interface QuickCommentModalProps {
    visible: boolean;
    item: CalendarItem | null;
    onClose: () => void;
    onSubmit: (itemId: string, comment: string) => void;
}

const QuickCommentModal: React.FC<QuickCommentModalProps> = ({
    visible,
    item,
    onClose,
    onSubmit,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const [comment, setComment] = useState("");

    const handleSubmit = () => {
        if (!item || !comment.trim()) return;
        onSubmit(item.id, comment.trim());
        setComment("");
        onClose();
    };

    const handleClose = () => {
        setComment("");
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                {item?.title ?? ""}
                            </Text>
                            <Text style={styles.headerSub}>Leave a note or change request</Text>
                        </View>
                        <Pressable onPress={handleClose} style={styles.closeBtn}>
                            <FontAwesomeIcon
                                icon={faXmark}
                                size={16}
                                color={colors.textSecondary}
                            />
                        </Pressable>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="E.g. Change the tone to be more playful..."
                        placeholderTextColor={colors.textSecondary}
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        maxLength={500}
                        textAlignVertical="top"
                        autoFocus
                    />

                    <View style={styles.footer}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.submitBtn,
                                pressed && styles.submitBtnPressed,
                                !comment.trim() && styles.submitBtnDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={!comment.trim()}
                        >
                            <Text style={styles.submitBtnText}>Save Note</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
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
                    padding: 20,
                },
                sheet: {
                    width: "100%",
                    maxWidth: 480,
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 12 },
                    shadowRadius: 32,
                    shadowOpacity: 0.18,
                    elevation: 12,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: 20,
                    paddingBottom: 12,
                },
                headerLeft: {
                    flex: 1,
                    gap: 3,
                },
                headerTitle: {
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                },
                headerSub: {
                    fontSize: 13,
                    color: colors.textSecondary,
                },
                closeBtn: {
                    padding: 4,
                    marginLeft: 8,
                },
                input: {
                    marginHorizontal: 20,
                    marginBottom: 16,
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: colors.text,
                    minHeight: 100,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                footer: {
                    paddingHorizontal: 20,
                    paddingBottom: 20,
                },
                submitBtn: {
                    paddingVertical: 13,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                submitBtnPressed: {
                    opacity: 0.75,
                },
                submitBtnDisabled: {
                    opacity: 0.4,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                submitBtnText: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
            }),
        [colors]
    );
}

export default QuickCommentModal;
