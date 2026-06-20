/**
 * MonthCommentModal
 *
 * A modal for adding and viewing comments on an entire calendar month.
 * Powered by `use-month-comments`, which stores comments in
 * `brands/{brandId}/calendarComments/{YYYY-MM}/comments`.
 *
 * A dot indicator on the MonthView header shows whether comments exist
 * for the currently displayed month (the parent reads `comments.length`).
 *
 * Usage:
 *   <MonthCommentModal
 *     visible={showMonthComment}
 *     year={calYear}
 *     month={calMonth}   // 0-indexed (Jan = 0)
 *     onClose={() => setShowMonthComment(false)}
 *   />
 */
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useMonthComments } from "@/hooks/use-month-comments";
import Colors from "@/shared-uis/constants/Colors";
import { faCalendarDays, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

interface MonthCommentModalProps {
    visible: boolean;
    year: number;
    month: number; // 0-indexed
    onClose: () => void;
}

const MonthCommentModal: React.FC<MonthCommentModalProps> = ({
    visible,
    year,
    month,
    onClose,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { manager } = useAuthContext();

    const { comments, loading, addComment, deleteComment } = useMonthComments(year, month);
    const [draft, setDraft] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSend = async () => {
        if (!draft.trim() || submitting) return;
        setSubmitting(true);
        await addComment(draft.trim());
        setDraft("");
        setSubmitting(false);
    };

    const handleClose = () => {
        setDraft("");
        onClose();
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
                <View style={styles.sheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconWrap}>
                            <FontAwesomeIcon icon={faCalendarDays} size={15} color={colors.primary} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>
                                {MONTH_NAMES[month]} {year}
                            </Text>
                            <Text style={styles.subtitle}>Notes & feedback for this month</Text>
                        </View>
                        <Pressable onPress={handleClose} style={styles.closeBtn}>
                            <FontAwesomeIcon icon={faXmark} size={15} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {/* Comment list */}
                    {loading ? (
                        <ActivityIndicator style={styles.loader} color={colors.primary} />
                    ) : (
                        <FlatList
                            data={comments}
                            keyExtractor={(item) => item.id}
                            style={styles.list}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>
                                    No notes for this month yet. Add the first one below.
                                </Text>
                            }
                            renderItem={({ item }) => {
                                const isOwn = item.authorId === manager?.id;
                                const ts = new Date(item.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                });
                                return (
                                    <View style={styles.commentRow}>
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>
                                                {item.authorName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.commentBody}>
                                            <View style={styles.commentMeta}>
                                                <Text style={styles.authorName}>{item.authorName}</Text>
                                                <Text style={styles.timestamp}>{ts}</Text>
                                            </View>
                                            <Text style={styles.commentText}>{item.text}</Text>
                                        </View>
                                        {isOwn && (
                                            <Pressable
                                                style={({ pressed }) => [styles.deleteBtn, pressed && styles.btnPressed]}
                                                onPress={() => deleteComment(item.id)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} size={12} color={colors.textSecondary} />
                                            </Pressable>
                                        )}
                                    </View>
                                );
                            }}
                        />
                    )}

                    {/* Compose */}
                    <View style={styles.compose}>
                        <TextInput
                            style={styles.input}
                            placeholder="Add a note for this month..."
                            placeholderTextColor={colors.textSecondary}
                            value={draft}
                            onChangeText={setDraft}
                            multiline
                            maxLength={500}
                            textAlignVertical="top"
                        />
                        <Pressable
                            style={({ pressed }) => [
                                styles.sendBtn,
                                !draft.trim() && styles.sendBtnDisabled,
                                pressed && styles.btnPressed,
                            ]}
                            onPress={handleSend}
                            disabled={!draft.trim() || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color={colors.onPrimary} />
                            ) : (
                                <Text style={styles.sendBtnText}>Post</Text>
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
        sheet: {
            width: "100%",
            maxWidth: 500,
            maxHeight: "80%",
            backgroundColor: colors.card,
            borderRadius: 18,
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
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        iconWrap: {
            width: 34,
            height: 34,
            borderRadius: 9,
            backgroundColor: colors.aliceBlue,
            alignItems: "center",
            justifyContent: "center",
        },
        headerText: { flex: 1, gap: 1 },
        title: { fontSize: 15, fontWeight: "700", color: colors.text },
        subtitle: { fontSize: 12, color: colors.textSecondary },
        closeBtn: { padding: 4 },
        loader: { marginVertical: 32 },
        list: { flex: 1 },
        listContent: {
            padding: 16,
            gap: 12,
        },
        emptyText: {
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: "center",
            paddingVertical: 20,
            lineHeight: 19,
        },
        commentRow: {
            flexDirection: "row",
            gap: 10,
            alignItems: "flex-start",
        },
        avatar: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.aliceBlue,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
        },
        avatarText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.primary,
        },
        commentBody: { flex: 1, gap: 3 },
        commentMeta: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        authorName: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.text,
        },
        timestamp: {
            fontSize: 11,
            color: colors.textSecondary,
        },
        commentText: {
            fontSize: 13,
            color: colors.text,
            lineHeight: 18,
        },
        deleteBtn: {
            padding: 6,
        },
        compose: {
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        input: {
            flex: 1,
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 9,
            fontSize: 14,
            color: colors.text,
            maxHeight: 100,
        },
        sendBtn: {
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderRadius: 10,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
        },
        sendBtnDisabled: { opacity: 0.4 },
        sendBtnText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        btnPressed: { opacity: 0.72 },
    });
}

export default MonthCommentModal;
