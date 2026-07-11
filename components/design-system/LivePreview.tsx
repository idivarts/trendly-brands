/**
 * A sticky sample-post preview that re-renders as the Design System changes, so
 * the abstract standard feels tangible. It paints a mock post card with the
 * brand's palette + a heading/body/caption drawn from the identity & voice, then
 * lists the palette swatches and fonts beneath.
 */
import { IDesignSystem } from "@/shared-libs/firestore/trendly-pro/models/design-system";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text as PaperText } from "react-native-paper";
import { isValidHex } from "./fields";

const LivePreview: React.FC<{ ds: IDesignSystem }> = ({ ds }) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const palette = (ds.palette ?? []).filter((c) => isValidHex(c.hex));
    const byRole = (role: string) => palette.find((c) => c.role === role)?.hex;

    // Resolve the card colors from the brand palette, falling back to theme tokens
    // so an empty Design System still previews cleanly.
    const bg = byRole("background") || byRole("neutral") || colors.card;
    const accent = byRole("primary") || byRole("accent") || colors.primary;
    const textColor = byRole("text") || colors.text;

    const headingFamily = (ds.fonts ?? []).find((f) => f.role === "heading")?.family;
    const bodyFamily = (ds.fonts ?? []).find((f) => f.role === "body")?.family;

    const logo = (ds.logos ?? []).find((l) => l.variant === "primary" && l.url)?.url
        || (ds.logos ?? []).find((l) => l.url)?.url;

    const heading = ds.identity?.tagline || ds.identity?.mission || "Your tagline here";
    const caption =
        ds.voice?.samplePhrases?.[0] ||
        ds.identity?.mission ||
        "A sample caption in your brand voice will preview here.";

    return (
        <View style={styles.wrap}>
            <PaperText style={styles.previewLabel}>Live preview</PaperText>

            <View style={[styles.card, { backgroundColor: bg }]}>
                <View style={styles.cardHeader}>
                    {logo ? (
                        <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" />
                    ) : (
                        <View style={[styles.logoStub, { backgroundColor: accent }]} />
                    )}
                </View>
                <View style={styles.cardBody}>
                    <PaperText style={[styles.heading, { color: textColor }]}>{heading}</PaperText>
                    <View style={[styles.rule, { backgroundColor: accent }]} />
                    <PaperText style={[styles.caption, { color: textColor }]} numberOfLines={4}>
                        {caption}
                    </PaperText>
                </View>
            </View>

            {palette.length > 0 && (
                <View style={styles.swatchRow}>
                    {palette.slice(0, 8).map((c, i) => (
                        <View key={i} style={[styles.swatch, { backgroundColor: c.hex }]} />
                    ))}
                </View>
            )}

            {(!!headingFamily || !!bodyFamily) && (
                <View style={styles.fontLines}>
                    {!!headingFamily && (
                        <PaperText style={styles.fontLine}>
                            <PaperText style={styles.fontRole}>Heading  </PaperText>
                            {headingFamily}
                        </PaperText>
                    )}
                    {!!bodyFamily && (
                        <PaperText style={styles.fontLine}>
                            <PaperText style={styles.fontRole}>Body  </PaperText>
                            {bodyFamily}
                        </PaperText>
                    )}
                </View>
            )}
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        wrap: {
            gap: 12,
        },
        previewLabel: {
            color: colors.textSecondary,
            fontSize: 12,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 0.5,
        },
        card: {
            borderRadius: 16,
            overflow: "hidden",
            aspectRatio: 4 / 5,
            // Cap the card so it doesn't become a giant full-width block on mobile
            // (where the preview leads the page) — a phone-post-sized card reads best.
            width: "100%",
            maxWidth: 300,
            alignSelf: "center",
            padding: 20,
            justifyContent: "space-between",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 12,
            shadowOpacity: 0.12,
            elevation: 3,
        },
        cardHeader: {
            flexDirection: "row",
            alignItems: "center",
        },
        logo: {
            height: 34,
            width: 120,
            alignSelf: "flex-start",
        },
        logoStub: {
            height: 28,
            width: 28,
            borderRadius: 8,
            opacity: 0.9,
        },
        cardBody: {
            gap: 12,
        },
        heading: {
            fontSize: 24,
            fontWeight: "800",
            lineHeight: 30,
        },
        rule: {
            height: 4,
            width: 44,
            borderRadius: 999,
        },
        caption: {
            fontSize: 14,
            lineHeight: 20,
            opacity: 0.9,
        },
        swatchRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        swatch: {
            width: 28,
            height: 28,
            borderRadius: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.12,
            elevation: 1,
        },
        fontLines: {
            gap: 4,
        },
        fontLine: {
            color: colors.text,
            fontSize: 13,
        },
        fontRole: {
            color: colors.textSecondary,
            fontSize: 11,
            fontWeight: "700",
            textTransform: "uppercase",
        },
    });
}

export default LivePreview;
