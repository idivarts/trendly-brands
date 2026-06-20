import React, { useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import DatePickerModal, {
    formatDateForWebInput,
    parseWebInputDate,
} from "./DatePickerModal";

// Re-export the date <-> string helpers so call sites can import everything
// date-related from this single module.
export { formatDateForWebInput, parseWebInputDate };

export type DateFieldProps = {
    /** Currently-selected date, or null when nothing has been chosen yet. */
    value: Date | null;
    onChange: (next: Date) => void;
    minimumDate?: Date;
    maximumDate?: Date;
    /** Title shown on the native picker modal. */
    title?: string;
    disabled?: boolean;
    /** The visible field content (text + icon). The caller styles the row. */
    children: React.ReactNode;
    /** Style applied to the field wrapper (web) / pressable (native). */
    style?: StyleProp<ViewStyle>;
};

/**
 * One date-picking control that behaves well on both web and native.
 *
 * - **Web:** an invisible `<input type="date">` is laid over the field. Clicking
 *   the field opens the browser's native date popup *inline* (anchored to the
 *   field); choosing a day applies immediately and clicking anywhere outside
 *   dismisses it. There is no second modal and no Submit/Cancel step.
 * - **Native:** pressing the field opens the existing `DatePickerModal` (system
 *   spinner + Submit/Cancel) — the native experience is unchanged.
 *
 * This replaces the old per-call-site pattern where web opened a *second* modal
 * containing an `<input type="date">` with Submit/Cancel buttons.
 */
const DateField: React.FC<DateFieldProps> = ({
    value,
    onChange,
    minimumDate,
    maximumDate,
    title = "Select date",
    disabled = false,
    children,
    style,
}) => {
    const [showNativePicker, setShowNativePicker] = useState(false);

    // The native spinner needs a concrete starting date even before the user has
    // picked one (optional-date fields start as null).
    const seed = value ?? minimumDate ?? new Date();

    const webInputStyle = useMemo(
        () =>
            ({
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                margin: 0,
                padding: 0,
                border: "none",
                background: "transparent",
                opacity: 0,
                cursor: disabled ? "default" : "pointer",
            }) as const,
        [disabled]
    );

    if (Platform.OS === "web") {
        return (
            <View style={[styles.webWrap, style]}>
                {children}
                {!disabled &&
                    React.createElement("input", {
                        type: "date",
                        value: value ? formatDateForWebInput(value) : "",
                        min: minimumDate ? formatDateForWebInput(minimumDate) : undefined,
                        max: maximumDate ? formatDateForWebInput(maximumDate) : undefined,
                        // Open the browser's native popup the moment the field is
                        // clicked — anchored to the field, with no intermediate modal.
                        onClick: (e: any) => {
                            try {
                                e.currentTarget?.showPicker?.();
                            } catch {
                                // Browsers without showPicker() still open on focus.
                            }
                        },
                        onChange: (e: any) => {
                            const parsed = parseWebInputDate(e?.target?.value ?? "");
                            if (parsed) onChange(parsed);
                        },
                        style: webInputStyle,
                    })}
            </View>
        );
    }

    return (
        <>
            <Pressable
                style={style}
                disabled={disabled}
                onPress={() => setShowNativePicker(true)}
            >
                {children}
            </Pressable>
            <DatePickerModal
                visible={showNativePicker}
                title={title}
                value={seed}
                onChange={onChange}
                onClose={() => setShowNativePicker(false)}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
            />
        </>
    );
};

const styles = StyleSheet.create({
    webWrap: {
        position: "relative",
    },
});

export default DateField;
