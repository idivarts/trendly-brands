import { fs, lh } from "@/constants/Typography";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

/**
 * BriefEditModal — edit the content's title and idea.
 *
 * Deliberately NOT the dialog that was just removed. That one held six things
 * and was the only way to reach any of them, so the brief was invisible. This
 * holds two, is reached from the brief itself, and exists for a different
 * reason: title and idea are prose you READ far more often than you change,
 * and two always-live inputs at the top of the card made the brief look like a
 * form to fill in rather than something to consult.
 *
 * Status and platforms stay directly editable on the card. They are settings,
 * not prose — a pencil in front of a status chip would be a step for nothing.
 *
 * Closing is not a cancel. It writes the page's live state as you type, so the
 * page's own save and unsaved-changes guard stay the single source of truth —
 * the same rule the script editor follows.
 */
interface Props {
    visible: boolean;
    title: string;
    idea: string;
    onChangeTitle: (v: string) => void;
    onChangeIdea: (v: string) => void;
    onClose: () => void;
}

const BriefEditModal: React.FC<Props> = ({
    visible,
    title,
    idea,
    onChangeTitle,
    onChangeIdea,
    onClose,
}) => {
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
                    accessibilityLabel="Close"
                />
                <View style={styles.sheet} accessibilityViewIsModal>
                    <View style={styles.header}>
                        <Text style={styles.heading}>Title & idea</Text>
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

                    <Text style={styles.label} nativeID="be-title">Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="E.g. Founder Story Launch Reel"
                        placeholderTextColor={colors.textSecondary}
                        value={title}
                        onChangeText={onChangeTitle}
                        maxLength={120}
                        accessibilityLabel="Title"
                        aria-labelledby="be-title"
                        autoFocus={xl}
                    />

                    <Text style={[styles.label, styles.mt16]} nativeID="be-idea">Idea / Vision</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe the concept, mood, or key message…"
                        placeholderTextColor={colors.textSecondary}
                        value={idea}
                        onChangeText={onChangeIdea}
                        multiline
                        maxLength={500}
                        textAlignVertical="top"
                        accessibilityLabel="Idea or vision"
                        aria-labelledby="be-idea"
                    />

                    <Pressable
                        style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel="Done"
                    >
                        <Text style={styles.doneText}>Done</Text>
                    </Pressable>
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
                    justifyContent: xl ? "center" : "flex-end",
                    padding: xl ? 20 : 0,
                },
                sheet: {
                    width: "100%",
                    maxWidth: 460,
                    backgroundColor: colors.card,
                    borderRadius: xl ? 18 : 20,
                    padding: xl ? 20 : 18,
                    paddingBottom: xl ? 20 : 28,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                },
                heading: {
                    fontSize: fs(16),
                    lineHeight: lh(22),
                    fontWeight: "700",
                    color: colors.text,
                },
                closeBtn: {
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                label: {
                    fontSize: fs(11),
                    fontWeight: "700",
                    letterSpacing: 1.1,
                    color: colors.textSecondary,
                    marginBottom: 8,
                },
                mt16: {
                    marginTop: 16,
                },
                input: {
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: fs(14),
                    lineHeight: lh(20),
                    color: colors.text,
                },
                textArea: {
                    minHeight: 110,
                },
                doneBtn: {
                    marginTop: 20,
                    paddingVertical: 13,
                    borderRadius: 11,
                    alignItems: "center",
                    backgroundColor: colors.primary,
                },
                doneText: {
                    fontSize: fs(14),
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                pressed: {
                    opacity: 0.72,
                },
            }),
        [colors, xl]
    );
}

export default BriefEditModal;
