import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, Text, useWindowDimensions } from "react-native";
import RenderHTML from "react-native-render-html";

/**
 * Content copy fields are a mix: the script comes from the Lexical rich-text
 * editor and is stored as HTML, while the brief/description is usually plain
 * text. This renders HTML through `react-native-render-html` (the same renderer
 * the strategy share view uses) and falls back to a plain, newline-preserving
 * <Text> for non-HTML values so their line breaks aren't collapsed.
 */
const HTML_RE =
    /<\/?(p|br|div|span|h[1-6]|ul|ol|li|b|strong|i|em|u|a|blockquote|pre|code|html|body|table|img)\b[^>]*>/i;

interface Props {
    value: string;
}

const PublicRichText: React.FC<Props> = ({ value }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { width } = useWindowDimensions();

    const isHtml = useMemo(() => HTML_RE.test(value), [value]);

    if (!isHtml) {
        return <Text style={styles.plain}>{value}</Text>;
    }

    const contentWidth = Math.min(width, 760) - 48;
    return (
        <RenderHTML
            contentWidth={contentWidth}
            source={{ html: value || "<p></p>" }}
            baseStyle={{ color: colors.text, fontSize: 15, lineHeight: 23 }}
            tagsStyles={{
                h1: { color: colors.text },
                h2: { color: colors.text },
                h3: { color: colors.text },
                a: { color: colors.primary },
                li: { color: colors.text },
                p: { color: colors.text },
                strong: { color: colors.text },
                b: { color: colors.text },
                em: { color: colors.text },
                blockquote: { color: colors.textSecondary },
            }}
        />
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        plain: {
            fontSize: 15,
            lineHeight: 23,
            color: colors.text,
        },
    });
}

export default PublicRichText;
