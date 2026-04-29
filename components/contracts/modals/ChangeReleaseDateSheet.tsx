import { ContractStatus, RELEASE_DATE_MAX_DAYS } from "@/shared-constants/contract-status";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import DatePickerModal, {
    formatDateForWebInput,
    parseWebInputDate,
} from "../../modals/DatePickerModal";
import { Text } from "../../theme/Themed";
import Button from "../../ui/button";
import { changeReleaseDate as changeReleaseDateState7 } from "../api/posting-pending.api";
import { changeReleaseDate as changeReleaseDateState8 } from "../api/release-pending.api";
import ContractActionOverlay from "../ContractActionOverlay";

const maxReleaseDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + RELEASE_DATE_MAX_DAYS);
    return d;
};

export interface ChangeReleaseDateSheetProps {
    visible: boolean;
    initialDate?: number;
    onClose: () => void;
    contractId: string;
    /** True when `contract.posting?.scheduledDate` is already set (state-8 reschedule path). */
    hasExistingScheduledDate: boolean;
    contractStatus: ContractStatus;
    onSuccess: () => void;
}

const ChangeReleaseDateSheet: React.FC<ChangeReleaseDateSheetProps> = ({
    visible,
    initialDate,
    onClose,
    contractId,
    hasExistingScheduledDate,
    contractStatus,
    onSuccess,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const webDateInputStyle = useMemo(
        () => ({
            width: "100%" as const,
            height: 44,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            border: `1px solid ${colors.budgetCardBorder}`,
            backgroundColor: colors.secondarySurface ?? colors.card,
            color: colors.text,
            fontSize: 15,
            boxSizing: "border-box" as const,
        }),
        [colors.budgetCardBorder, colors.card, colors.secondarySurface, colors.text]
    );

    const [date, setDate] = useState(() =>
        initialDate ? new Date(initialDate) : (() => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            return d;
        })()
    );
    const [submitting, setSubmitting] = useState(false);
    const [dateModalVisible, setDateModalVisible] = useState(false);

    /** Keep local date in sync when reopening with a new initialDate from the contract. */
    useEffect(() => {
        if (!visible) return;
        if (initialDate) {
            setDate(new Date(initialDate));
        }
    }, [visible, initialDate]);

    /**
     * Native: open the system date UI as soon as this sheet is shown (same flow as Approve Video).
     * Web: use inline `input type="date"` below — no second modal.
     */
    useEffect(() => {
        if (!visible) {
            setDateModalVisible(false);
            return;
        }
        if (Platform.OS === "web") return;
        setDateModalVisible(true);
    }, [visible]);

    const handleConfirm = async () => {
        if (contractStatus !== ContractStatus.PostingPending) return;
        const ts = Math.min(date.getTime(), maxReleaseDate().getTime());
        setSubmitting(true);
        try {
            if (hasExistingScheduledDate) {
                await changeReleaseDateState8({
                    contractId,
                    newScheduledDate: ts,
                });
            } else {
                await changeReleaseDateState7({
                    contractId,
                    newScheduledDate: ts,
                });
            }
            Toaster.success("Release date updated");
            onSuccess();
            onClose();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(message ? `Failed to update date: ${message}` : "Failed to update date");
        } finally {
            setSubmitting(false);
        }
    };

    const content = (
        <View style={styles.container}>
            <Text style={styles.title}>Change Release Date</Text>
            <Text style={styles.subtitle}>Max 30 days from today</Text>

            {Platform.OS === "web" ? (
                <View style={styles.webDateSection}>
                    <Text style={styles.dateFieldLabel}>Release date</Text>
                    {React.createElement("input", {
                        type: "date",
                        value: formatDateForWebInput(date),
                        min: formatDateForWebInput(new Date()),
                        max: formatDateForWebInput(maxReleaseDate()),
                        onChange: (e: { target?: { value?: string } }) => {
                            const raw = e?.target?.value ?? "";
                            const parsed = parseWebInputDate(raw);
                            if (!parsed) return;
                            const capped = Math.min(
                                parsed.getTime(),
                                maxReleaseDate().getTime()
                            );
                            setDate(new Date(capped));
                        },
                        style: webDateInputStyle,
                    })}
                </View>
            ) : (
                <>
                    {!dateModalVisible ? (
                        <Pressable
                            onPress={() => setDateModalVisible(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Change release date"
                            style={({ pressed }) => [
                                styles.dateButton,
                                pressed && styles.dateButtonPressed,
                            ]}
                        >
                            <Text style={styles.dateButtonText}>
                                {date.toLocaleDateString(undefined, {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </Text>
                        </Pressable>
                    ) : null}
                    <DatePickerModal
                        visible={dateModalVisible}
                        title="Select release date"
                        value={date}
                        onChange={setDate}
                        onClose={() => setDateModalVisible(false)}
                        minimumDate={new Date()}
                        maximumDate={maxReleaseDate()}
                        submitText="Done"
                        cancelText="Cancel"
                    />
                </>
            )}

            <View style={styles.actions}>
                <Button mode="outlined" style={styles.button} onPress={onClose}>
                    Cancel
                </Button>
                <Button
                    mode="contained"
                    style={styles.button}
                    onPress={handleConfirm}
                    disabled={submitting}
                    loading={submitting}
                >
                    {submitting ? "Updating…" : "Update Date"}
                </Button>
            </View>
        </View>
    );

    return (
        <ContractActionOverlay
            visible={visible}
            onClose={onClose}
            mode="auto"
            snapPointsRange={["40%", "50%"]}
            modalMaxWidth={520}
        >
            {content}
        </ContractActionOverlay>
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
            color: colors.textSecondary ?? colors.text,
            marginBottom: 12,
        },
        webDateSection: {
            marginBottom: 20,
        },
        dateFieldLabel: {
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
            marginBottom: 6,
        },
        dateButton: {
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: colors.tag ?? colors.gray200,
            marginBottom: 20,
        },
        dateButtonPressed: {
            opacity: 0.85,
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
