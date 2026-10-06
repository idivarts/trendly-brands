/**
 * ScriptModal — the script & timeline editor for reel/video content.
 *
 * A shot-by-shot script is a long-form production document; it was previously
 * authored in a collapsible card wedged into the page column above the caption,
 * which gave an OPTIONAL field premium placement and very little room. Here it
 * gets a wide surface, opened on demand from the handoff card.
 *
 * Closing is not a cancel. The editor writes the page's live `script` state
 * directly, so the page's existing Save and unsaved-changes guard remain the
 * single source of truth — a modal-local draft would mean two competing notions
 * of "unsaved".
 */
import { fs, lh } from "@/constants/Typography";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { faFilm, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import ScriptEditorBody, { ScriptEditorBodyProps } from "./ScriptEditorBody";

interface Props extends ScriptEditorBodyProps {
    visible: boolean;
    onClose: () => void;
}

const ScriptModal: React.FC<Props> = ({ visible, onClose, ...body }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors, xl);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close the script editor"
                />
                <View style={styles.sheet} accessibilityViewIsModal>
                    <View style={styles.header}>
                        <View style={styles.headIcon}>
                            <FontAwesomeIcon icon={faFilm} size={14} color={colors.primary} />
                        </View>
                        <View style={styles.headText}>
                            <Text style={styles.title}>Script &amp; timeline</Text>
                            <Text style={styles.subtitle}>
                                Shot by shot. Ask the AI to draft it, then edit freely.
                            </Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            hitSlop={8}
                        >
                            <FontAwesomeIcon icon={faXmark} size={15} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <View style={styles.body}>
                        <ScriptEditorBody {...body} fill />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footNote}>
                            Changes are kept with the content — save the content to store them.
                        </Text>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Done editing the script"
                        >
                            <Text style={styles.doneBtnText}>Done</Text>
                        </Pressable>
                    </View>
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
            // Wider than the page column it replaces — the whole point of the
            // move is room to write.
            maxWidth: 760,
            maxHeight: xl ? "90%" : "94%",
            height: xl ? undefined : "94%",
            backgroundColor: colors.card,
            borderRadius: xl ? 18 : 20,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.18,
            elevation: 14,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 16,
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        headIcon: {
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.aliceBlue,
        },
        headText: {
            flex: 1,
            gap: 2,
        },
        title: {
            fontSize: fs(15),
            fontWeight: "800",
            color: colors.text,
        },
        subtitle: {
            fontSize: fs(12),
            lineHeight: lh(17),
            color: colors.textSecondary,
        },
        closeBtn: {
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        body: {
            flex: 1,
            paddingHorizontal: 16,
            // The editor body adds its own top margin.
            paddingBottom: 4,
        },
        footer: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Platform.OS === "ios" ? 24 : 16,
        },
        footNote: {
            flex: 1,
            fontSize: fs(11),
            lineHeight: lh(16),
            color: colors.textSecondary,
        },
        doneBtn: {
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        doneBtnText: {
            fontSize: fs(13),
            fontWeight: "800",
            color: colors.onPrimary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default ScriptModal;
