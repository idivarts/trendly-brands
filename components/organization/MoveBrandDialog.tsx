import { Text } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Checkbox } from "react-native-paper";

interface OrgTarget {
    id: string;
    name: string;
}

interface MoveBrandDialogProps {
    visible: boolean;
    brandName: string;
    /** Organizations the brand can be moved to (orgs the user owns, excluding current). */
    targets: OrgTarget[];
    loading?: boolean;
    onCancel: () => void;
    onConfirm: (destOrgId: string) => void;
}

/**
 * Moving a brand is a high-stakes action, so it's a deliberate modal: pick one
 * destination organization AND tick an acknowledgment before the action enables.
 */
const MoveBrandDialog: React.FC<MoveBrandDialogProps> = ({
    visible,
    brandName,
    targets,
    loading,
    onCancel,
    onConfirm,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [acknowledged, setAcknowledged] = useState(false);

    useEffect(() => {
        if (!visible) {
            setSelectedId(null);
            setAcknowledged(false);
        }
    }, [visible]);

    const canConfirm = !loading && !!selectedId && acknowledged;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.backdrop}>
                <View style={styles.dialog}>
                    <Text style={styles.title}>Move “{brandName?.trim() || "Untitled brand"}”</Text>
                    <Text style={styles.body}>
                        Choose the organization to move this brand into. The brand and all its
                        data move with it, and it will follow the destination organization's
                        plan, billing, and limits.
                    </Text>

                    <Text style={styles.sectionLabel}>Destination organization</Text>
                    <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
                        {targets.length === 0 ? (
                            <Text style={styles.empty}>
                                You don't own another organization to move this brand to.
                            </Text>
                        ) : (
                            targets.map((o) => {
                                const selected = o.id === selectedId;
                                return (
                                    <Pressable
                                        key={o.id}
                                        style={[styles.row, selected && styles.rowSelected]}
                                        onPress={() => setSelectedId(o.id)}
                                    >
                                        <Checkbox
                                            status={selected ? "checked" : "unchecked"}
                                            onPress={() => setSelectedId(o.id)}
                                            color={colors.primary}
                                        />
                                        <Text
                                            style={[styles.rowText, selected && styles.rowTextSelected]}
                                            numberOfLines={1}
                                        >
                                            {o.name?.trim() || "Untitled organization"}
                                        </Text>
                                    </Pressable>
                                );
                            })
                        )}
                    </ScrollView>

                    <Pressable
                        style={styles.ackRow}
                        onPress={() => setAcknowledged((v) => !v)}
                    >
                        <Checkbox
                            status={acknowledged ? "checked" : "unchecked"}
                            onPress={() => setAcknowledged((v) => !v)}
                            color={colors.primary}
                        />
                        <Text style={styles.ackText}>
                            I understand this moves the brand to the selected organization and
                            changes its plan & billing context.
                        </Text>
                    </Pressable>

                    <View style={styles.actions}>
                        <Button mode="text" onPress={onCancel} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => selectedId && onConfirm(selectedId)}
                            disabled={!canConfirm}
                            loading={loading}
                        >
                            Move brand
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
        sectionLabel: {
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: colors.textSecondary,
            marginTop: 4,
        },
        list: {
            maxHeight: 220,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingVertical: 4,
            paddingRight: 8,
            borderRadius: 10,
        },
        rowSelected: {
            backgroundColor: colors.tag,
        },
        rowText: {
            flex: 1,
            fontSize: 15,
            color: colors.text,
        },
        rowTextSelected: {
            fontWeight: "600",
        },
        empty: {
            fontSize: 14,
            color: colors.textSecondary,
            paddingVertical: 8,
        },
        ackRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 4,
        },
        ackText: {
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

export default MoveBrandDialog;
