import DateField, { formatDateForWebInput, parseWebInputDate } from "@/components/modals/DateField";
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

/**
 * Where the modal was opened from. This drives how the posting date is chosen:
 * - `month`    → a single date selector (the default calendar behaviour).
 * - `week`     → Mon|Tue|…|Sun pills for the days of the viewed week.
 * - `contents` → date is optional and hidden behind a link (deprioritised).
 */
export type AddContentSource = "month" | "week" | "contents";

interface AddContentModalProps {
    visible: boolean;
    initialDate?: string;
    /** Controls the date-selection UI. Defaults to the month-style selector. */
    source?: AddContentSource;
    onClose: () => void;
    onAdd: (item: Omit<CalendarItem, "id">) => void;
}

const TYPES: ContentType[] = ["reel", "post", "story", "carousel", "live", "text"];

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addDays(d: Date, n: number) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/** The 7 consecutive days starting at `start` (used for the weekly pills). */
function weekDaysFrom(start: Date) {
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function formatLongDate(d: Date) {
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

const AddContentModal: React.FC<AddContentModalProps> = ({
    visible,
    initialDate,
    source = "month",
    onClose,
    onAdd,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    // The days shown as pills in the weekly view: the 7 days starting at the
    // tapped week's start (or today's week when opened from the header).
    const weekDays = useMemo(() => {
        const base = initialDate ? parseWebInputDate(initialDate) ?? new Date() : new Date();
        return weekDaysFrom(base);
    }, [initialDate]);

    // Resolve the initial selected date for the current `source`/`initialDate`.
    // `contents` starts with no date (deprioritised); the calendar views always
    // start on a concrete day.
    const computeInitialDate = (): Date | null => {
        if (source === "contents") return null;
        const base = initialDate ? parseWebInputDate(initialDate) ?? new Date() : new Date();
        if (source === "week") {
            const days = weekDaysFrom(base);
            const today = new Date();
            // Pre-select today when it falls inside the viewed week, else the
            // first day of that week.
            return days.find((d) => isSameDay(d, today)) ?? days[0];
        }
        return base;
    };

    const [date, setDate] = useState<Date | null>(() => computeInitialDate());
    const [type, setType] = useState<ContentType>("reel");
    const [title, setTitle] = useState("");
    const [idea, setIdea] = useState("");
    // Contents view only: whether the optional date field has been revealed.
    const [showOptionalDate, setShowOptionalDate] = useState(false);

    // The modal stays mounted and is toggled via `visible`, so the useState
    // initialiser only runs once. Re-sync the date each time the modal opens (or
    // the target date / source changes), otherwise it sticks to the first-opened
    // value. `parseWebInputDate` parses the YYYY-MM-DD string as a *local* date
    // (plain `new Date("YYYY-MM-DD")` is UTC and can land on the previous day for
    // negative-offset timezones).
    useEffect(() => {
        if (!visible) return;
        setDate(computeInitialDate());
        setShowOptionalDate(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, initialDate, source]);

    const reset = () => {
        setDate(computeInitialDate());
        setType("reel");
        setTitle("");
        setIdea("");
        setShowOptionalDate(false);
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
            // Contents view may save with no posting date — the calendar simply
            // won't show it until a date is assigned later.
            date: date ? formatDateForWebInput(date) : "",
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
                            {source === "week" ? (
                                <>
                                    <Text style={styles.label}>Day of Posting</Text>
                                    <View style={styles.weekRow}>
                                        {weekDays.map((d) => {
                                            const selected = !!date && isSameDay(d, date);
                                            return (
                                                <Pressable
                                                    key={formatDateForWebInput(d)}
                                                    style={[
                                                        styles.weekPill,
                                                        selected && styles.weekPillActive,
                                                    ]}
                                                    onPress={() => setDate(d)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.weekPillDow,
                                                            selected && styles.weekPillTextActive,
                                                        ]}
                                                    >
                                                        {WEEKDAY_SHORT[d.getDay()]}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.weekPillNum,
                                                            selected && styles.weekPillTextActive,
                                                        ]}
                                                    >
                                                        {d.getDate()}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </>
                            ) : source === "contents" ? (
                                date ? (
                                    <>
                                        <Text style={styles.label}>Date of Posting</Text>
                                        <View style={styles.dateRowWithClear}>
                                            <DateField
                                                value={date}
                                                onChange={setDate}
                                                style={[styles.dateRow, styles.flex1]}
                                            >
                                                <Text style={styles.dateText}>
                                                    {formatLongDate(date)}
                                                </Text>
                                                <FontAwesomeIcon
                                                    icon={faCalendarDays}
                                                    size={14}
                                                    color={colors.primary}
                                                />
                                            </DateField>
                                            <Pressable
                                                style={styles.clearDateBtn}
                                                onPress={() => {
                                                    setDate(null);
                                                    setShowOptionalDate(false);
                                                }}
                                                hitSlop={8}
                                                accessibilityLabel="Remove posting date"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faXmark}
                                                    size={14}
                                                    color={colors.textSecondary}
                                                />
                                            </Pressable>
                                        </View>
                                    </>
                                ) : showOptionalDate ? (
                                    <>
                                        <Text style={styles.label}>Date of Posting</Text>
                                        <DateField
                                            value={null}
                                            onChange={setDate}
                                            style={styles.dateRow}
                                        >
                                            <Text style={styles.datePlaceholder}>
                                                Select a date
                                            </Text>
                                            <FontAwesomeIcon
                                                icon={faCalendarDays}
                                                size={14}
                                                color={colors.primary}
                                            />
                                        </DateField>
                                    </>
                                ) : (
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.addDateLink,
                                            pressed && styles.addDateLinkPressed,
                                        ]}
                                        onPress={() => setShowOptionalDate(true)}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCalendarDays}
                                            size={13}
                                            color={colors.textSecondary}
                                        />
                                        <Text style={styles.addDateLinkText}>
                                            Add a posting date (optional)
                                        </Text>
                                    </Pressable>
                                )
                            ) : (
                                <>
                                    <Text style={styles.label}>Date of Posting</Text>
                                    <DateField
                                        value={date}
                                        onChange={setDate}
                                        style={styles.dateRow}
                                    >
                                        <Text style={styles.dateText}>
                                            {date ? formatLongDate(date) : "Select a date"}
                                        </Text>
                                        <FontAwesomeIcon
                                            icon={faCalendarDays}
                                            size={14}
                                            color={colors.primary}
                                        />
                                    </DateField>
                                </>
                            )}

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
                datePlaceholder: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    fontWeight: "500",
                },
                dateRowWithClear: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                },
                flex1: {
                    flex: 1,
                },
                clearDateBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                addDateLink: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    alignSelf: "flex-start",
                    paddingVertical: 8,
                    paddingHorizontal: 4,
                },
                addDateLinkPressed: {
                    opacity: 0.6,
                },
                addDateLinkText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                weekRow: {
                    flexDirection: "row",
                    gap: 6,
                },
                weekPill: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                weekPillActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                weekPillDow: {
                    fontSize: 11,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                weekPillNum: {
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                    marginTop: 2,
                },
                weekPillTextActive: {
                    color: colors.onPrimary,
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
