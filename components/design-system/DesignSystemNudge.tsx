/**
 * DesignSystemNudge — a dismissible banner shown on the design stage when the
 * brand's Design System is missing or less than 60% complete. A filled-out
 * Design System gives the AI real brand colors, fonts, imagery and voice, so
 * this nudges the user to complete it for better generation. Renders nothing once
 * the Design System is ≥60% complete (or the user dismisses it for the session).
 */
import { useDesignSystem } from "@/hooks/use-design-system";
import { designSystemCompleteness } from "@/shared-libs/firestore/trendly-pro/models/design-system";
import Colors from "@/shared-uis/constants/Colors";
import { faSwatchbook, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text as PaperText } from "react-native-paper";

/** Below this completeness the nudge appears. */
const NUDGE_THRESHOLD = 60;

const DesignSystemNudge: React.FC = () => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const router = useRouter();
    const { serverDesignSystem, loading } = useDesignSystem();
    const [dismissed, setDismissed] = useState(false);

    const completeness = useMemo(
        () => designSystemCompleteness(serverDesignSystem),
        [serverDesignSystem]
    );

    // Wait for the first snapshot so we don't flash the nudge before we know the
    // real completeness; hide once complete enough or dismissed.
    if (loading || dismissed || completeness >= NUDGE_THRESHOLD) return null;

    const message =
        completeness === 0
            ? "Set up your Design System so AI designs use your real colors, fonts and brand voice."
            : `Your Design System is ${completeness}% complete — finish it for more on-brand AI designs.`;

    return (
        <View style={styles.wrap}>
            <View style={styles.stripe} />
            <View style={styles.body}>
                <View style={styles.iconWrap}>
                    <FontAwesomeIcon icon={faSwatchbook} size={15} color={colors.primary} />
                </View>
                <PaperText style={styles.message} numberOfLines={2}>
                    {message}
                </PaperText>
                <Pressable
                    onPress={() => router.push("/design-system")}
                    style={styles.cta}
                >
                    <PaperText style={styles.ctaText}>
                        {completeness === 0 ? "Set up" : "Complete it"}
                    </PaperText>
                </Pressable>
                <Pressable
                    onPress={() => setDismissed(true)}
                    hitSlop={10}
                    style={styles.dismiss}
                >
                    <FontAwesomeIcon icon={faXmark} size={14} color={colors.textSecondary} />
                </Pressable>
            </View>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        wrap: {
            flexDirection: "row",
            overflow: "hidden",
            borderRadius: 12,
            backgroundColor: colors.card,
            marginHorizontal: 12,
            marginTop: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 2,
        },
        stripe: {
            width: 4,
            backgroundColor: colors.primary,
        },
        body: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
        },
        iconWrap: {
            width: 28,
            height: 28,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        message: {
            flex: 1,
            color: colors.text,
            fontSize: 13,
            lineHeight: 18,
        },
        cta: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        ctaText: {
            color: colors.onPrimary,
            fontSize: 13,
            fontWeight: "700",
        },
        dismiss: {
            padding: 4,
        },
    });
}

export default DesignSystemNudge;
