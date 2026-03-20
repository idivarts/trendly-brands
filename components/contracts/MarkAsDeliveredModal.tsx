import { useFirebaseStorageContext } from "@/contexts";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { faBox, faCircleInfo, faCloudArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal as RNModal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Checkbox, Modal as PaperModal } from "react-native-paper";
import { Text } from "../theme/Themed";
import Button from "../ui/button";
import TextInput from "../ui/text-input";

const MAX_IMAGE_MB = 5;
const PROOF_PATH_PREFIX = "contracts";

export interface MarkAsDeliveredModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: { proofOfDeliveryUrl?: string; receivedNotes?: string }) => Promise<void> | void;
    contractId: string;
}

const MarkAsDeliveredModal: React.FC<MarkAsDeliveredModalProps> = ({
    visible,
    onClose,
    onSubmit,
    contractId,
}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
    const { uploadImage } = useFirebaseStorageContext();

    const [proofDataUrl, setProofDataUrl] = useState<string>("");
    const [note, setNote] = useState("");
    const [confirmChecked, setConfirmChecked] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Toaster.error("Please grant photo library access to upload proof.");
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });
            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                if (asset.fileSize && asset.fileSize > MAX_IMAGE_MB * 1024 * 1024) {
                    Toaster.error(`Image must be under ${MAX_IMAGE_MB}MB`);
                    return;
                }
                const base64 = asset.base64;
                if (base64) {
                    setProofDataUrl(`data:image/jpeg;base64,${base64}`);
                } else {
                    Toaster.error("Could not read image data");
                }
            }
        } catch (e) {
            Toaster.error("Failed to pick image");
        }
    };

    const handleSubmit = async () => {
        if (!confirmChecked) {
            Toaster.error("Please confirm that the product is delivered and documentation is accurate.");
            return;
        }
        if (!proofDataUrl) {
            Toaster.error("Please upload proof of delivery.");
            return;
        }
        setSubmitting(true);
        try {
            const path = `${PROOF_PATH_PREFIX}/${contractId}/delivery-proof/${Date.now()}.jpg`;
            const proofOfDeliveryUrl = await uploadImage(proofDataUrl, path);
            await onSubmit({
                proofOfDeliveryUrl,
                receivedNotes: note.trim() || undefined,
            });
            setProofDataUrl("");
            setNote("");
            setConfirmChecked(false);
            onClose();
        } catch (e) {
            // If the failure came from ActionContainer (Firestore update), it already toasts the real error.
            // Only show a generic toast when the image upload itself failed.
            const message = e instanceof Error ? e.message : "";
            if (!message) {
                Toaster.error("Failed to upload proof. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setProofDataUrl("");
        setNote("");
        setConfirmChecked(false);
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
                    <View style={styles.iconCircle}>
                        <FontAwesomeIcon icon={faBox} size={28} color={colors.onPrimary ?? colors.surface} />
                    </View>
                    <Text style={styles.title}>Requesting for update</Text>
                    <Text style={styles.subtitle}>Are you sure the product is delivered?</Text>
                </View>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.label}>PROOF OF DELIVERY</Text>
                    <Pressable style={styles.uploadBox} onPress={pickImage}>
                        {proofDataUrl ? (
                            <View style={styles.uploadPreview}>
                                <FontAwesomeIcon icon={faBox} size={40} color={colors.primary} />
                                <Text style={styles.uploadPreviewText}>Image selected. Tap to change.</Text>
                            </View>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faCloudArrowUp} size={32} color={colors.primary} />
                                <Text style={styles.uploadTitle}>Tap to upload image</Text>
                                <Text style={styles.uploadHint}>JPG, PNG or PDF (Max {MAX_IMAGE_MB}MB)</Text>
                            </>
                        )}
                    </Pressable>

                    <Text style={styles.label}>NOTE</Text>
                    <TextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder="Write your notes here..."
                        multiline
                        numberOfLines={3}
                        style={styles.noteInput}
                    />
                    <View style={styles.helperRow}>
                        <FontAwesomeIcon icon={faCircleInfo} size={14} color={colors.gray300} />
                        <Text style={styles.helperText}>
                            Supporting text: provide specific delivery instructions or location details.
                        </Text>
                    </View>

                    <Pressable
                        style={styles.checkboxRow}
                        onPress={() => setConfirmChecked((c) => !c)}
                    >
                        <Checkbox
                            status={confirmChecked ? "checked" : "unchecked"}
                            onPress={() => setConfirmChecked((c) => !c)}
                            color={colors.primary}
                        />
                        <Text style={styles.checkboxLabel}>
                            I confirm that the product is delivered and the documentation is accurate.
                        </Text>
                    </Pressable>

                    <View style={styles.actions}>
                        <Button
                            mode="outlined"
                            style={styles.button}
                            onPress={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            style={styles.button}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? "Updating…" : "Confirm Update"}
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
            alignItems: "center",
            marginBottom: 24,
        },
        iconCircle: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 4,
        },
        subtitle: {
            fontSize: 14,
            color: colors.gray300,
        },
        label: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.gray300,
            letterSpacing: 0.5,
            marginBottom: 8,
        },
        uploadBox: {
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.gray300,
            borderRadius: 12,
            padding: 24,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            minHeight: 120,
        },
        uploadTitle: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
            marginTop: 8,
        },
        uploadHint: {
            fontSize: 12,
            color: colors.gray300,
            marginTop: 4,
        },
        uploadPreview: {
            alignItems: "center",
        },
        uploadPreviewText: {
            fontSize: 14,
            color: colors.primary,
            marginTop: 8,
        },
        noteInput: {
            minHeight: 80,
            textAlignVertical: "top",
            marginBottom: 6,
        },
        helperRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 20,
        },
        helperText: {
            fontSize: 12,
            color: colors.gray300,
            flex: 1,
        },
        checkboxRow: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
        },
        checkboxLabel: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
            flex: 1,
            marginLeft: 8,
        },
        actions: {
            flexDirection: "column",
            gap: 12,
        },
        button: {
            width: "100%",
        },
    });
}

export default MarkAsDeliveredModal;
