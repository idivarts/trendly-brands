import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../theme/Themed";
import Button from "../../ui/button";
import { respondToCancellationAsBrand } from "../api/DisputeCancellation_api";
import ContractActionOverlay from "../ContractActionOverlay";
import type { CancellationRequest } from "@/shared-libs/firestore/trendly-pro/models/contracts";

export interface RespondToCancellationModalProps {
    visible: boolean;
    onClose: () => void;
    contractId: string;
    cancellationRequest: CancellationRequest;
    onSuccess: () => void;
}

const RespondToCancellationModal: React.FC<RespondToCancellationModalProps> = ({
    visible,
    onClose,
    contractId,
    cancellationRequest,
    onSuccess,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [submitting, setSubmitting] = useState(false);

    const requestedDate = cancellationRequest.requestedAt
        ? new Date(cancellationRequest.requestedAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : null;

    const respond = async (approve: boolean) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await respondToCancellationAsBrand({ contractId, approve });
            Toaster.success(approve ? "Cancellation approved." : "Cancellation request rejected.");
            onSuccess();
            onClose();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(message ?? "Failed to respond to cancellation request");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ContractActionOverlay
            visible={visible}
            onClose={submitting ? () => undefined : onClose}
            mode="auto"
            snapPointsRange={["60%", "75%"]}
            modalMaxWidth={480}
        >
            <View style={styles.contentShell}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.title}>Cancellation Request</Text>
                    <Text style={styles.subtitle}>
                        The influencer has requested to cancel this contract.
                    </Text>

                    <View style={styles.reasonCard}>
                        <Text style={styles.reasonLabel}>Reason given by influencer</Text>
                        <Text style={styles.reasonText}>
                            {cancellationRequest.reason || "No reason provided."}
                        </Text>
                        {requestedDate ? (
                            <Text style={styles.requestedDate}>Requested on {requestedDate}</Text>
                        ) : null}
                    </View>

                    <View style={styles.infoCard}>
                        <Text style={styles.infoText}>
                            If you approve, the contract will be cancelled and a refund (if applicable) will be processed based on the current stage.
                        </Text>
                    </View>

                    <View style={styles.actions}>
                        <Button
                            mode="outlined"
                            style={styles.rejectButton}
                            onPress={() => void respond(false)}
                            disabled={submitting}
                        >
                            Reject
                        </Button>
                        <Button
                            mode="contained"
                            style={styles.approveButton}
                            onPress={() => void respond(true)}
                            disabled={submitting}
                        >
                            {submitting ? "Processing..." : "Approve"}
                        </Button>
                    </View>
                </ScrollView>
            </View>
        </ContractActionOverlay>
    );
};

export default RespondToCancellationModal;

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        contentShell: {
            flex: 1,
            backgroundColor: colors.background,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 28,
        },
        scrollView: { width: "100%" },
        scrollContent: { paddingBottom: 8 },
        title: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 6 },
        subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
        reasonCard: {
            backgroundColor: colors.secondarySurface,
            borderWidth: 1,
            borderColor: colors.secondaryBorder,
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 14,
            marginBottom: 12,
            gap: 6,
        },
        reasonLabel: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.6,
        },
        reasonText: { fontSize: 15, color: colors.text, lineHeight: 22 },
        requestedDate: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
        infoCard: {
            backgroundColor: colors.secondarySurface,
            borderWidth: 1,
            borderColor: colors.secondaryBorder,
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 14,
            marginBottom: 20,
        },
        infoText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
        actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
        rejectButton: { minWidth: 100 },
        approveButton: { minWidth: 120 },
    });
}
