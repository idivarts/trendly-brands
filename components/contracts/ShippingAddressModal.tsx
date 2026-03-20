import { type ShipmentFormInput } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal as RNModal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Modal as PaperModal } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text } from "../theme/Themed";
import Button from "../ui/button";
import TextInput from "../ui/text-input";

export interface ShippingAddressModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: ShipmentFormInput) => Promise<void> | void;
}

const ShippingAddressModal: React.FC<ShippingAddressModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);

    const [courierName, setCourierName] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [shipmentLink, setShipmentLink] = useState("");
    const [expectedDate, setExpectedDate] = useState(() => {
        const d = new Date();
        // Default to +7 days so the API always receives a valid expectedDate.
        d.setDate(d.getDate() + 7);
        return d.getTime();
    });
    const [hasSelectedExpectedDate, setHasSelectedExpectedDate] = useState(false);
    const [showExpectedDatePicker, setShowExpectedDatePicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!courierName.trim() || !trackingNumber.trim()) {
            Toaster.error("Courier name and tracking number are required");
            return;
        }
        setSubmitting(true);
        try {
            await onSubmit({
                courierName: courierName.trim(),
                trackingNumber: trackingNumber.trim(),
                shipmentLink: shipmentLink.trim() || undefined,
                expectedDate,
            });
            setCourierName("");
            setTrackingNumber("");
            setShipmentLink("");
            onClose();
        } catch (e) {
            // ActionContainer's onSubmit handler already toasts the real error.
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
                            <TouchableOpacity
                                style={styles.expectedDateButton}
                                onPress={() => {
                                    setHasSelectedExpectedDate(false);
                                    setExpectedDatePickerVisibleAtLeastOnce(true);
                                    setShowExpectedDatePicker(true);
                                }}
                            >
                                <Text style={styles.expectedDateButtonText}>
                                    Select expected date
                                </Text>
                            </TouchableOpacity>
                            {hasSelectedExpectedDate && !showExpectedDatePicker ? (
                                <Text style={styles.expectedDateSelectedText}>
                                    {new Date(expectedDate).toLocaleDateString(undefined, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </Text>
                            ) : null}
                            {showExpectedDatePicker && (
                                <DateTimePicker
                                    value={new Date(expectedDate)}
                                    mode="date"
                                    // Use spinner to reduce iOS double-tap / crash risk.
                                    display={Platform.OS === "ios" ? "spinner" : "default"}
                                    minimumDate={new Date()}
                                    onChange={(event, d) => {
                                        if ((event as any)?.type === "set" && d) {
                                            const prevMs = expectedDate;
                                            const nextMs = d.getTime();
                                            setExpectedDate(nextMs);
                                            setHasSelectedExpectedDate(nextMs !== prevMs);
                                        }
                                        setShowExpectedDatePicker(false);
                                    }}
                                />
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

    if (Platform.OS !== "web") {
        return (
            <RNModal
                visible={visible}
                animationType="slide"
                onRequestClose={handleClose}
                statusBarTranslucent
            >
                <View style={styles.modalContainer}>{modalContent}</View>
            </RNModal>
        );
    }

    return (
        <PaperModal
            visible={visible}
            onDismiss={handleClose}
            contentContainerStyle={styles.modalContainer}
        >
            {modalContent}
        </PaperModal>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, safeAreaTop: number) {
    const isNative = Platform.OS !== "web";
    return StyleSheet.create({
        modalContainer: {
            backgroundColor: colors.background,
            ...(isNative
                ? {
                      flex: 1,
                      margin: 0,
                      marginHorizontal: 0,
                      maxWidth: "100%",
                      alignSelf: "stretch",
                      borderRadius: 0,
                      paddingTop: Math.max(safeAreaTop, 16),
                      paddingHorizontal: 24,
                      paddingBottom: 24,
                  }
                : {
                      borderRadius: 12,
                      padding: 24,
                      marginHorizontal: 24,
                      maxWidth: 440,
                      alignSelf: "center",
                  }),
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
        expectedDateSelectedText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 10,
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
