import { Text } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { Checkbox } from "react-native-paper";

interface ConfirmRemoveMemberDialogProps {
    visible: boolean;
    /** Name/email of the member being removed — shown in the title + warning. */
    memberName: string;
    loading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/**
 * Hard-confirmation for removing an organization member. Removal strips the
 * member from EVERY brand in the org, so confirmation is gated behind an
 * explicit acknowledgement checkbox (not a one-tap delete).
 */
const ConfirmRemoveMemberDialog: React.FC<ConfirmRemoveMemberDialogProps> = ({
    visible,
    memberName,
    loading,
    onCancel,
    onConfirm,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const [acknowledged, setAcknowledged] = useState(false);

    useEffect(() => {
        if (!visible) setAcknowledged(false);
    }, [visible]);

    const canConfirm = !loading && acknowledged;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.backdrop}>
                <View style={styles.dialog}>
                    <Text style={styles.title}>Remove {memberName}?</Text>
                    <Text style={styles.warning}>
                        This removes {memberName} from the organization and from{" "}
                        <Text style={styles.bold}>every brand</Text> they currently belong to.
                        They will immediately lose access to all of those brands. This cannot
                        be undone — you'd have to re-invite them from a brand's User Management
                        page.
                    </Text>

                    <Pressable
                        style={styles.ackRow}
                        onPress={() => setAcknowledged((a) => !a)}
                        disabled={loading}
                    >
                        <Checkbox
                            status={acknowledged ? "checked" : "unchecked"}
                            color={colors.red}
                            uncheckedColor={colors.text}
                            onPress={() => setAcknowledged((a) => !a)}
                            disabled={loading}
                        />
                        <Text style={styles.ackLabel}>
                            I understand this revokes their access to all brands in this
                            organization.
                        </Text>
                    </Pressable>

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
                            Remove member
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
        bold: {
            fontWeight: "700",
        },
        ackRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
        },
        ackLabel: {
            flex: 1,
            fontSize: 13,
            color: colors.text,
            lineHeight: 18,
        },
        actions: {
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
        },
    });

export default ConfirmRemoveMemberDialog;
