import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { useTheme } from "@react-navigation/native";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Divider, Text as PaperText, Surface } from "react-native-paper";

const AGE_OPTIONS = [
    { key: "JUST_STARTING", title: "Just starting", desc: "New or pre-launch brand" },
    { key: "LT_1", title: "Less than 1 year", desc: "Operating for under 12 months" },
    { key: "LT_5", title: "Less than 5 years", desc: "Established but growing" },
    { key: "GT_5", title: "5+ years", desc: "Well established brand" },
];

interface BrandAgeProps {
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
    onNext?: () => void;
    onBack?: () => void;
    plainSection?: boolean;
    compactLayout?: boolean;
}

const BrandAge: React.FC<BrandAgeProps> = ({
    brandData,
    setBrandData,
    onNext,
    onBack,
    plainSection = false,
    compactLayout = false,
}) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors, compactLayout), [colors, compactLayout]);
    const brandAge = brandData.age;

    const Wrapper = plainSection ? View : Surface;
    const wrapperProps = plainSection
        ? { style: styles.wrapperPlain }
        : { style: styles.wrapperCard, elevation: 1 };

    return (
        <Wrapper {...wrapperProps}>
            <View style={styles.headerRow}>
                {onBack && (
                    <Pressable onPress={onBack} style={styles.backBtn}>
                        <PaperText style={styles.backArrow}>←</PaperText>
                    </Pressable>
                )}
                <PaperText variant="titleMedium" style={styles.sectionTitle}>
                    Brand age
                </PaperText>
            </View>
            <PaperText style={styles.subtitle}>
                How established is your brand? (required)
            </PaperText>
            <Divider style={styles.divider} />

            <View style={styles.optionsRow}>
                {AGE_OPTIONS.map((opt) => {
                    const selected = brandAge === opt.key;
                    return (
                        <Pressable
                            key={opt.key}
                            onPress={() =>
                                setBrandData({
                                    ...brandData,
                                    profile: { ...brandData.profile },
                                    age: opt.key as Brand["age"],
                                })
                            }
                            style={[
                                styles.optionCard,
                                selected && styles.optionCardSelected,
                            ]}
                        >
                            <PaperText style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                                {opt.title}
                            </PaperText>
                            <PaperText style={styles.optionDesc}>
                                {opt.desc}
                            </PaperText>
                        </Pressable>
                    );
                })}
            </View>

            {onNext && (
                <View style={styles.nextWrap}>
                    <Button
                        mode="contained"
                        onPress={onNext}
                        style={styles.nextButton}
                        buttonColor={colors.primary}
                        compact={compactLayout}
                    >
                        Next
                    </Button>
                </View>
            )}
        </Wrapper>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, compact: boolean) {
    const cardRadius = compact ? 10 : 12;
    const cardPadding = compact ? 10 : 16;

    return StyleSheet.create({
        wrapperPlain: {
            paddingVertical: compact ? 4 : 8,
        },
        wrapperCard: {
            borderRadius: 16,
            padding: compact ? 12 : 16,
            backgroundColor: colors.card,
        },
        headerRow: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: compact ? 4 : 8,
        },
        backBtn: {
            marginRight: 12,
            padding: 4,
        },
        backArrow: {
            fontSize: compact ? 18 : 20,
            color: colors.text,
        },
        sectionTitle: {
            fontWeight: "800",
            color: colors.text,
            fontSize: compact ? 15 : undefined,
        },
        subtitle: {
            color: colors.textSecondary,
            marginTop: 4,
            fontSize: compact ? 13 : undefined,
        },
        divider: {
            marginTop: compact ? 8 : 12,
            marginBottom: compact ? 10 : 16,
            backgroundColor: colors.surface,
        },
        optionsRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: compact ? 6 : 8,
        },
        optionCard: {
            flexBasis: "48%",
            marginBottom: compact ? 8 : 12,
            borderRadius: cardRadius,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
            padding: cardPadding,
        },
        optionCardSelected: {
            borderColor: colors.primary,
            backgroundColor: colors.primaryLight,
        },
        optionTitle: {
            fontWeight: "800",
            fontSize: compact ? 13 : 15,
            color: colors.text,
        },
        optionTitleSelected: {
            color: colors.primary,
        },
        optionDesc: {
            fontSize: compact ? 12 : 13,
            color: colors.textSecondary,
            marginTop: 4,
        },
        nextWrap: {
            marginTop: compact ? 12 : 16,
        },
        nextButton: {
            borderRadius: cardRadius,
        },
    });
}

export default BrandAge;
