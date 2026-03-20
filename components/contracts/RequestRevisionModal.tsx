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
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Modal as PaperModal } from "react-native-paper";
import { Text } from "../theme/Themed";
import Button from "../ui/button";
import TextInput from "../ui/text-input";

export interface RequestRevisionModalProps {
    visible: boolean;
    onClose: () => void;
    onSend: (revisionNotes: string) => Promise<void> | void;
}

const RequestRevisionModal: React.FC<RequestRevisionModalProps> = ({
    visible,
    onClose,
    onSend,
}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSend = async () => {
        if (!notes.trim()) {
            Toaster.error("Please enter revision notes");
            return;
        }
        setSubmitting(true);
        try {
            await onSend(notes.trim());
            setNotes("");
            onClose();
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
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TextInput
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Describe what changes you need..."
                        multiline
                        numberOfLines={4}
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
                        >
                            Send Request
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
                      maxWidth: 500,
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
        label: {
            fontSize: 14,
            color: colors.gray300,
            marginBottom: 8,
        },
        input: { marginBottom: 16 },
        actions: {
            flexDirection: "row",
            gap: 12,
            marginTop: 20,
        },
        button: { flex: 1 },
    });
}

export default RequestRevisionModal;
