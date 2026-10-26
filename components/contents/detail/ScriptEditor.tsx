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
import { StyleSheet, Text, View } from "react-native";
import ScriptEditorBody, { ScriptEditorBodyProps } from "./ScriptEditorBody";
import SectionLabel from "./SectionLabel";

interface ScriptEditorProps extends ScriptEditorBodyProps {
    title: string;
    subtitle: string;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ title, subtitle, ...body }) => {
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
        cardSub: {
            fontSize: fs(13),
            lineHeight: lh(19),
            color: colors.textSecondary,
        },
    });
}

export default ScriptEditor;
