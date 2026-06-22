import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Linking, Text, View } from "react-native";
// react-native-markdown-package ships no type declarations.
// @ts-ignore
import Markdown from "react-native-markdown-package";

// Column-width tuning for the custom table rule below. Each column's flex
// weight is its longest cell's character count, clamped so a single huge cell
// can't swallow the row and a tiny one (e.g. "#") doesn't vanish.
const MIN_COL_WEIGHT = 4;
const MAX_COL_WEIGHT = 40;

/** Flatten a parsed simple-markdown content node to its plain text length. */
function nodeText(node: any): string {
    if (node == null) return "";
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(nodeText).join("");
    if (typeof node.content === "string") return node.content;
    if (Array.isArray(node.content)) return node.content.map(nodeText).join("");
    return "";
}

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
    const rules = useMemo(() => tableRule(styles), [styles]);

    return (
        <Markdown
            styles={styles}
            rules={rules}
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
        // Tables — the library defaults center cells (justifyContent:
        // "space-around") and never constrains cell width, so text overflows
        // instead of wrapping. Override to left-aligned, equal-width columns
        // (flex: 1) so long cell text wraps. Also theme the colours (the
        // library hardcodes a dark #222 header/border).
        table: {
            flex: 1,
            alignSelf: "stretch" as const,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            overflow: "hidden" as const,
            marginVertical: 6,
        },
        tableHeader: {
            flexDirection: "row" as const,
            justifyContent: "flex-start" as const,
            backgroundColor: colors.tag,
        },
        tableHeaderCell: {
            ...base,
            flex: 1,
            fontWeight: "700" as const,
            textAlign: "left" as const,
            padding: 8,
        },
        tableRow: {
            flexDirection: "row" as const,
            justifyContent: "flex-start" as const,
            borderTopWidth: 1,
            borderColor: colors.border,
        },
        tableRowCell: {
            flex: 1,
            padding: 8,
        },
    };
}

/**
 * Custom `table` rule for react-native-markdown-package. The library lays each
 * row out as an independent flex row, so the only way to get content-aware
 * column widths that still line up across rows is to give every cell in a
 * column the same flex weight. We derive that weight from the longest cell's
 * character count per column — wider content → wider column — with no manual
 * per-table tuning. Mirrors the library's default table rule otherwise.
 */
function tableRule(styles: ReturnType<typeof markdownStyles>) {
    return {
        table: {
            react(node: any, output: any, state: any) {
                const header: any[] = node.header ?? [];
                const cells: any[][] = node.cells ?? [];
                const colCount = header.length;

                const weights: number[] = [];
                for (let c = 0; c < colCount; c++) {
                    let len = nodeText(header[c]).length;
                    for (let r = 0; r < cells.length; r++) {
                        len = Math.max(len, nodeText(cells[r]?.[c]).length);
                    }
                    weights.push(Math.min(MAX_COL_WEIGHT, Math.max(MIN_COL_WEIGHT, len)));
                }

                const headerCells = header.map((content, c) =>
                    React.createElement(
                        Text,
                        { key: c, style: [styles.tableHeaderCell, { flex: weights[c] }] },
                        output(content, state)
                    )
                );
                const headerRow = React.createElement(
                    View,
                    { key: -1, style: styles.tableHeader },
                    headerCells
                );

                const bodyRows = cells.map((row, r) => {
                    const rowCells = row.map((content, c) =>
                        React.createElement(
                            View,
                            { key: c, style: [styles.tableRowCell, { flex: weights[c] }] },
                            output(content, state)
                        )
                    );
                    return React.createElement(View, { key: r, style: styles.tableRow }, rowCells);
                });

                return React.createElement(View, { key: state.key, style: styles.table }, [
                    headerRow,
                    ...bodyRows,
                ]);
            },
        },
    };
}
