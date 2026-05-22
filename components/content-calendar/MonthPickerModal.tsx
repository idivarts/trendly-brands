import Colors from "@/shared-uis/constants/Colors";
import { faChevronLeft, faChevronRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

interface MonthPickerModalProps {
    visible: boolean;
    year: number;
    month: number; // 0-indexed
    onSelect: (year: number, month: number) => void;
    onClose: () => void;
}

const MonthPickerModal: React.FC<MonthPickerModalProps> = ({
    visible,
    year,
    month,
    onSelect,
    onClose,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const [displayYear, setDisplayYear] = useState(year);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Pressable
                            style={({ pressed }) => [styles.arrowBtn, pressed && styles.arrowBtnPressed]}
                            onPress={() => setDisplayYear((y) => y - 1)}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} size={14} color={colors.text} />
                        </Pressable>
                        <Text style={styles.yearText}>{displayYear}</Text>
                        <Pressable
                            style={({ pressed }) => [styles.arrowBtn, pressed && styles.arrowBtnPressed]}
                            onPress={() => setDisplayYear((y) => y + 1)}
                        >
                            <FontAwesomeIcon icon={faChevronRight} size={14} color={colors.text} />
                        </Pressable>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <FontAwesomeIcon icon={faXmark} size={15} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <View style={styles.grid}>
                        {MONTH_NAMES.map((name, idx) => {
                            const isActive = idx === month && displayYear === year;
                            return (
                                <Pressable
                                    key={idx}
                                    style={({ pressed }) => [
                                        styles.monthCell,
                                        isActive && styles.monthCellActive,
                                        pressed && styles.monthCellPressed,
                                    ]}
                                    onPress={() => {
                                        onSelect(displayYear, idx);
                                        onClose();
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.monthText,
                                            isActive && styles.monthTextActive,
                                        ]}
                                    >
                                        {name.slice(0, 3)}
                                    </Text>
                                </Pressable>
                            );
                        })}
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
                    padding: 24,
                },
                sheet: {
                    width: "100%",
                    maxWidth: 360,
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 12 },
                    shadowRadius: 32,
                    shadowOpacity: 0.18,
                    elevation: 12,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                },
                arrowBtn: {
                    padding: 8,
                    borderRadius: 8,
                },
                arrowBtnPressed: {
                    opacity: 0.6,
                },
                yearText: {
                    flex: 1,
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.text,
                },
                closeBtn: {
                    padding: 8,
                },
                grid: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                },
                monthCell: {
                    width: "22%",
                    flexGrow: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: colors.tag,
                },
                monthCellActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                monthCellPressed: {
                    opacity: 0.72,
                },
                monthText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                monthTextActive: {
                    color: colors.onPrimary,
                },
            }),
        [colors]
    );
}

export default MonthPickerModal;
