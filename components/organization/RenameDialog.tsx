import { Text } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";

interface RenameDialogProps {
    visible: boolean;
    title?: string;
    label?: string;
    initialName: string;
    loading?: boolean;
    onCancel: () => void;
    onConfirm: (name: string) => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
    visible,
    title = "Rename organization",
    label = "Organization name",
    initialName,
    loading,
    onCancel,
    onConfirm,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const [name, setName] = useState(initialName);

    useEffect(() => {
        if (visible) setName(initialName);
    }, [visible, initialName]);

    const trimmed = name.trim();
    const canSave = !loading && !!trimmed && trimmed !== initialName.trim();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.backdrop}>
                <View style={styles.dialog}>
                    <Text style={styles.title}>{title}</Text>
                    <TextInput
                        label={label}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                        disabled={loading}
                        onSubmitEditing={() => canSave && onConfirm(trimmed)}
                    />
                    <View style={styles.actions}>
                        <Button mode="text" onPress={onCancel} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => onConfirm(trimmed)}
                            disabled={!canSave}
                            loading={loading}
                        >
                            Save
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
        actions: {
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
        },
    });

export default RenameDialog;
