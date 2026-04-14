import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { markShipmentShipped } from "../api/shipment-pending.api";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../theme/Themed";
import Button from "../../ui/button";
import TextInput from "../../ui/text-input";
import ContractActionOverlay from "../ContractActionOverlay";
import DatePickerModal, {
    formatDateForWebInput,
    parseWebInputDate,
} from "../../modals/DatePickerModal";

export interface ShippingAddressModalProps {
    visible: boolean;
    onClose: () => void;
    contractId: string;
    onSuccess: () => void;
}

const ShippingAddressModal: React.FC<ShippingAddressModalProps> = ({
    visible,
    onClose,
    contractId,
    onSuccess,
}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
    const webExpectedDateInputStyle = useMemo(
        () => ({
            width: "100%" as const,
            height: 44,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            border: `1px solid ${colors.budgetCardBorder}`,
            backgroundColor: colors.tag ?? colors.gray200,
            color: colors.text,
            fontSize: 15,
            boxSizing: "border-box" as const,
        }),
        [colors.budgetCardBorder, colors.gray200, colors.tag, colors.text]
    );

    const [courierName, setCourierName] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [shipmentLink, setShipmentLink] = useState("");
    const [expectedDate, setExpectedDate] = useState(() => {
        const d = new Date();
        // Default to +7 days so the API always receives a valid expectedDate.
        d.setDate(d.getDate() + 7);
        return d.getTime();
    });
    const [submitting, setSubmitting] = useState(false);
    const [expectedDateModalVisible, setExpectedDateModalVisible] = useState(false);

    const handleSubmit = async () => {
        if (!courierName.trim() || !trackingNumber.trim()) {
            Toaster.error("Courier name and tracking number are required");
            return;
        }
        setSubmitting(true);
        try {
            await markShipmentShipped({
                contractId,
                shipmentProvider: courierName.trim(),
                trackingId: trackingNumber.trim(),
                expectedDate,
            });
            Toaster.success("Shipment marked as shipped");
            onSuccess();
            setCourierName("");
            setTrackingNumber("");
            setShipmentLink("");
            onClose();
        } catch (e) {
            console.error("Failed to update shipment", e);
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(
                message ? `Failed to update shipment: ${message}` : "Failed to update shipment"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setCourierName("");
        setTrackingNumber("");
        setShipmentLink("");
        onClose();
    };

    const modalContent = (
        <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <Pressable
                    style={styles.modalInner}
                    onPress={() => Platform.OS !== "web" && Keyboard.dismiss()}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Shipment Details</Text>
                        <Pressable onPress={handleClose} hitSlop={12}>
                            <FontAwesomeIcon icon={faClose} color={colors.primary} size={22} />
                        </Pressable>
                    </View>
                    <Text style={styles.sectionHint}>
                        Enter the courier and tracking info after you ship the product to the
                        influencer.
                    </Text>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.inputRow}>
                            <Text style={styles.label}>Courier name</Text>
                            <TextInput
                                value={courierName}
                                onChangeText={setCourierName}
                                placeholder="e.g. FedEx, DHL, Blue Dart"
                            />
                        </View>
                        <View style={styles.inputRow}>
                            <Text style={styles.label}>Tracking number</Text>
                            <TextInput
                                value={trackingNumber}
                                onChangeText={setTrackingNumber}
                                placeholder="Enter tracking or AWB number"
                            />
                        </View>
                        <View style={styles.inputRow}>
                            <Text style={styles.label}>Shipment link (optional)</Text>
                            <TextInput
                                value={shipmentLink}
                                onChangeText={setShipmentLink}
                                placeholder="https://tracking.example.com/..."
                                keyboardType="url"
                            />
                        </View>

                        <View style={styles.expectedDateSection}>
                            <Text style={styles.label}>Expected delivery date</Text>
                            {Platform.OS === "web" ? (
                                React.createElement("input", {
                                    type: "date",
                                    value: formatDateForWebInput(new Date(expectedDate)),
                                    min: formatDateForWebInput(new Date()),
                                    onChange: (e: { target?: { value?: string } }) => {
                                        const raw = e?.target?.value ?? "";
                                        const parsed = parseWebInputDate(raw);
                                        if (parsed) setExpectedDate(parsed.getTime());
                                    },
                                    style: webExpectedDateInputStyle,
                                })
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={styles.expectedDateButton}
                                        onPress={() => setExpectedDateModalVisible(true)}
                                    >
                                        <Text style={styles.expectedDateButtonText}>
                                            {new Date(expectedDate).toLocaleDateString(undefined, {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </Text>
                                    </TouchableOpacity>
                                    <DatePickerModal
                                        visible={expectedDateModalVisible}
                                        title="Select expected delivery date"
                                        value={new Date(expectedDate)}
                                        onChange={(d) => setExpectedDate(d.getTime())}
                                        onClose={() => setExpectedDateModalVisible(false)}
                                        minimumDate={new Date()}
                                        submitText="Done"
                                        cancelText="Cancel"
                                    />
                                </>
                            )}
                        </View>

                        <View style={styles.actions}>
                            <Button mode="outlined" style={styles.button} onPress={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                style={styles.button}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? "Updating…" : "Mark as Shipped"}
                            </Button>
                        </View>
                    </ScrollView>
                </Pressable>
            </KeyboardAvoidingView>
    );

    return (
        <ContractActionOverlay visible={visible} onClose={handleClose} mode="modal">
            <View style={styles.modalContainer}>{modalContent}</View>
        </ContractActionOverlay>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, safeAreaTop: number) {
    return StyleSheet.create({
        modalContainer: {
            backgroundColor: colors.background,
            flex: 1,
            padding: 24,
            overflow: "hidden",
        },
        keyboardView: { flex: 1, width: "100%" },
        modalInner: { flex: 1, width: "100%" },
        scrollView: { flex: 1 },
        scrollContent: { paddingBottom: 24 },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
        },
        title: {
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
        },
        sectionHint: {
            fontSize: 14,
            color: colors.gray300,
            marginBottom: 20,
            lineHeight: 20,
        },
        label: {
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
            marginBottom: 6,
        },
        inputRow: {
            marginBottom: 16,
        },
        expectedDateSection: {
            marginBottom: 16,
        },
        expectedDateButton: {
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: colors.tag ?? colors.gray200,
            marginBottom: 8,
        },
        expectedDateButtonText: {
            fontSize: 15,
            color: colors.text,
        },
        actions: {
            flexDirection: "row",
            gap: 12,
            marginTop: 20,
        },
        button: { flex: 1 },
    });
}

export default ShippingAddressModal;
