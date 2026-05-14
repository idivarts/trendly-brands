import { ContractStatus } from "@/shared-constants/contract-status";
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
import { requestCancellationAsBrand } from "../api/DisputeCancellation_api";
import ContractActionOverlay from "../ContractActionOverlay";

function getRefundNote(status: ContractStatus): string {
    if (status <= ContractStatus.Started) return "No payment has been charged yet.";
    if (status === ContractStatus.ShipmentPending) return "You should receive a full refund.";
    if (status <= ContractStatus.DeliveryAcknowledgementPending)
        return "Refund will be decided by the support team based on the stage.";
    if (status === ContractStatus.VideoPending) return "You may receive a 50% refund as the product has been used.";
    if (status === ContractStatus.ReviewPending)
        return "Work has been submitted. No refund may be issued.";
    return "Cancellation is not available at this stage.";
}

export interface RequestCancellationModalProps {
    visible: boolean;
    onClose: () => void;
    contractId: string;
    contractStatus: ContractStatus;
    onSuccess: () => void;
}

const RequestCancellationModal: React.FC<RequestCancellationModalProps> = ({
    visible,
    onClose,
    contractId,
    contractStatus,
    onSuccess,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const refundNote = getRefundNote(contractStatus);

    const handleClose = () => {
        setReason("");
        onClose();
    };

    const handleSubmit = async () => {
        if (reason.trim().length < 5) return;
        setSubmitting(true);
        try {
            await requestCancellationAsBrand({ contractId, reason: reason.trim() });
            Toaster.success("Cancellation request sent. Waiting for the influencer to respond.");
            onSuccess();
            handleClose();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(message ?? "Failed to send cancellation request");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ContractActionOverlay
            visible={visible}
            onClose={submitting ? () => undefined : handleClose}
            mode="auto"
            snapPointsRange={["70%", "80%"]}
            modalMaxWidth={480}
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
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.title}>Request Cancellation</Text>
                            <Text style={styles.subtitle}>
                                The influencer will be notified and must approve the cancellation.
                            </Text>

                            <View style={styles.refundBanner}>
                                <Text style={styles.refundBannerLabel}>Refund Estimate</Text>
                                <Text style={styles.refundBannerText}>{refundNote}</Text>
                            </View>

                            <TextInput
                                label="Reason for cancellation"
                                value={reason}
                                onChangeText={setReason}
                                placeholder="Explain why you want to cancel..."
                                multiline
                                numberOfLines={4}
                                style={styles.reasonInput}
                            />

                            <View style={styles.actions}>
                                <Button
                                    mode="outlined"
                                    style={styles.button}
                                    onPress={handleClose}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    mode="contained"
                                    style={styles.button}
                                    onPress={handleSubmit}
                                    disabled={submitting || reason.trim().length < 5}
                                >
                                    {submitting ? "Sending..." : "Send Request"}
                                </Button>
                            </View>
                        </ScrollView>
                    </Pressable>
                </KeyboardAvoidingView>
            </View>
        </ContractActionOverlay>
    );
};

export default RequestCancellationModal;

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
        scrollView: { width: "100%" },
        scrollContent: { paddingBottom: 8 },
        title: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 6 },
        subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
        refundBanner: {
            backgroundColor: colors.errorBannerBg,
            borderWidth: 1,
            borderColor: colors.errorBannerBorder,
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 14,
            marginBottom: 16,
            gap: 4,
        },
        refundBannerLabel: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.errorBannerText,
            textTransform: "uppercase",
            letterSpacing: 0.6,
        },
        refundBannerText: { fontSize: 14, color: colors.errorBannerText },
        reasonInput: { minHeight: 100, marginBottom: 20 },
        actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
        button: { minWidth: 120 },
    });
}
