import {
    type ReleasePlanOption,
} from "@/shared-constants/contract-status";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Checkbox } from "react-native-paper";
import { Text } from "../theme/Themed";
import Button from "../ui/button";

const RELEASE_CARDS: {
    value: ReleasePlanOption;
    title: string;
    subtitle: string;
}[] = [
    {
        value: "influencer_posts_alone",
        title: "Influencer will Post independently",
        subtitle: "Brand will courier the product to the influencer's address.",
    },
    {
        value: "brand_and_influencer_post",
        title: "Influencer needs to Collab Post",
        subtitle: "No physical product. Examples: SaaS tools, apps, online services, digital access.",
    },
    {
        value: "brand_posts_alone",
        title: "Brand will post Independently",
        subtitle: "Influencer needs to visit a physical shop, cafe, salon, or venue.",
    },
];

export interface PlanReleaseBottomSheetProps {
    onClose: () => void;
    onConfirm: (option: ReleasePlanOption, trendlyBoost: boolean) => Promise<void> | void;
}

const PlanReleaseBottomSheet: React.FC<PlanReleaseBottomSheetProps> = ({
    onClose,
    onConfirm,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [selectedOption, setSelectedOption] = useState<ReleasePlanOption | null>(null);
    const [trendlyBoost, setTrendlyBoost] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!selectedOption) return;
        setSubmitting(true);
        try {
            await onConfirm(selectedOption, trendlyBoost);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.grabHandle} />
            {RELEASE_CARDS.map((card) => {
                const isSelected = selectedOption === card.value;
                return (
                    <TouchableOpacity
                        key={card.value}
                        style={[styles.card, isSelected && styles.cardSelected]}
                        onPress={() => setSelectedOption(card.value)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                            {card.title}
                        </Text>
                        <Text style={[styles.cardSubtitle, isSelected && styles.cardSubtitleSelected]}>
                            {card.subtitle}
                        </Text>
                    </TouchableOpacity>
                );
            })}
            <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setTrendlyBoost((b) => !b)}
                activeOpacity={0.8}
            >
                <Checkbox
                    status={trendlyBoost ? "checked" : "unchecked"}
                    onPress={() => setTrendlyBoost((b) => !b)}
                    color={colors.primary}
                />
                <Text style={styles.checkboxLabel}>
                    Boost your post by automatically shared on Trendly's insta account (for free)
                </Text>
            </TouchableOpacity>
            <Button
                mode="contained"
                onPress={handleConfirm}
                disabled={!selectedOption || submitting}
                style={styles.confirmButton}
            >
                Confirm
            </Button>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        container: {
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 32,
        },
        grabHandle: {
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.gray300 ?? "rgba(0,0,0,0.3)",
            alignSelf: "center",
            marginBottom: 20,
        },
        card: {
            backgroundColor: colors.surface ?? colors.background,
            borderWidth: 1,
            borderColor: colors.budgetCardBorder ?? "rgba(0,0,0,0.12)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
        },
        cardSelected: {
            borderColor: colors.primary,
            borderWidth: 2,
            backgroundColor: colors.primaryLight ?? "rgba(5, 68, 99, 0.08)",
        },
        cardTitle: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 6,
        },
        cardTitleSelected: {
            color: colors.primary,
        },
        cardSubtitle: {
            fontSize: 14,
            fontWeight: "400",
            color: colors.gray100 ?? colors.text,
            lineHeight: 20,
        },
        cardSubtitleSelected: {
            color: colors.primaryDark ?? colors.primary,
        },
        checkboxRow: {
            flexDirection: "row",
            alignItems: "center",
            marginTop: 16,
            marginBottom: 24,
        },
        checkboxLabel: {
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
            flex: 1,
            marginLeft: 8,
        },
        confirmButton: {
            width: "100%",
        },
    });
}

export default PlanReleaseBottomSheet;
