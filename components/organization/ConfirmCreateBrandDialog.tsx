import { Text } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";

interface ConfirmCreateBrandDialogProps {
    visible: boolean;
    /** Organization the new brand will be created under (for the copy). */
    organizationName?: string;
    loading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/**
 * Non-destructive confirmation shown before starting brand creation. Replaces
 * the old name-input modal: we no longer collect the name here — confirming
 * routes straight into the onboarding flow, which captures the name and the
 * rest of the brand profile. Mirrors ConfirmDeleteDialog's layout but uses the
 * primary (non-destructive) action styling.
 */
const ConfirmCreateBrandDialog: React.FC<ConfirmCreateBrandDialogProps> = ({
    visible,
    organizationName,
    loading,
    onCancel,
    onConfirm,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.backdrop}>
                <View style={styles.dialog}>
                    <Text style={styles.title}>Create a new brand?</Text>
                    <Text style={styles.body}>
                        This will start onboarding for a new brand
                        {organizationName ? ` in ${organizationName}` : ""} and use one of your
                        total brand / workspace credits.
                    </Text>
                    <View style={styles.actions}>
                        <Button mode="text" onPress={onCancel} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={onConfirm}
                            disabled={loading}
                            loading={loading}
                        >
                            Create Brand
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
        body: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        actions: {
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
        },
    });

export default ConfirmCreateBrandDialog;
