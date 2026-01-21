import { Text } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { faTimes, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";

export interface DeliveryData {
    deliveryProofUrl: string;
    note: string;
    confirmed: boolean;
}

interface MarkAsDeliveredModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (deliveryData: DeliveryData) => Promise<void>;
}

const MarkAsDeliveredModal: React.FC<MarkAsDeliveredModalProps> = ({
    visible,
    onClose,
    onConfirm,
}) => {
    const theme = useTheme();
    const [deliveryProofUrl, setDeliveryProofUrl] = useState("");
    const [note, setNote] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
        setDeliveryProofUrl("");
        setNote("");
        setConfirmed(false);
        setUploading(false);
        setSubmitting(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (!permissionResult.granted) {
                Alert.alert("Permission Required", "Please grant permission to access your photo library");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setUploading(true);
                // Here you would upload to your storage service
                // For now, we'll use the local URI
                setDeliveryProofUrl(result.assets[0].uri);
                setUploading(false);
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to pick image");
            setUploading(false);
        }
    };

    const handleConfirm = async () => {
        if (!deliveryProofUrl) {
            Alert.alert("Missing Information", "Please upload delivery proof");
            return;
        }

        if (!note.trim()) {
            Alert.alert("Missing Information", "Please add a note");
            return;
        }

        if (!confirmed) {
            Alert.alert("Confirmation Required", "Please confirm that the product is delivered");
            return;
        }

        try {
            setSubmitting(true);
            await onConfirm({
                deliveryProofUrl,
                note: note.trim(),
                confirmed,
            });
            handleClose();
        } catch (error) {
            console.error("Error confirming delivery:", error);
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
                                Requesting for update
                            </Text>
                            <Text style={[styles.subtitle, { color: Colors(theme).gray300 }]}>
                                Are you sure the product is delivered
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

                    <ScrollView 
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Upload Delivery Proof */}
                        <View style={styles.section}>
                            <Pressable
                                onPress={pickImage}
                                style={[styles.uploadArea, { backgroundColor: Colors(theme).gray100 }]}
                                disabled={uploading}
                            >
                                {deliveryProofUrl ? (
                                    <Image
                                        source={{ uri: deliveryProofUrl }}
                                        style={styles.uploadedImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <>
                                        <FontAwesomeIcon
                                            icon={faUpload}
                                            size={48}
                                            color={Colors(theme).gray300}
                                        />
                                        <Text style={[styles.uploadText, { color: Colors(theme).gray300 }]}>
                                            {uploading ? "Uploading..." : "Tap to upload delivery proof"}
                                        </Text>
                                    </>
                                )}
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
                                value={note}
                                onChangeText={setNote}
                                multiline
                                numberOfLines={4}
                                style={styles.textInput}
                            />
                            <Text style={[styles.supportingText, { color: Colors(theme).gray300 }]}>
                                Supporting text
                            </Text>
                        </View>

                        {/* Confirmation Checkbox */}
                        <Pressable
                            onPress={() => setConfirmed(!confirmed)}
                            style={styles.checkboxContainer}
                        >
                            <View
                                style={[
                                    styles.checkbox,
                                    {
                                        borderColor: Colors(theme).text,
                                        backgroundColor: confirmed ? Colors(theme).text : "transparent",
                                    },
                                ]}
                            />
                            <Text style={[styles.checkboxLabel, { color: Colors(theme).text }]}> 
                                I confirm that the product is delivered
                            </Text>
                        </Pressable>
                    </ScrollView>

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
                            disabled={submitting || uploading}
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
        marginBottom: 16,
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
    scrollView: {
        flexGrow: 0,
        flexShrink: 1,
    },
    scrollContent: {
        paddingBottom: 8,
    },
    section: {
        marginBottom: 24,
    },
    uploadArea: {
        height: 200,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#E0E0E0",
        borderStyle: "dashed",
        overflow: "hidden",
    },
    uploadedImage: {
        width: "100%",
        height: "100%",
    },
    uploadText: {
        marginTop: 12,
        fontSize: 14,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    textInput: {
        minHeight: 100,
    },
    supportingText: {
        fontSize: 12,
        marginTop: 4,
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
        flexShrink: 0,
    },
    checkboxLabel: {
        fontSize: 16,
        marginLeft: 8,
        flex: 1,
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

export default MarkAsDeliveredModal;
