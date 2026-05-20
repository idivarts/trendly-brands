import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { CampaignType, ICampaign } from "@/types/Campaign";
import { faCalendarCheck, faFlask } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import StepLayout from "./StepLayout";

interface TypeOptionProps {
    icon: any;
    title: string;
    description: string;
    badge?: string;
    selected: boolean;
    onSelect: () => void;
    colors: ReturnType<typeof Colors>;
}

const TypeOption: React.FC<TypeOptionProps> = ({
    icon,
    title,
    description,
    badge,
    selected,
    onSelect,
    colors,
}) => {
    const styles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    borderWidth: 2,
                    borderRadius: 16,
                    padding: 20,
                    gap: 12,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.budgetCardBg : colors.card,
                },
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: "transparent",
                },
                iconWrap: {
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: selected ? colors.primary : colors.aliceBlue,
                },
                title: {
                    fontSize: 17,
                    fontWeight: "700",
                    color: colors.text,
                    flex: 1,
                },
                description: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    lineHeight: 20,
                },
                badge: {
                    alignSelf: "flex-start",
                    backgroundColor: colors.reachCardBg,
                    borderWidth: 1,
                    borderColor: colors.reachCardBorder,
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                },
                badgeText: {
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.green,
                },
            }),
        [selected, colors]
    );

    return (
        <Pressable onPress={onSelect} style={styles.card}>
            <View style={styles.row}>
                <View style={styles.iconWrap}>
                    <FontAwesomeIcon
                        icon={icon}
                        size={22}
                        color={selected ? colors.white : colors.primary}
                    />
                </View>
                <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.description}>{description}</Text>
            {badge ? (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            ) : null}
        </Pressable>
    );
};

interface StepTwoProps {
    campaign: Partial<ICampaign>;
    setCampaign: React.Dispatch<React.SetStateAction<Partial<ICampaign>>>;
    onNext: () => void;
    onBack: () => void;
}

const StepTwo: React.FC<StepTwoProps> = ({ campaign, setCampaign, onNext, onBack }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const select = (type: CampaignType) =>
        setCampaign((prev) => ({ ...prev, campaignType: type }));

    return (
        <StepLayout step={2} title="Campaign Commitment" subtitle="How would you like to work with us?" onBack={onBack}>
            <Text style={styles.intro}>
                Choose the engagement model that fits your marketing goals best.
            </Text>

            <View style={styles.options}>
                <TypeOption
                    icon={faFlask}
                    title="One-off Trial Project"
                    description="A single fixed-scope campaign — ideal for testing a new strategy or product launch. Note: one-off projects tend to be more expensive per result than ongoing retainers."
                    selected={campaign.campaignType === "one-off"}
                    onSelect={() => select("one-off")}
                    colors={colors}
                />

                <TypeOption
                    icon={faCalendarCheck}
                    title="Monthly Retainer"
                    description="An ongoing monthly partnership. We align deeper with your brand and improve results over time. As a retainer client, certain services like strategy planning and reporting are offered free of charge."
                    badge="✦ Recommended — free extras included"
                    selected={campaign.campaignType === "retainer"}
                    onSelect={() => select("retainer")}
                    colors={colors}
                />
            </View>

            <View style={styles.buttons}>
                <Button mode="outlined" onPress={onBack} style={styles.backBtn}>
                    Back
                </Button>
                <Button mode="contained" onPress={onNext} style={styles.nextBtn}>
                    Next
                </Button>
            </View>
        </StepLayout>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
    StyleSheet.create({
        intro: {
            fontSize: 15,
            color: colors.textSecondary,
            lineHeight: 22,
        },
        options: {
            gap: 16,
            backgroundColor: "transparent",
        },
        buttons: {
            flexDirection: "row",
            gap: 12,
            backgroundColor: "transparent",
        },
        backBtn: { flex: 1 },
        nextBtn: { flex: 2 },
    });

export default StepTwo;
