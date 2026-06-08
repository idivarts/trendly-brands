import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCalendarPlus,
    faCompass,
    faPenNib,
    faWandMagicSparkles,
    IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { MotiView } from "moti";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type NextChoice = "strategy" | "calendar" | "content" | "explore";

interface NextOption {
    key: NextChoice;
    icon: IconDefinition;
    title: string;
    desc: string;
}

const OPTIONS: NextOption[] = [
    {
        key: "strategy",
        icon: faWandMagicSparkles,
        title: "Create a strategy with AI",
        desc: "Let AI craft a tailored content plan from your brand details.",
    },
    {
        key: "calendar",
        icon: faCalendarPlus,
        title: "Start your content calendar",
        desc: "Drop your first idea onto the calendar and plan from there.",
    },
    {
        key: "content",
        icon: faPenNib,
        title: "Work on a specific content",
        desc: "Have something in mind? Jump straight into creating it.",
    },
    {
        key: "explore",
        icon: faCompass,
        title: "Explore the platform",
        desc: "Take a look around and discover everything Trendly offers.",
    },
];

interface WhatNextStepProps {
    onSelect: (choice: NextChoice) => void;
    disabled?: boolean;
}

/**
 * Step 7 — the visual "what do you want to do next?" branch. Four big cards
 * with a staggered entrance; selecting one triggers the destination handoff.
 */
const WhatNextStep: React.FC<WhatNextStepProps> = ({ onSelect, disabled }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    return (
        <View style={styles.container}>
            <MotiView
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 450 }}
                style={styles.header}
            >
                <Text style={styles.title}>You're all set! 🎉</Text>
                <Text style={styles.subtitle}>
                    What would you like to do first?
                </Text>
            </MotiView>

            <View style={styles.grid}>
                {OPTIONS.map((opt, i) => (
                    <MotiView
                        key={opt.key}
                        style={styles.cardWrap}
                        from={{ opacity: 0, translateY: 24, scale: 0.96 }}
                        animate={{ opacity: 1, translateY: 0, scale: 1 }}
                        transition={{
                            type: "timing",
                            duration: 420,
                            delay: 150 + i * 110,
                        }}
                    >
                        <Pressable
                            onPress={() => !disabled && onSelect(opt.key)}
                            disabled={disabled}
                            style={({ pressed }) => [
                                styles.card,
                                pressed && styles.cardPressed,
                                disabled && styles.cardDisabled,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={opt.title}
                        >
                            <View style={styles.iconBadge}>
                                <FontAwesomeIcon
                                    icon={opt.icon}
                                    size={22}
                                    color={colors.onPrimary}
                                />
                            </View>
                            <Text style={styles.cardTitle}>{opt.title}</Text>
                            <Text style={styles.cardDesc}>{opt.desc}</Text>
                        </Pressable>
                    </MotiView>
                ))}
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        container: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 28,
        },
        header: {
            alignItems: "center",
            gap: 8,
        },
        title: {
            fontSize: xl ? 30 : 24,
            fontWeight: "800",
            color: colors.text,
            textAlign: "center",
        },
        subtitle: {
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: "center",
        },
        grid: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
            maxWidth: 820,
            width: "100%",
        },
        cardWrap: {
            flexBasis: xl ? "46%" : "100%",
            flexGrow: 1,
            maxWidth: xl ? 390 : 460,
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 18,
            padding: 22,
            gap: 10,
            minHeight: 150,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            shadowOpacity: 0.1,
            elevation: 5,
        },
        cardPressed: {
            opacity: 0.92,
            transform: [{ scale: 0.99 }],
        },
        cardDisabled: {
            opacity: 0.5,
        },
        iconBadge: {
            width: 52,
            height: 52,
            borderRadius: 14,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
            marginBottom: 4,
        },
        cardTitle: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        cardDesc: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.textSecondary,
        },
    });
}

export default WhatNextStep;
