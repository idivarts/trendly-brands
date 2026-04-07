import {
    RELEASE_DATE_MAX_DAYS,
    type ReleasePlanOption,
} from "@/shared-constants/contract-status";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text } from "../../theme/Themed";
import Button from "../../ui/button";
import { scheduleRelease } from "../api/State_8_api";
import ContractActionOverlay from "../ContractActionOverlay";

const RELEASE_OPTIONS: { value: ReleasePlanOption; label: string }[] = [
    { value: "brand_and_influencer_post", label: "Brand + Influencer post as collaboration" },
    { value: "influencer_posts_alone", label: "Influencer posts alone" },
    { value: "brand_posts_alone", label: "Brand posts alone" },
];

const maxReleaseDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + RELEASE_DATE_MAX_DAYS);
    return d;
};

export interface ReleaseOptionsBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    contractId: string;
    onSuccess: () => void;
}

const ReleaseOptionsBottomSheet: React.FC<ReleaseOptionsBottomSheetProps> = ({
    visible,
    onClose,
    contractId,
    onSuccess,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [selectedOption, setSelectedOption] = useState<ReleasePlanOption | null>(null);
    const [date, setDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!selectedOption) return;
        const ts = Math.min(date.getTime(), maxReleaseDate().getTime());
        setSubmitting(true);
        try {
            await scheduleRelease({
                contractId,
                scheduledReleaseAt: ts,
                option: selectedOption,
            });
            Toaster.success("Release scheduled");
            onSuccess();
            onClose();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(
                message ? `Failed to schedule release: ${message}` : "Failed to schedule release"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const maxDate = maxReleaseDate();

    const content = (
        <View style={styles.container}>
            <Text style={styles.title}>Plan Release</Text>
            <Text style={styles.subtitle}>How will the video be published?</Text>
            {RELEASE_OPTIONS.map((opt) => (
                <TouchableOpacity
                    key={opt.value}
                    style={[
                        styles.optionRow,
                        selectedOption === opt.value && styles.optionRowSelected,
                    ]}
                    onPress={() => setSelectedOption(opt.value)}
                >
                    <Text
                        style={[
                            styles.optionLabel,
                            selectedOption === opt.value && styles.optionLabelSelected,
                        ]}
                    >
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            ))}
            <Text style={[styles.subtitle, styles.dateLabel]}>Release date (max 30 days)</Text>
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
                    maximumDate={maxDate}
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
                <Button
                    mode="contained"
                    style={styles.button}
                    onPress={handleConfirm}
                    disabled={!selectedOption || submitting}
                >
                    Schedule Release
                </Button>
            </View>
        </View>
    );

    return (
        <ContractActionOverlay
            visible={visible}
            onClose={onClose}
            mode="auto"
            snapPointsRange={["50%", "90%"]}
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
            color: colors.gray300,
            marginBottom: 12,
        },
        dateLabel: { marginTop: 16 },
        optionRow: {
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: colors.tag ?? "rgba(0,0,0,0.06)",
            marginBottom: 8,
        },
        optionRowSelected: {
            backgroundColor: colors.primary,
        },
        optionLabel: {
            fontSize: 15,
            color: colors.text,
        },
        optionLabelSelected: {
            color: colors.white,
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

export default ReleaseOptionsBottomSheet;
