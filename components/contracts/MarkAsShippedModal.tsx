import { Text } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { faTimes, faTruck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, TextInput as PaperInput } from "react-native-paper";

interface MarkAsShippedModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (shippingData: ShippingData) => Promise<void>;
}

export interface ShippingData {
    shippingId: string;
    shippingAgent: string;
    estimatedDeliveryDate: string;
}

const MarkAsShippedModal: React.FC<MarkAsShippedModalProps> = ({
    visible,
    onClose,
    onConfirm,
}) => {
    const theme = useTheme();
    const [shippingId, setShippingId] = useState("");
    const [shippingAgent, setShippingAgent] = useState("");
    const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!shippingId.trim() || !shippingAgent.trim()) {
            return;
        }

        setLoading(true);
        try {
            await onConfirm({
                shippingId: shippingId.trim(),
                shippingAgent: shippingAgent.trim(),
                estimatedDeliveryDate: estimatedDeliveryDate.toISOString(),
            });
            handleClose();
        } catch (error) {
            console.error("Error marking as shipped:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShippingId("");
        setShippingAgent("");
        setEstimatedDeliveryDate(new Date());
        setShowDatePicker(false);
        onClose();
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setEstimatedDeliveryDate(selectedDate);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <Pressable
                style={styles.overlay}
                onPress={handleClose}
            >
                <Pressable
                    style={[
                        styles.modalContainer,
                        { backgroundColor: Colors(theme).background },
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleContainer}>
                            <FontAwesomeIcon
                                icon={faTruck}
                                size={24}
                                color={Colors(theme).primary}
                            />
                            <Text style={styles.title}>Mark as Shipped</Text>
                        </View>
                        <Pressable onPress={handleClose}>
                            <FontAwesomeIcon
                                icon={faTimes}
                                size={24}
                                color={Colors(theme).text}
                            />
                        </Pressable>
                    </View>

                    {/* Form Content */}
                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Shipping ID *</Text>
                            <PaperInput
                                mode="outlined"
                                placeholder="Enter tracking/shipping ID"
                                value={shippingId}
                                onChangeText={setShippingId}
                                style={styles.input}
                                outlineColor={Colors(theme).gray300}
                                activeOutlineColor={Colors(theme).primary}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Shipping Agent *</Text>
                            <PaperInput
                                mode="outlined"
                                placeholder="E.g., FedEx, DHL, UPS"
                                value={shippingAgent}
                                onChangeText={setShippingAgent}
                                style={styles.input}
                                outlineColor={Colors(theme).gray300}
                                activeOutlineColor={Colors(theme).primary}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Estimated Delivery Date *</Text>
                            <Pressable onPress={() => setShowDatePicker(true)}>
                                <View pointerEvents="none">
                                    <PaperInput
                                        mode="outlined"
                                        value={formatDate(estimatedDeliveryDate)}
                                        style={styles.input}
                                        outlineColor={Colors(theme).gray300}
                                        activeOutlineColor={Colors(theme).primary}
                                        editable={false}
                                        right={<PaperInput.Icon icon="calendar" />}
                                    />
                                </View>
                            </Pressable>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={estimatedDeliveryDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                            />
                        )}

                        {Platform.OS === 'ios' && showDatePicker && (
                            <Button
                                mode="text"
                                onPress={() => setShowDatePicker(false)}
                                style={{ marginTop: 8 }}
                            >
                                Done
                            </Button>
                        )}
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Button
                            mode="outlined"
                            onPress={handleClose}
                            style={styles.button}
                            labelStyle={{ color: Colors(theme).text }}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleConfirm}
                            style={styles.button}
                            buttonColor={Colors(theme).primary}
                            disabled={!shippingId.trim() || !shippingAgent.trim() || loading}
                            loading={loading}
                        >
                            Confirm
                        </Button>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "90%",
        maxWidth: 500,
        borderRadius: 12,
        padding: 20,
        maxHeight: "80%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: "600",
    },
    content: {
        marginBottom: 20,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "transparent",
    },
    actions: {
        flexDirection: "row",
        gap: 12,
    },
    button: {
        flex: 1,
    },
});

export default MarkAsShippedModal;
