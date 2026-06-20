import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { Text } from "../../theme/Themed";
import Button from "../../ui/button";
import TextInput from "../../ui/text-input";
import { raiseDisputeAsBrand } from "../api/DisputeCancellation_api";
import ContractActionOverlay from "../ContractActionOverlay";

const DISPUTE_TYPES: { value: string; label: string }[] = [
    { value: "deliverable_not_sent", label: "Influencer Hasn't Submitted Video" },
    { value: "posting_default", label: "Influencer Didn't Post / Deleted Post" },
    { value: "terms_violation", label: "Influencer Violated Agreed Terms" },
    { value: "revision_abuse", label: "Excessive Revisions Dispute" },
    { value: "other", label: "Other" },
];

export interface RaiseDisputeModalProps {
    visible: boolean;
    onClose: () => void;
    contractId: string;
    onSuccess: () => void;
}

const RaiseDisputeModal: React.FC<RaiseDisputeModalProps> = ({
    visible,
    onClose,
    contractId,
    onSuccess,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [step, setStep] = useState(0);
    const [selectedType, setSelectedType] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const resetAndClose = () => {
        setStep(0);
        setSelectedType("");
        setDescription("");
        onClose();
    };

    const handleSubmit = async () => {
        if (!selectedType || description.trim().length < 10) return;
        setSubmitting(true);
        try {
            await raiseDisputeAsBrand({
                contractId,
                type: selectedType,
                description: description.trim(),
            });
            Toaster.success("Dispute raised. Our team will review it shortly.");
            onSuccess();
            resetAndClose();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(message ?? "Failed to raise dispute");
        } finally {
            setSubmitting(false);
        }
    };

    const stepTitles = ["Select Dispute Type", "Describe the Issue"];

    return (
        <ContractActionOverlay
            visible={visible}
            onClose={submitting ? () => undefined : resetAndClose}
            mode="auto"
            snapPointsRange={["80%", "90%"]}
            modalMaxWidth={520}
        >
            <View style={styles.contentShell}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardView}
                >
                    <Pressable
                        style={styles.inner}
                        onPress={() => Platform.OS !== "web" && Keyboard.dismiss()}
                    >
                        <View style={styles.header}>
                            <View style={styles.stepIndicator}>
                                {[0, 1].map((i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.stepDot,
                                            i === step ? styles.stepDotActive : i < step ? styles.stepDotDone : undefined,
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={styles.title}>Raise a Dispute</Text>
                            <Text style={styles.subtitle}>{stepTitles[step]}</Text>
                        </View>

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {step === 0 && (
                                <View style={styles.typeList}>
                                    {DISPUTE_TYPES.map((dt) => (
                                        <Pressable
                                            key={dt.value}
                                            style={[
                                                styles.typeOption,
                                                selectedType === dt.value && styles.typeOptionSelected,
                                            ]}
                                            onPress={() => setSelectedType(dt.value)}
                                        >
                                            <Text
                                                style={[
                                                    styles.typeOptionLabel,
                                                    selectedType === dt.value && styles.typeOptionLabelSelected,
                                                ]}
                                            >
                                                {dt.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}

                            {step === 1 && (
                                <>
                                    <TextInput
                                        label="Description"
                                        value={description}
                                        onChangeText={setDescription}
                                        placeholder="Describe the issue in detail (min 10 characters)..."
                                        multiline
                                        numberOfLines={5}
                                        style={styles.descInput}
                                    />
                                    <Text style={styles.helperText}>
                                        Be specific — include dates, amounts, or relevant details.
                                    </Text>
                                </>
                            )}

                            <View style={styles.actions}>
                                <Button
                                    mode="outlined"
                                    style={styles.button}
                                    onPress={step === 0 ? resetAndClose : () => setStep(0)}
                                    disabled={submitting}
                                >
                                    {step === 0 ? "Cancel" : "Back"}
                                </Button>
                                {step === 0 ? (
                                    <Button
                                        mode="contained"
                                        style={styles.button}
                                        onPress={() => setStep(1)}
                                        disabled={!selectedType}
                                    >
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        mode="contained"
                                        style={styles.button}
                                        onPress={handleSubmit}
                                        disabled={submitting || description.trim().length < 10}
                                    >
                                        {submitting ? "Submitting..." : "Submit Dispute"}
                                    </Button>
                                )}
                            </View>
                        </ScrollView>
                    </Pressable>
                </KeyboardAvoidingView>
            </View>
        </ContractActionOverlay>
    );
};

export default RaiseDisputeModal;

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        contentShell: {
            flex: 1,
            backgroundColor: colors.background,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 28,
        },
        keyboardView: { flex: 1, width: "100%" },
        inner: { flex: 1, width: "100%" },
        header: { marginBottom: 20 },
        stepIndicator: { flexDirection: "row", gap: 6, marginBottom: 12 },
        stepDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.secondaryBorder,
        },
        stepDotActive: { backgroundColor: colors.primary, width: 20 },
        stepDotDone: { backgroundColor: colors.primary, opacity: 0.5 },
        title: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 4 },
        subtitle: { fontSize: 14, color: colors.textSecondary },
        scrollView: { width: "100%" },
        scrollContent: { paddingBottom: 8 },
        typeList: { gap: 10, marginBottom: 16 },
        typeOption: {
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: colors.secondaryBorder,
            backgroundColor: colors.secondarySurface,
        },
        typeOptionSelected: {
            borderColor: colors.primary,
            backgroundColor: colors.primaryLight ?? colors.secondarySurface,
        },
        typeOptionLabel: { fontSize: 15, fontWeight: "500", color: colors.text },
        typeOptionLabelSelected: { color: colors.primary, fontWeight: "700" },
        descInput: { minHeight: 120, marginBottom: 8 },
        helperText: { color: colors.textSecondary, fontSize: 13, marginBottom: 16 },
        actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 4 },
        button: { minWidth: 110 },
    });
}
