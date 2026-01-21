import { Text } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";

export interface RevisionData {
    reason: string;
}

interface RequestRevisionModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (revisionData: RevisionData) => Promise<void>;
}

const RequestRevisionModal: React.FC<RequestRevisionModalProps> = ({
    visible,
    onClose,
    onConfirm,
}) => {
    const theme = useTheme();
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
        setReason("");
        setSubmitting(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleConfirm = async () => {
        if (!reason.trim()) {
            Alert.alert("Missing Information", "Please enter the reason for revision");
            return;
        }

        try {
            setSubmitting(true);
            await onConfirm({
                reason: reason.trim(),
            });
            handleClose();
        } catch (error) {
            console.error("Error requesting revision:", error);
            setSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: Colors(theme).background }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: Colors(theme).text }]}>
                                Requesting for revision
                            </Text>
                            <Text style={[styles.subtitle, { color: Colors(theme).gray300 }]}>
                                Let the influencer know what needs to be revised
                            </Text>
                        </View>
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <FontAwesomeIcon
                                icon={faTimes}
                                size={24}
                                color={Colors(theme).text}
                            />
                        </Pressable>
                    </View>

                    {/* Note Field */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: Colors(theme).text }]}>
                            Note
                        </Text>
                        <TextInput
                            mode="outlined"
                            placeholder="Write your notes here..."
                            value={reason}
                            onChangeText={setReason}
                            multiline
                            numberOfLines={6}
                            style={styles.textInput}
                        />
                        <Text style={[styles.supportingText, { color: Colors(theme).gray300 }]}>
                            Supporting text
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.footer}>
                        <Button
                            mode="outlined"
                            onPress={handleClose}
                            style={styles.cancelButton}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleConfirm}
                            style={styles.confirmButton}
                            loading={submitting}
                            disabled={submitting}
                        >
                            Confirm
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContainer: {
        width: "100%",
        maxWidth: 600,
        borderRadius: 20,
        padding: 24,
        maxHeight: "90%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
    },
    closeButton: {
        padding: 4,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    textInput: {
        minHeight: 120,
    },
    supportingText: {
        fontSize: 12,
        marginTop: 4,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
    },
    confirmButton: {
        flex: 1,
    },
});

export default RequestRevisionModal;
