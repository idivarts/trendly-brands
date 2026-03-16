import { RELEASE_DATE_MAX_DAYS } from "@/shared-constants/contract-status";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text } from "../theme/Themed";
import Button from "../ui/button";

const maxReleaseDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + RELEASE_DATE_MAX_DAYS);
    return d;
};

export interface ChangeReleaseDateSheetProps {
    initialDate?: number;
    onClose: () => void;
    onConfirm: (scheduledReleaseAt: number) => void;
}

const ChangeReleaseDateSheet: React.FC<ChangeReleaseDateSheetProps> = ({
    initialDate,
    onClose,
    onConfirm,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [date, setDate] = useState(() =>
        initialDate ? new Date(initialDate) : (() => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            return d;
        })()
    );
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleConfirm = () => {
        const ts = Math.min(date.getTime(), maxReleaseDate().getTime());
        onConfirm(ts);
        onClose();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Change Release Date</Text>
            <Text style={styles.subtitle}>Max 30 days from today</Text>
            <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
            >
                <Text style={styles.dateButtonText}>
                    {date.toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    })}
                </Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    minimumDate={new Date()}
                    maximumDate={maxReleaseDate()}
                    onChange={(_, d) => {
                        if (d) setDate(d);
                        setShowDatePicker(false);
                    }}
                />
            )}
            <View style={styles.actions}>
                <Button mode="outlined" style={styles.button} onPress={onClose}>
                    Cancel
                </Button>
                <Button mode="contained" style={styles.button} onPress={handleConfirm}>
                    Update Date
                </Button>
            </View>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        container: {
            padding: 20,
            paddingBottom: 32,
        },
        title: {
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 4,
        },
        subtitle: {
            fontSize: 14,
            color: colors.gray300,
            marginBottom: 12,
        },
        dateButton: {
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: colors.tag ?? "rgba(0,0,0,0.06)",
            marginBottom: 20,
        },
        dateButtonText: {
            fontSize: 15,
            color: colors.text,
        },
        actions: {
            flexDirection: "row",
            gap: 12,
        },
        button: { flex: 1 },
    });
}

export default ChangeReleaseDateSheet;
