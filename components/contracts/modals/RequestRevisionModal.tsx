import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { Text } from "../../theme/Themed";
import Button from "../../ui/button";
import TextInput from "../../ui/text-input";
import { requestVideoRevision } from "../api/review-pending.api";
import ContractActionOverlay from "../ContractActionOverlay";

export interface RequestRevisionModalProps {
    visible: boolean;
    onClose: () => void;
    contractId: string;
    onSuccess: () => void;
}

const RequestRevisionModal: React.FC<RequestRevisionModalProps> = ({
    visible,
    onClose,
    contractId,
    onSuccess,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSend = async () => {
        if (!notes.trim()) {
            Toaster.error("Please enter revision notes");
            return;
        }
        setSubmitting(true);
        try {
            await requestVideoRevision({
                contractId,
                notes: notes.trim(),
            });
            Toaster.success("Revision request sent");
            onSuccess();
            setNotes("");
            onClose();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(
                message ? `Failed to send revision request: ${message}` : "Failed to send revision request"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setNotes("");
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
                    <Text style={styles.title}>Request Revision</Text>
                    <Pressable onPress={handleClose} hitSlop={12}>
                        <FontAwesomeIcon icon={faClose} color={colors.primary} size={22} />
                    </Pressable>
                </View>
                <Text style={styles.label}>Revision notes for the influencer</Text>
                <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Describe what changes you need..."
                    multiline
                    numberOfLines={6}
                    style={styles.input}
                />
                <View style={styles.actions}>
                    <Button mode="outlined" style={styles.button} onPress={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        mode="contained"
                        style={styles.button}
                        onPress={handleSend}
                        disabled={submitting}
                        loading={submitting}
                    >
                        Send Request
                    </Button>
                </View>
            </Pressable>
        </KeyboardAvoidingView>
    );

    return (
        <ContractActionOverlay
            visible={visible}
            onClose={handleClose}
            mode="modal"
        >
            <View style={styles.modalContainer}>{modalContent}</View>
        </ContractActionOverlay>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        modalContainer: {
            flex: 1,
            width: "100%",
            backgroundColor: colors.background,
            padding: 24,
            paddingTop: 16,
            overflow: "hidden",
        },
        keyboardView: { flex: 1, width: "100%" },
        modalInner: { flex: 1, width: "100%" },
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
        label: {
            fontSize: 14,
            color: colors.textSecondary ?? colors.text,
            marginBottom: 8,
        },
        input: {
            marginBottom: 16,
            minHeight: 140,
        },
        actions: {
            flexDirection: "row",
            gap: 12,
            marginTop: 20,
        },
        button: { flex: 1 },
    });
}

export default RequestRevisionModal;
