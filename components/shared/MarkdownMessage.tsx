import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Linking } from "react-native";
// react-native-markdown-package ships no type declarations.
// @ts-ignore
import Markdown from "react-native-markdown-package";

interface MarkdownMessageProps {
    content: string;
    /** Slightly smaller type in compact (mobile / contained) layouts. */
    compact?: boolean;
    /** Base text colour (defaults to the theme's primary text colour). */
    color?: string;
}

/**
 * Renders AI message text as markdown (bold, italics, lists, code, links,
 * headings) using the same renderer stream-chat-expo already relies on, themed
 * to the app palette. User-typed messages should stay plain <Text>.
 */
const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, compact, color }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const textColor = color ?? colors.text;
    const styles = useMemo(
        () => markdownStyles(colors, textColor, !!compact),
        [colors, textColor, compact]
    );

    return (
        <Markdown
            styles={styles}
            onLink={(url: string) => Linking.openURL(url).catch(() => { })}
        >
            {content}
        </Markdown>
    );
};

export default MarkdownMessage;

function markdownStyles(
    colors: ReturnType<typeof Colors>,
    textColor: string,
    compact: boolean
) {
    const fontSize = compact ? 13 : 14;
    const lineHeight = compact ? 19 : 21;
    const base = { color: textColor, fontSize, lineHeight };
    // Plain object (the library merges these per node type). Unknown keys are
    // ignored, so we cover the common keys across renderer versions.
    return {
        view: { width: "100%" },
        text: base,
        paragraph: { ...base, marginTop: 0, marginBottom: 6 },
        para: { ...base, marginTop: 0, marginBottom: 6 },
        strong: { fontWeight: "700" as const, color: textColor },
        em: { fontStyle: "italic" as const, color: textColor },
        del: { textDecorationLine: "line-through" as const, color: textColor },
        link: { color: colors.primary, textDecorationLine: "underline" as const },
        autolink: { color: colors.primary, textDecorationLine: "underline" as const },
        mailTo: { color: colors.primary },
        heading1: { ...base, fontSize: fontSize + 6, fontWeight: "700" as const, marginTop: 4, marginBottom: 6 },
        heading2: { ...base, fontSize: fontSize + 4, fontWeight: "700" as const, marginTop: 4, marginBottom: 6 },
        heading3: { ...base, fontSize: fontSize + 2, fontWeight: "700" as const, marginTop: 4, marginBottom: 4 },
        inlineCode: {
            fontFamily: "monospace",
            backgroundColor: colors.tag,
            color: textColor,
            borderRadius: 4,
            paddingHorizontal: 4,
        },
        codeBlock: {
            fontFamily: "monospace",
            backgroundColor: colors.tag,
            color: textColor,
            borderRadius: 8,
            padding: 10,
            marginVertical: 4,
            fontSize: fontSize - 1,
        },
        list: { marginVertical: 2 },
        listItem: { ...base, flexDirection: "row" as const },
        listItemText: base,
        listItemNumber: { ...base, fontWeight: "700" as const },
        listItemBullet: base,
        blockQuoteText: { ...base, color: colors.textSecondary, fontStyle: "italic" as const },
        tableHeaderCell: { ...base, fontWeight: "700" as const },
        tableCell: base,
    };
}
