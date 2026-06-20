import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

// ─── UnsavedChangesModal ──────────────────────────────────────────────────────
// Shown when the user tries to leave the content detail view with unsaved edits.
// Offers three choices: Save & leave, Discard changes, or Cancel (stay).

export interface UnsavedChangesModalProps {
    visible: boolean;
    /** True while the save triggered by "Save & leave" is in flight. */
    saving?: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
    visible,
    saving = false,
    onSave,
    onDiscard,
    onCancel,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors, xl);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.backdrop}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={saving ? undefined : onCancel}
                    accessibilityRole="button"
                    accessibilityLabel="Keep editing"
                />
                <View style={styles.sheet} accessibilityViewIsModal>
                    <View style={styles.headIcon}>
                        <FontAwesomeIcon icon={faTriangleExclamation} size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.title}>Unsaved changes</Text>
                    <Text style={styles.subtitle}>
                        You have unsaved changes. Do you want to save them before leaving, or discard them?
                    </Text>

                    <Pressable
                        style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
                        onPress={onSave}
                        disabled={saving}
                        accessibilityRole="button"
                        accessibilityLabel="Save and leave"
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color={colors.onPrimary} />
                        ) : (
                            <Text style={styles.saveBtnText}>Save & leave</Text>
                        )}
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [styles.discardBtn, pressed && styles.pressed]}
                        onPress={onDiscard}
                        disabled={saving}
                        accessibilityRole="button"
                        accessibilityLabel="Discard changes and leave"
                    >
                        <Text style={styles.discardBtnText}>Discard changes</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                        onPress={onCancel}
                        disabled={saving}
                        accessibilityRole="button"
                        accessibilityLabel="Keep editing"
                    >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: colors.backdrop,
            alignItems: "center",
            justifyContent: xl ? "center" : "flex-end",
            padding: xl ? 20 : 0,
        },
        sheet: {
            width: "100%",
            maxWidth: 420,
            backgroundColor: colors.card,
            borderRadius: xl ? 18 : 20,
            padding: 22,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.18,
            elevation: 14,
        },
        headIcon: {
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.aliceBlue,
            marginBottom: 14,
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 6,
        },
        subtitle: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 19,
            marginBottom: 20,
        },
        saveBtn: {
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        saveBtnText: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        discardBtn: {
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            backgroundColor: colors.tag,
            marginTop: 10,
        },
        discardBtnText: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.toastError,
        },
        cancelBtn: {
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 4,
        },
        cancelBtnText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default UnsavedChangesModal;
