import Colors from "@/shared-uis/constants/Colors";
import { faArrowRight, faCommentDots, faRobot, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { parseWebInputDate } from "@/components/modals/DatePickerModal";
import { CalendarItem, CONTENT_TYPE_LABELS } from "./types";

interface ContentDetailsModalProps {
    visible: boolean;
    item: CalendarItem | null;
    onClose: () => void;
    /** Navigate to the full content page for editing. */
    onOpenContentPage: (item: CalendarItem) => void;
    /** Open item-level comments for this content (optional). */
    onAddComment?: (item: CalendarItem) => void;
    /** Focus this content in the AI chat panel (optional). */
    onSendToAI?: (item: CalendarItem) => void;
}

/**
 * Lightweight preview shown when a content card on the calendar is tapped.
 * Surfaces the item's key fields in-place and offers an explicit action to
 * jump to the full content page (instead of navigating away immediately).
 */
const ContentDetailsModal: React.FC<ContentDetailsModalProps> = ({
    visible,
    item,
    onClose,
    onOpenContentPage,
    onAddComment,
    onSendToAI,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    if (!item) return null;

    const parsedDate = item.date ? parseWebInputDate(item.date) : null;
    const dateLabel = parsedDate
        ? parsedDate.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "—";

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle} numberOfLines={2}>
                            {item.title}
                        </Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <FontAwesomeIcon icon={faXmark} size={16} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <ScrollView
                        style={styles.body}
                        contentContainerStyle={styles.bodyContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.metaRow}>
                            <View style={styles.typeChip}>
                                <Text style={styles.typeChipText}>
                                    {CONTENT_TYPE_LABELS[item.type]}
                                </Text>
                            </View>
                            <Text style={styles.dateText}>{dateLabel}</Text>
                        </View>

                        <Text style={styles.label}>Idea / Vision</Text>
                        <Text style={styles.ideaText}>
                            {item.idea?.trim() ? item.idea : "No idea added yet."}
                        </Text>
                    </ScrollView>

                    {(onAddComment || onSendToAI) && (
                        <View style={styles.quickActions}>
                            {onAddComment && (
                                <Pressable
                                    style={({ pressed }) => [styles.quickBtn, pressed && styles.btnPressed]}
                                    onPress={() => onAddComment(item)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Add a comment"
                                >
                                    <FontAwesomeIcon icon={faCommentDots} size={14} color={colors.primary} />
                                    <Text style={styles.quickBtnText}>Comment</Text>
                                </Pressable>
                            )}
                            {onSendToAI && (
                                <Pressable
                                    style={({ pressed }) => [styles.quickBtn, pressed && styles.btnPressed]}
                                    onPress={() => onSendToAI(item)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Send to AI chat"
                                >
                                    <FontAwesomeIcon icon={faRobot} size={14} color={colors.primary} />
                                    <Text style={styles.quickBtnText}>Ask AI</Text>
                                </Pressable>
                            )}
                        </View>
                    )}

                    <View style={styles.footer}>
                        <Pressable
                            style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelBtnText}>Close</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.openBtn, pressed && styles.btnPressed]}
                            onPress={() => onOpenContentPage(item)}
                        >
                            <Text style={styles.openBtnText}>Open content page</Text>
                            <FontAwesomeIcon icon={faArrowRight} size={13} color={colors.onPrimary} />
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
                    maxHeight: "80%",
                },
                header: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 2,
                },
                headerTitle: {
                    flex: 1,
                    fontSize: 17,
                    fontWeight: "700",
                    color: colors.text,
                },
                closeBtn: {
                    padding: 4,
                },
                body: {
                    flexShrink: 1,
                },
                bodyContent: {
                    paddingHorizontal: 20,
                    paddingTop: 14,
                    paddingBottom: 8,
                },
                metaRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                },
                typeChip: {
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                typeChipText: {
                    fontSize: 12,
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                dateText: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontWeight: "500",
                },
                label: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginTop: 18,
                    marginBottom: 6,
                },
                ideaText: {
                    fontSize: 14,
                    color: colors.text,
                    lineHeight: 20,
                },
                footer: {
                    flexDirection: "row",
                    gap: 12,
                    padding: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 3,
                },
                cancelBtn: {
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: colors.tag,
                },
                cancelBtnText: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                openBtn: {
                    flex: 2,
                    flexDirection: "row",
                    gap: 8,
                    paddingVertical: 13,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                openBtnText: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                quickActions: {
                    flexDirection: "row",
                    gap: 10,
                    paddingHorizontal: 16,
                    paddingTop: 12,
                },
                quickBtn: {
                    flex: 1,
                    flexDirection: "row",
                    gap: 8,
                    paddingVertical: 11,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                quickBtnText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.primary,
                },
                btnPressed: {
                    opacity: 0.72,
                },
            }),
        [colors]
    );
}

export default ContentDetailsModal;
