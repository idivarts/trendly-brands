import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { faBolt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

// ─── PublishNowConfirmModal ───────────────────────────────────────────────────
// Guards the irreversible "Publish now" action. Publishing posts live to the
// selected social accounts immediately and can't be undone, so we make the user
// confirm before firing instead of letting a single tap go straight out.

export interface PublishNowConfirmModalProps {
    visible: boolean;
    /** How many accounts the post will go out to right now. */
    count: number;
    /** True while the publish request triggered by confirm is in flight. */
    publishing?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const PublishNowConfirmModal: React.FC<PublishNowConfirmModalProps> = ({
    visible,
    count,
    publishing = false,
    onConfirm,
    onCancel,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors, xl);

    const accountLabel = count === 1 ? "1 account" : `${count} accounts`;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.backdrop}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={publishing ? undefined : onCancel}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel publishing"
                />
                <View style={styles.sheet} accessibilityViewIsModal>
                    <View style={styles.headIcon}>
                        <FontAwesomeIcon icon={faBolt} size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.title}>Publish now?</Text>
                    <Text style={styles.subtitle}>
                        This posts to {accountLabel} immediately. Once it&apos;s live you can&apos;t
                        undo it from Trendly.
                    </Text>

                    <Pressable
                        style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
                        onPress={onConfirm}
                        disabled={publishing}
                        accessibilityRole="button"
                        accessibilityLabel="Publish now"
                    >
                        {publishing ? (
                            <ActivityIndicator size="small" color={colors.onPrimary} />
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faBolt} size={14} color={colors.onPrimary} />
                                <Text style={styles.confirmBtnText}>Publish now</Text>
                            </>
                        )}
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                        onPress={onCancel}
                        disabled={publishing}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel"
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
        confirmBtn: {
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: 12,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        confirmBtnText: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        cancelBtn: {
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
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

export default PublishNowConfirmModal;
