import { Text } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";

interface ScheduleReleaseModalProps {
    visible: boolean;
    onClose: () => void;
    minDate: Date;
    maxDate: Date;
    onConfirm: (date: Date) => Promise<void> | void;
}

const ScheduleReleaseModal: React.FC<ScheduleReleaseModalProps> = ({ visible, onClose, minDate, maxDate, onConfirm }) => {
    const theme = useTheme();
    const [date, setDate] = useState<Date>(minDate);
    const [submitting, setSubmitting] = useState(false);

    const handleDateChange = (_: any, selectedDate?: Date) => {
        if (Platform.OS !== "ios") {
            if (selectedDate) setDate(selectedDate);
        } else if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const handleConfirm = async () => {
        setSubmitting(true);
        await onConfirm(date);
        setSubmitting(false);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: Colors(theme).background }]}>
                    <Text style={[styles.title, { color: Colors(theme).text }]}>Schedule Release</Text>
                    <Text style={{ color: Colors(theme).gray300, marginBottom: 8 }}>
                        Select a release date within 30 days of approval
                    </Text>

                    <View style={{ borderWidth: 1, borderColor: Colors(theme).gray300, borderRadius: 12, overflow: "hidden" }}>
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            minimumDate={minDate}
                            maximumDate={maxDate}
                            onChange={handleDateChange}
                        />
                    </View>

                    <View style={styles.actions}>
                        <Button mode="outlined" onPress={onClose} disabled={submitting}>Cancel</Button>
                        <Button mode="contained" onPress={handleConfirm} loading={submitting}>Confirm</Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    container: {
        width: "100%",
        maxWidth: 500,
        borderRadius: 20,
        padding: 16,
        gap: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
    },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
    },
});

export default ScheduleReleaseModal;