import { Text } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const AGE_OPTIONS = [
    {
        key: "JUST_STARTING",
        title: "Just starting",
        desc: "New or pre-launch brand",
    },
    {
        key: "LT_1",
        title: "Less than 1 year",
        desc: "Operating for under 12 months",
    },
    {
        key: "LT_5",
        title: "Less than 5 years",
        desc: "Established but growing",
    },
    {
        key: "GT_5",
        title: "5+ years",
        desc: "Well established brand",
    },
];

export interface BrandAgeSelectProps {
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
}

const BrandAgeSelect: React.FC<BrandAgeSelectProps> = ({
    brandData,
    setBrandData,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const selectedAge = brandData.age;

    return (
        <View style={styles.wrapper}>
            <Text style={styles.subtitle}>
                How established is your brand? (required)
            </Text>
            <View style={styles.grid}>
                {AGE_OPTIONS.map((opt) => {
                    const selected = selectedAge === opt.key;
                    return (
                        <Pressable
                            key={opt.key}
                            onPress={() =>
                                setBrandData({
                                    ...brandData,
                                    age: opt.key,
                                })
                                }
                            style={[
                                styles.card,
                                selected && styles.cardSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.cardTitle,
                                    selected && styles.cardTitleSelected,
                                ]}
                            >
                                {opt.title}
                            </Text>
                            <Text style={styles.cardDesc}>{opt.desc}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        wrapper: {
            marginTop: 4,
        },
        subtitle: {
            fontSize: 13,
            color: colors.textSecondary,
            marginBottom: 24,
        },
        grid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 16,
        },
        card: {
            flexBasis: "48%",
            flexGrow: 1,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.formBorder,
            backgroundColor: colors.card,
            padding: 16,
        },
        cardSelected: {
            borderColor: colors.primary,
            backgroundColor: colors.ageCardSelectedBg,
        },
        cardTitle: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },
        cardTitleSelected: {
            color: colors.primary,
        },
        cardDesc: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 4,
        },
    });
}

export default BrandAgeSelect;
