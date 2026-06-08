import { Text } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";

interface ConfirmDeleteDialogProps {
    visible: boolean;
    title: string;
    warning: string;
    /** When set, the user must type this exact string before confirming. */
    confirmWord?: string;
    confirmLabel?: string;
    loading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/**
 * One destructive-confirmation pattern for the whole org surface — used for both
 * "delete brand" and "delete organization" so the experience is identical.
 * Pass `confirmWord` to require type-to-confirm (irreversible actions); omit it
 * for a plain confirm.
 */
const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
    visible,
    title,
    warning,
    confirmWord,
    confirmLabel = "Delete forever",
    loading,
    onCancel,
    onConfirm,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const [typed, setTyped] = useState("");

    useEffect(() => {
        if (!visible) setTyped("");
    }, [visible]);

    const canConfirm = !loading && (!confirmWord || typed === confirmWord);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.backdrop}>
                <View style={styles.dialog}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.warning}>{warning}</Text>
                    {!!confirmWord && (
                        <>
                            <Text style={styles.instruction}>
                                Type <Text style={styles.word}>{confirmWord}</Text> to confirm.
                            </Text>
                            <TextInput
                                value={typed}
                                onChangeText={setTyped}
                                placeholder={confirmWord}
                                autoCapitalize="none"
                                autoCorrect={false}
                                disabled={loading}
                                dense
                            />
                        </>
                    )}
                    <View style={styles.actions}>
                        <Button mode="text" onPress={onCancel} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            buttonColor={colors.red}
                            onPress={onConfirm}
                            disabled={!canConfirm}
                            loading={loading}
                        >
                            {confirmLabel}
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        backdrop: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.backdrop,
            padding: 20,
        },
        dialog: {
            width: "100%",
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 24,
            gap: 12,
            ...(Platform.OS === "web" && { maxWidth: 460 }),
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
        warning: {
            fontSize: 14,
            color: colors.red,
            lineHeight: 20,
        },
        instruction: {
            fontSize: 14,
            color: colors.text,
            marginTop: 4,
        },
        word: {
            fontWeight: "700",
        },
        actions: {
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
        },
    });

export default ConfirmDeleteDialog;
