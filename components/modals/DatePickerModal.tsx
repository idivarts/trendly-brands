import Colors from "@/shared-uis/constants/Colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../theme/Themed";
import Button from "../ui/button";

type DatePickerModalMode = "date";

export type DatePickerModalProps = {
    visible: boolean;
    title: string;
    value: Date;
    onChange: (next: Date) => void;
    onClose: () => void;
    onSubmit?: () => void;
    mode?: DatePickerModalMode;
    minimumDate?: Date;
    maximumDate?: Date;
    submitText?: string;
    cancelText?: string;
};

export function formatDateForWebInput(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export function parseWebInputDate(value: string) {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
    visible,
    title,
    value,
    onChange,
    onClose,
    onSubmit,
    mode = "date",
    minimumDate,
    maximumDate,
    submitText = "Submit",
    cancelText = "Cancel",
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);

    const webInputRef = useRef<any>(null);
    const [webValue, setWebValue] = useState(() => formatDateForWebInput(value));

    useEffect(() => {
        setWebValue(formatDateForWebInput(value));
    }, [value]);

    useEffect(() => {
        if (!visible) return;
        if (Platform.OS !== "web") return;
        const input = webInputRef.current;
        if (!input) return;
        try {
            input.focus?.();
            input.showPicker?.();
        } catch {
            // noop
        }
    }, [visible]);

    const webInputStyle = useMemo(
        () => ({
            width: "100%",
            height: 44,
            marginTop: 12,
            marginBottom: 16,
            borderRadius: 10,
            border: `1px solid ${colors.budgetCardBorder}`,
            backgroundColor: colors.background,
            color: colors.text,
            padding: "10px 12px",
            fontSize: "14px",
            boxSizing: "border-box" as const,
        }),
        [colors.background, colors.budgetCardBorder, colors.text]
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            onDismiss={onClose}
        >
            <View style={styles.modalRoot}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modal} onPress={() => { }}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                    </View>

                    {Platform.OS === "web" ? (
                        <>
                            {React.createElement("input", {
                                ref: webInputRef,
                                type: "date",
                                value: webValue,
                                min: minimumDate ? formatDateForWebInput(minimumDate) : undefined,
                                max: maximumDate ? formatDateForWebInput(maximumDate) : undefined,
                                onChange: (e: any) => {
                                    const raw = e?.target?.value ?? "";
                                    setWebValue(raw);
                                    const parsed = parseWebInputDate(raw);
                                    if (parsed) onChange(parsed);
                                },
                                style: webInputStyle,
                            })}
                        </>
                    ) : (
                        <DateTimePicker
                            value={value}
                            mode={mode}
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            minimumDate={minimumDate}
                            maximumDate={maximumDate}
                            onChange={(event, d) => {
                                if ((event as any)?.type === "set" && d) onChange(d);
                            }}
                            {...(Platform.OS === "ios"
                                ? {
                                      themeVariant: theme.dark
                                          ? ("dark" as const)
                                          : ("light" as const),
                                      textColor: colors.text,
                                      accentColor: colors.primary,
                                  }
                                : {})}
                        />
                    )}

                    <View style={styles.actions}>
                        <Button mode="outlined" style={styles.button} onPress={onClose}>
                            {cancelText}
                        </Button>
                        <Button
                            mode="contained"
                            style={styles.button}
                            onPress={() => {
                                onSubmit?.();
                                onClose();
                            }}
                        >
                            {submitText}
                        </Button>
                    </View>
                </Pressable>
            </Pressable>
            </View>
        </Modal>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, safeAreaTop: number) {
    return StyleSheet.create({
        /** Fills the modal window so the status-bar / safe area isn’t an unthemed (white) strip. */
        modalRoot: {
            flex: 1,
            backgroundColor: colors.backdrop,
        },
        overlay: {
            flex: 1,
            backgroundColor: colors.transparent,
            justifyContent: "center",
            alignItems: "center",
            paddingTop: safeAreaTop,
            paddingHorizontal: 16,
        },
        modal: {
            width: "100%",
            maxWidth: 520,
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
        },
        title: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
        },
        actions: {
            flexDirection: "row",
            gap: 12,
            marginTop: 16,
        },
        button: { flex: 1 },
    });
}

export default DatePickerModal;

