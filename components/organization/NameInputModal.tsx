import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Modal, Portal } from "react-native-paper";

interface NameInputModalProps {
    visible: boolean;
    title: string;
    subtitle?: string;
    label: string;
    submitLabel: string;
    /** Controlled by the parent while the create/add request is in flight. */
    loading?: boolean;
    onSubmit: (name: string) => void;
    onClose: () => void;
}

/**
 * Shared "name + action" creation modal used for BOTH "Create organization" and
 * "Add brand", so the two flows look and behave identically. Replaces the inline
 * NameInputRow: the trigger now lives as a button (header action / section
 * action) and the form opens in a focused modal. The modal owns its input;
 * the parent owns the async submit + loading state and closes on success.
 */
const NameInputModal: React.FC<NameInputModalProps> = ({
    visible,
    title,
    subtitle,
    label,
    submitLabel,
    loading,
    onSubmit,
    onClose,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const [value, setValue] = useState("");

    // Reset the field whenever the modal closes so it opens fresh next time.
    useEffect(() => {
        if (!visible) setValue("");
    }, [visible]);

    const trimmed = value.trim();
    const handleSubmit = () => {
        if (!trimmed || loading) return;
        onSubmit(trimmed);
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onClose} style={styles.root}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <View style={styles.card}>
                        <Text style={styles.title}>{title}</Text>
                        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                        <TextInput
                            label={label}
                            value={value}
                            onChangeText={setValue}
                            onSubmitEditing={handleSubmit}
                            disabled={loading}
                            autoFocus
                            dense
                            style={styles.input}
                        />
                        <View
                            style={styles.actions}
                            lightColor="transparent"
                            darkColor="transparent"
                        >
                            <Button mode="text" onPress={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSubmit}
                                loading={loading}
                                disabled={!trimmed || loading}
                            >
                                {submitLabel}
                            </Button>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </Portal>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        root: {
            justifyContent: "center",
            alignItems: "center",
        },
        card: {
            width: 380,
            maxWidth: "92%",
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 24,
            gap: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 24,
            shadowOpacity: 0.18,
            elevation: 12,
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        input: {
            backgroundColor: colors.background,
        },
        actions: {
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
        },
    });

export default NameInputModal;
