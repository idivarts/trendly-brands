/**
 * ScriptEditor — the inline script card, used by `live` content only.
 *
 * A live session has no media: the script IS the content, so it stays on the
 * page, always open. Reel and video treat the script as an optional production
 * document and give it its own section on the Overview tab, which keeps
 * an optional field from occupying the space above the caption.
 */
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScriptEditorBody, { ScriptEditorBodyProps } from "./ScriptEditorBody";
import SectionLabel from "./SectionLabel";

interface ScriptEditorProps extends ScriptEditorBodyProps {
    title: string;
    subtitle: string;
    /**
     * The AI rewrote the script while the user had unsaved edits of their own,
     * so it was not applied. Offer it rather than choosing for them — a
     * background write must never discard what someone is mid-sentence on.
     */
    aiScriptPending?: boolean;
    onAcceptAiScript?: () => void;
    onDismissAiScript?: () => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({
    title,
    subtitle,
    aiScriptPending,
    onAcceptAiScript,
    onDismissAiScript,
    ...body
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    return (
        <>
            {/* Names a region, like VIDEO and CAPTION around it — so it is a
                section label above the card, not a bold title inside it. The
                subtitle stays in the card as its opening line. */}
            <SectionLabel>{title.toUpperCase()}</SectionLabel>
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.cardSub}>{subtitle}</Text>
                </View>
                {aiScriptPending ? (
                    <View style={styles.aiNotice}>
                        <View style={styles.aiNoticeAccent} />
                        <Text style={styles.aiNoticeText}>
                            The AI rewrote this script, but you have unsaved changes — so
                            yours are still here.
                        </Text>
                        <Pressable
                            onPress={onAcceptAiScript}
                            style={({ pressed }) => [styles.aiNoticeBtn, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Use the AI's version of the script"
                            hitSlop={6}
                        >
                            <Text style={styles.aiNoticeBtnText}>Use theirs</Text>
                        </Pressable>
                        <Pressable
                            onPress={onDismissAiScript}
                            style={({ pressed }) => [styles.aiNoticeBtn, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Keep my version of the script"
                            hitSlop={6}
                        >
                            <Text style={styles.aiNoticeDismissText}>Keep mine</Text>
                        </Pressable>
                    </View>
                ) : null}
                <ScriptEditorBody {...body} />
            </View>
        </>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        card: {
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        header: {
            gap: 4,
        },
        pressed: { opacity: 0.75 },
        aiNotice: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: colors.tag,
            paddingRight: 8,
            paddingVertical: 8,
        },
        aiNoticeAccent: { width: 4, alignSelf: "stretch", backgroundColor: colors.primary },
        aiNoticeText: {
            flex: 1,
            fontSize: fs(12),
            lineHeight: lh(17),
            color: colors.text,
            paddingLeft: 2,
        },
        aiNoticeBtn: { minHeight: 32, justifyContent: "center", paddingHorizontal: 8 },
        aiNoticeBtnText: { fontSize: fs(12), fontWeight: "700", color: colors.primary },
        aiNoticeDismissText: { fontSize: fs(12), fontWeight: "600", color: colors.textSecondary },
        cardSub: {
            fontSize: fs(13),
            lineHeight: lh(19),
            color: colors.textSecondary,
        },
    });
}

export default ScriptEditor;
