/**
 * Dev-only: state manager to override contract status for UI testing.
 * Renders only when __DEV__ is true. Not included in production builds.
 */
import { ContractStatus, CONTRACT_STATUS_LABELS } from "@/shared-constants/contract-status";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { useTheme } from "@react-navigation/native";
import { doc, updateDoc } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "../theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";

const ALL_STATES = [
    ContractStatus.Pending,
    ContractStatus.Started,
    ContractStatus.PaymentFailed,
    ContractStatus.ShipmentPending,
    ContractStatus.DeliveryPending,
    ContractStatus.VideoPending,
    ContractStatus.ReviewPending,
    ContractStatus.PlanRelease,
    ContractStatus.PostScheduled,
    ContractStatus.PostDone,
    ContractStatus.Settled,
] as const;

export interface ContractStatusDevToolsProps {
    /** Current contract status from Firestore */
    realStatus: number;
    /** Override status for UI (null = use real) */
    overrideStatus: number | null;
    onOverrideChange: (status: number | null) => void;
    /** Contract document id (streamChannelId) for writing to Firestore */
    contractId: string;
    onWriteSuccess?: () => void;
}

function ContractStatusDevToolsInner({
    realStatus,
    overrideStatus,
    onOverrideChange,
    contractId,
    onWriteSuccess,
}: ContractStatusDevToolsProps) {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [writing, setWriting] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const effectiveStatus = overrideStatus ?? realStatus;

    const handleWriteToFirestore = async () => {
        const statusToWrite = overrideStatus ?? realStatus;
        if (statusToWrite < 0 || statusToWrite > 10) return;
        setWriting(true);
        try {
            const contractRef = doc(FirestoreDB, "contracts", contractId);
            await updateDoc(contractRef, { status: statusToWrite });
            Toaster.success(`Status written: ${CONTRACT_STATUS_LABELS[statusToWrite as ContractStatus]}`);
            onOverrideChange(null);
            onWriteSuccess?.();
        } catch (e) {
            Toaster.error("Failed to write status");
        } finally {
            setWriting(false);
        }
    };

    return (
        <View style={styles.root}>
            <TouchableOpacity
                style={styles.header}
                onPress={() => setCollapsed(c => !c)}
                activeOpacity={0.8}
            >
                <Text style={styles.headerTitle}>Contract State (Dev)</Text>
                <Text style={styles.headerSubtitle}>
                    Real: {realStatus} {overrideStatus != null ? ` · Override: ${overrideStatus}` : ""}
                </Text>
                <Text style={styles.headerHint}>{collapsed ? "Tap to expand" : "Tap to collapse"}</Text>
            </TouchableOpacity>
            {!collapsed && (
                <View style={styles.body}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.statesRow}
                    >
                        {ALL_STATES.map((s) => {
                            const label = CONTRACT_STATUS_LABELS[s];
                            const isSelected = effectiveStatus === s;
                            const isOverride = overrideStatus === s;
                            return (
                                <TouchableOpacity
                                    key={s}
                                    style={[
                                        styles.stateChip,
                                        isSelected && styles.stateChipSelected,
                                        isOverride && styles.stateChipOverride,
                                    ]}
                                    onPress={() => onOverrideChange(overrideStatus === s ? null : s)}
                                >
                                    <Text
                                        style={[
                                            styles.stateChipText,
                                            isSelected && styles.stateChipTextSelected,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {s}. {label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <View style={styles.actionsRow}>
                        {overrideStatus != null && (
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => onOverrideChange(null)}
                            >
                                <Text style={styles.actionBtnText}>Clear override</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnPrimary]}
                            onPress={handleWriteToFirestore}
                            disabled={writing}
                        >
                            <Text style={styles.actionBtnTextPrimary}>
                                {writing ? "Writing…" : `Write ${effectiveStatus} to Firestore`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        root: {
            marginHorizontal: 16,
            marginVertical: 8,
            backgroundColor: colors.gray200 ?? "rgba(0,0,0,0.06)",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.gray300 ?? "rgba(0,0,0,0.12)",
            overflow: "hidden",
        },
        header: {
            paddingVertical: 10,
            paddingHorizontal: 12,
        },
        headerTitle: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.primary,
            textTransform: "uppercase",
        },
        headerSubtitle: {
            fontSize: 11,
            color: colors.gray300,
            marginTop: 2,
        },
        headerHint: {
            fontSize: 10,
            color: colors.gray300,
            marginTop: 2,
            fontStyle: "italic",
        },
        body: {
            paddingHorizontal: 12,
            paddingBottom: 12,
        },
        statesRow: {
            flexDirection: "row",
            gap: 8,
            paddingVertical: 8,
        },
        stateChip: {
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 6,
            backgroundColor: colors.tag ?? "rgba(0,0,0,0.08)",
        },
        stateChipSelected: {
            backgroundColor: colors.primary,
        },
        stateChipOverride: {
            borderWidth: 2,
            borderColor: colors.primary,
        },
        stateChipText: {
            fontSize: 11,
            color: colors.text,
        },
        stateChipTextSelected: {
            color: colors.white,
        },
        actionsRow: {
            flexDirection: "row",
            gap: 8,
            marginTop: 8,
        },
        actionBtn: {
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 6,
            backgroundColor: colors.tag ?? "rgba(0,0,0,0.08)",
        },
        actionBtnPrimary: {
            backgroundColor: colors.primary,
        },
        actionBtnText: {
            fontSize: 11,
            color: colors.text,
        },
        actionBtnTextPrimary: {
            fontSize: 11,
            color: colors.white,
        },
    });
}

export default function ContractStatusDevTools(props: ContractStatusDevToolsProps) {
    if (!__DEV__) return null;
    return <ContractStatusDevToolsInner {...props} />;
}
