/**
 * InspectorPanel — the studio's left column: properties of whatever is selected.
 *
 * This is what turns a canvas into a studio. Until now the only way to change a
 * design was to tap an element and work in a floating toolbar anchored over it
 * — fine for a two-word headline, cramped for anything longer, and it covers
 * the thing you are editing. A docked pane gives the text room, keeps the
 * canvas unobstructed, and has somewhere to put the properties that have
 * nowhere to live on a toolbar.
 *
 * Desktop only, by design. On a phone the canvas needs the whole screen, the
 * floating toolbar is the right affordance for touch, and a third column would
 * leave every one of them too narrow to use.
 *
 * It edits through the SAME frame bridge the toolbar used (`setText`), so there
 * is still exactly one path from a text change to the document. Two ways to
 * write the same field is how a preview and its export drift apart.
 */
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import {
    faComment,
    faWandMagicSparkles,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export interface InspectorSelection {
    id: string;
    text: string;
    editable: boolean;
}

interface Props {
    selection: InspectorSelection | null;
    /** 0-based index of the slide/scene on screen, and how many there are. */
    slide: number;
    slideCount: number;
    isVideo: boolean;
    readOnly?: boolean;
    /** Write the text back through the frame bridge. */
    onSetText: (id: string, text: string) => void;
    /** Hand this element to the AI chat as a focus. */
    onAskAI: () => void;
    /** Pin a comment on this element. */
    onComment: () => void;
    onDeselect: () => void;
}

const InspectorPanel: React.FC<Props> = ({
    selection,
    slide,
    slideCount,
    isVideo,
    readOnly = false,
    onSetText,
    onAskAI,
    onComment,
    onDeselect,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const [draft, setDraft] = useState("");
    // Re-seed whenever the selection changes — including a re-tap of the SAME
    // element, which has to discard an abandoned draft rather than resurrect it.
    useEffect(() => {
        setDraft(selection?.text ?? "");
    }, [selection?.id, selection?.text]);

    const dirty = !!selection && draft !== selection.text;

    const unit = isVideo ? "Scene" : "Slide";
    const where = slideCount > 1 ? `${unit} ${slide + 1} of ${slideCount}` : null;

    return (
        <View style={styles.panel}>
            <View style={styles.header}>
                <Text style={styles.title}>Inspector</Text>
                {selection ? (
                    <Pressable
                        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                        onPress={onDeselect}
                        accessibilityRole="button"
                        accessibilityLabel="Clear selection"
                    >
                        <FontAwesomeIcon icon={faXmark} size={12} color={colors.textSecondary} />
                    </Pressable>
                ) : null}
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                {where ? <Text style={styles.where}>{where}</Text> : null}

                {!selection ? (
                    <Text style={styles.empty}>
                        Tap anything on the canvas to edit it here.
                    </Text>
                ) : (
                    <>
                        <Text style={styles.label}>Element</Text>
                        <Text style={styles.elementId} numberOfLines={1}>
                            {selection.id}
                        </Text>

                        {selection.editable ? (
                            <>
                                <Text style={styles.label}>Text</Text>
                                <TextInput
                                    style={styles.input}
                                    value={draft}
                                    onChangeText={setDraft}
                                    multiline
                                    editable={!readOnly}
                                    accessibilityLabel="Element text"
                                />
                                <View style={styles.row}>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.primaryBtn,
                                            !dirty && styles.btnDisabled,
                                            pressed && styles.pressed,
                                        ]}
                                        onPress={() => selection && onSetText(selection.id, draft)}
                                        disabled={!dirty || readOnly}
                                        accessibilityRole="button"
                                        accessibilityLabel="Apply text change"
                                    >
                                        <Text style={styles.primaryBtnText}>Apply</Text>
                                    </Pressable>
                                    {dirty ? (
                                        <Pressable
                                            style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
                                            onPress={() => setDraft(selection.text)}
                                            accessibilityRole="button"
                                            accessibilityLabel="Discard text change"
                                        >
                                            <Text style={styles.ghostBtnText}>Reset</Text>
                                        </Pressable>
                                    ) : null}
                                </View>
                            </>
                        ) : (
                            // An image, a shape, a container. There is nothing to
                            // type, but it is still the thing the user picked —
                            // so the AI and comment actions stay, pointed at it.
                            <Text style={styles.note}>
                                This element has no editable text. Ask the AI to change it, or
                                pin a comment for a teammate.
                            </Text>
                        )}

                        {!readOnly ? (
                            <View style={styles.actions}>
                                <Pressable
                                    style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
                                    onPress={onAskAI}
                                    accessibilityRole="button"
                                    accessibilityLabel="Edit this element with AI"
                                >
                                    <FontAwesomeIcon
                                        icon={faWandMagicSparkles}
                                        size={12}
                                        color={colors.primary}
                                    />
                                    <Text style={styles.actionText}>Edit with AI</Text>
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
                                    onPress={onComment}
                                    accessibilityRole="button"
                                    accessibilityLabel="Comment on this element"
                                >
                                    <FontAwesomeIcon
                                        icon={faComment}
                                        size={12}
                                        color={colors.textSecondary}
                                    />
                                    <Text style={styles.actionTextMuted}>Comment</Text>
                                </Pressable>
                            </View>
                        ) : null}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const useStyles = (colors: any) =>
    React.useMemo(
        () =>
            StyleSheet.create({
                panel: {
                    width: 248,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 4, height: 0 },
                    shadowRadius: 16,
                    shadowOpacity: 0.07,
                    elevation: 8,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                },
                title: {
                    flex: 1,
                    fontSize: fs(12.5),
                    lineHeight: lh(17),
                    fontWeight: "700",
                    color: colors.text,
                },
                iconBtn: {
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                },
                body: {
                    flex: 1,
                },
                bodyContent: {
                    paddingHorizontal: 12,
                    paddingBottom: 16,
                    gap: 6,
                },
                where: {
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 4,
                },
                empty: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.textSecondary,
                    marginTop: 6,
                },
                label: {
                    fontSize: fs(10),
                    lineHeight: lh(13),
                    fontWeight: "700",
                    letterSpacing: 0.7,
                    textTransform: "uppercase",
                    color: colors.textSecondary,
                    marginTop: 8,
                },
                elementId: {
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    color: colors.text,
                },
                input: {
                    minHeight: 84,
                    backgroundColor: colors.tag,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    fontSize: fs(13),
                    lineHeight: lh(18),
                    color: colors.text,
                    textAlignVertical: "top",
                },
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 8,
                },
                primaryBtn: {
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                },
                primaryBtnText: {
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                btnDisabled: {
                    opacity: 0.4,
                },
                ghostBtn: {
                    paddingVertical: 7,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                ghostBtnText: {
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                note: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.textSecondary,
                    marginTop: 4,
                },
                actions: {
                    gap: 6,
                    marginTop: 14,
                },
                actionBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 11,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                actionText: {
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    fontWeight: "600",
                    color: colors.primary,
                },
                actionTextMuted: {
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                pressed: {
                    opacity: 0.75,
                },
            }),
        [colors]
    );

export default InspectorPanel;
