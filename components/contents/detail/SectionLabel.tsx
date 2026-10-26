import { fs } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * The one section heading on the content detail page.
 *
 * The editor has two levels of heading and they had drifted into looking like
 * one. A SECTION names a region of the page and sits above its card — Caption,
 * Hashtags, Production & Handoff. A CARD TITLE names one card inside a section
 * and sits within it, bold and larger ("Plan the shoot, then hand it off").
 *
 * The media stage and the script editor were naming regions with a card title,
 * inside the card, so "Video" read as a different KIND of thing from "CAPTION"
 * directly beneath it when they are peers. This component exists so the rule
 * has one implementation rather than a style object copied into each file,
 * which is how they came apart in the first place.
 *
 * `right` holds anything that belongs to the section rather than its contents —
 * a ratio chip, a render status — on the same baseline as the label.
 */
interface Props {
    children: React.ReactNode;
    right?: React.ReactNode;
}

const SectionLabel: React.FC<Props> = ({ children, right }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    return (
        <View style={styles.row}>
            <Text style={styles.label} accessibilityRole="header">
                {children}
            </Text>
            {right ? <View style={styles.right}>{right}</View> : null}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 8,
                },
                label: {
                    fontSize: fs(11),
                    fontWeight: "700",
                    letterSpacing: 1.1,
                    color: colors.textSecondary,
                },
                right: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                },
            }),
        [colors]
    );
}

export default SectionLabel;
