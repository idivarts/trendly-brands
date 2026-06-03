import DatePickerModal, { formatDateForWebInput, parseWebInputDate } from "@/components/modals/DatePickerModal";
import Colors from "@/shared-uis/constants/Colors";
import { faCalendarDays, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { CalendarItem, CONTENT_TYPE_LABELS, ContentType } from "./types";

interface AddContentModalProps {
    visible: boolean;
    initialDate?: string;
    onClose: () => void;
    onAdd: (item: Omit<CalendarItem, "id">) => void;
}

const TYPES: ContentType[] = ["reel", "post", "story", "carousel", "live"];

const AddContentModal: React.FC<AddContentModalProps> = ({
    visible,
    initialDate,
    onClose,
    onAdd,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const [date, setDate] = useState<Date>(
        () => (initialDate ? parseWebInputDate(initialDate) ?? new Date() : new Date())
    );
    const [type, setType] = useState<ContentType>("reel");
    const [title, setTitle] = useState("");
    const [idea, setIdea] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);

    // The modal stays mounted and is toggled via `visible`, so the useState
    // initialiser only runs once. Re-sync the date to the clicked day each time
    // the modal opens (or the target date changes), otherwise it sticks to the
    // first-opened / reset value. `parseWebInputDate` parses the YYYY-MM-DD
    // string as a *local* date (plain `new Date("YYYY-MM-DD")` is UTC and can
    // land on the previous day for negative-offset timezones).
    useEffect(() => {
        if (!visible) return;
        setDate(initialDate ? parseWebInputDate(initialDate) ?? new Date() : new Date());
    }, [visible, initialDate]);

    const reset = () => {
        setDate(new Date());
        setType("reel");
        setTitle("");
        setIdea("");
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleAdd = () => {
        if (!title.trim()) return;
        onAdd({
            title: title.trim(),
            idea: idea.trim(),
            date: formatDateForWebInput(date),
            type,
        });
        reset();
        onClose();
    };

    const canSubmit = title.trim().length > 0;

    return (
        <>
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
                            <Text style={styles.headerTitle}>Add Content Item</Text>
                            <Pressable onPress={handleClose} style={styles.closeBtn}>
                                <FontAwesomeIcon
                                    icon={faXmark}
                                    size={16}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                        </View>

                        <ScrollView
                            style={styles.body}
                            contentContainerStyle={styles.bodyContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Text style={styles.label}>Date of Posting</Text>
                            <Pressable
                                style={styles.dateRow}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.dateText}>
                                    {date.toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </Text>
                                <FontAwesomeIcon
                                    icon={faCalendarDays}
                                    size={14}
                                    color={colors.primary}
                                />
                            </Pressable>

                            <Text style={styles.label}>Content Type</Text>
                            <View style={styles.typeRow}>
                                {TYPES.map((t) => (
                                    <Pressable
                                        key={t}
                                        style={({ pressed }) => [
                                            styles.typeChip,
                                            type === t && styles.typeChipActive,
                                            pressed && styles.typeChipPressed,
                                        ]}
                                        onPress={() => setType(t)}
                                    >
                                        <Text
                                            style={[
                                                styles.typeChipText,
                                                type === t && styles.typeChipTextActive,
                                            ]}
                                        >
                                            {CONTENT_TYPE_LABELS[t]}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="E.g. Founder Story Launch Reel"
                                placeholderTextColor={colors.textSecondary}
                                value={title}
                                onChangeText={setTitle}
                                maxLength={120}
                            />

                            <Text style={styles.label}>Idea / Vision</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe the concept, mood, or key message..."
                                placeholderTextColor={colors.textSecondary}
                                value={idea}
                                onChangeText={setIdea}
                                multiline
                                maxLength={500}
                                textAlignVertical="top"
                            />
                        </ScrollView>

                        <View style={styles.footer}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.cancelBtn,
                                    pressed && styles.btnPressed,
                                ]}
                                onPress={handleClose}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.addBtn,
                                    pressed && styles.btnPressed,
                                    !canSubmit && styles.addBtnDisabled,
                                ]}
                                onPress={handleAdd}
                                disabled={!canSubmit}
                            >
                                <Text style={styles.addBtnText}>Add to Calendar</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <DatePickerModal
                visible={showDatePicker}
                title="Select date"
                value={date}
                onChange={setDate}
                onClose={() => setShowDatePicker(false)}
            />
        </>
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
                    maxWidth: 520,
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 12 },
                    shadowRadius: 32,
                    shadowOpacity: 0.18,
                    elevation: 12,
                    maxHeight: "90%",
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 2,
                },
                headerTitle: {
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
                    paddingTop: 12,
                    paddingBottom: 8,
                    gap: 4,
                },
                label: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 6,
                    marginTop: 12,
                },
                dateRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                dateText: {
                    fontSize: 14,
                    color: colors.text,
                    fontWeight: "500",
                },
                typeRow: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                },
                typeChip: {
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                typeChipActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                typeChipPressed: {
                    opacity: 0.75,
                },
                typeChipText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                typeChipTextActive: {
                    color: colors.onPrimary,
                },
                input: {
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: colors.text,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                textArea: {
                    minHeight: 100,
                    maxHeight: 180,
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
                addBtn: {
                    flex: 2,
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
                addBtnDisabled: {
                    opacity: 0.45,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                addBtnText: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                btnPressed: {
                    opacity: 0.72,
                },
            }),
        [colors]
    );
}

export default AddContentModal;
