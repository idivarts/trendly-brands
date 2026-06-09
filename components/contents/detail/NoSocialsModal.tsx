import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { faShareNodes, faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

// ─── NoSocialsModal ───────────────────────────────────────────────────────────
// Shown when the user taps Publish but the brand has no connected social
// accounts. Blocks the publish flow and routes them to Connected Accounts.

export interface NoSocialsModalProps {
    visible: boolean;
    onClose: () => void;
    onConnect: () => void;
}

const NoSocialsModal: React.FC<NoSocialsModalProps> = ({ visible, onClose, onConnect }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss"
                />
                <View style={styles.sheet} accessibilityViewIsModal>
                    <View style={styles.header}>
                        <View style={styles.headIcon}>
                            <FontAwesomeIcon icon={faTriangleExclamation} size={15} color={colors.primary} />
                        </View>
                        <View style={styles.headText}>
                            <Text style={styles.title}>No socials connected yet</Text>
                            <Text style={styles.subtitle}>
                                Connect a social account before you can publish or schedule this post.
                            </Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            hitSlop={8}
                        >
                            <FontAwesomeIcon icon={faXmark} size={16} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <View style={styles.footer}>
                        <Pressable
                            style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
                            onPress={onClose}
                            accessibilityRole="button"
                            accessibilityLabel="Cancel"
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.connectBtn, pressed && styles.btnPressed]}
                            onPress={onConnect}
                            accessibilityRole="button"
                            accessibilityLabel="Connect socials"
                        >
                            <FontAwesomeIcon icon={faShareNodes} size={13} color={colors.onPrimary} />
                            <Text style={styles.connectBtnText}>Connect Socials</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: colors.backdrop,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                },
                sheet: {
                    width: "100%",
                    maxWidth: 440,
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 12 },
                    shadowRadius: 32,
                    shadowOpacity: 0.18,
                    elevation: 12,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 18,
                },
                headIcon: {
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                headText: {
                    flex: 1,
                    gap: 4,
                },
                title: {
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                },
                subtitle: {
                    fontSize: 13,
                    lineHeight: 19,
                    color: colors.textSecondary,
                },
                closeBtn: {
                    padding: 4,
                },
                pressed: {
                    opacity: 0.6,
                },
                footer: {
                    flexDirection: "row",
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingBottom: 16,
                    paddingTop: 4,
                },
                cancelBtn: {
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: colors.tag,
                },
                cancelBtnText: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                connectBtn: {
                    flex: 2,
                    flexDirection: "row",
                    gap: 8,
                    paddingVertical: 13,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                connectBtnText: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                btnPressed: {
                    opacity: 0.72,
                },
            }),
        [colors, xl]
    );
}

export default NoSocialsModal;
