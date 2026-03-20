import type { ReleasePlanOption } from "@/shared-constants/contract-status";
import { RELEASE_DATE_MAX_DAYS } from "@/shared-constants/contract-status";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Checkbox } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
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

const maxReleaseDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + RELEASE_DATE_MAX_DAYS);
    return d;
};

export interface ApproveVideoReleaseBottomSheetProps {
    onClose: () => void;
    onConfirm: (data: {
        option: ReleasePlanOption;
        /** Omitted when option is `brand_posts_alone` (brand posts independently — skips release scheduling). */
        scheduledReleaseAt?: number;
        trendlyBoost: boolean;
    }) => Promise<void> | void;
}

const ApproveVideoReleaseBottomSheet: React.FC<
    ApproveVideoReleaseBottomSheetProps
> = ({ onClose, onConfirm }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [selectedOption, setSelectedOption] = useState<ReleasePlanOption | null>(null);
    /** Always on — brand boost opt-in is fixed for this flow. */
    const trendlyBoost = true;
    const [date, setDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
    });
    const [hasSelectedDate, setHasSelectedDate] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const needsScheduledDate = selectedOption !== "brand_posts_alone";

    useEffect(() => {
        if (selectedOption === "brand_posts_alone") {
            setShowDatePicker(false);
            setHasSelectedDate(false);
        }
    }, [selectedOption]);

    const handleConfirm = async () => {
        if (!selectedOption) return;
        if (needsScheduledDate && !hasSelectedDate) return;

        setSubmitting(true);
        try {
            if (selectedOption === "brand_posts_alone") {
                await onConfirm({
                    option: selectedOption,
                    trendlyBoost,
                });
                onClose();
                return;
            }

            const ts = Math.min(date.getTime(), maxReleaseDate().getTime());
            await onConfirm({
                option: selectedOption,
                scheduledReleaseAt: ts,
                trendlyBoost,
            });
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
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}
                        >
                            {card.title}
                        </Text>
                        <Text
                            style={[
                                styles.cardSubtitle,
                                isSelected && styles.cardSubtitleSelected,
                            ]}
                        >
                            {card.subtitle}
                        </Text>
                    </TouchableOpacity>
                );
            })}

            <View style={styles.checkboxRow}>
                <Checkbox
                    status="checked"
                    disabled
                    color={colors.primary}
                />
                <Text style={styles.checkboxLabel}>
                    Boost your post by automatically shared on Trendly's insta account (for free)
                </Text>
            </View>

            {selectedOption && needsScheduledDate ? (
                <>
                    <Button
                        mode="outlined"
                        style={styles.selectDateButton}
                        onPress={() => {
                            // Reset so "selected date" text doesn't appear until the user actually confirms.
                            setHasSelectedDate(false);
                            try {
                                setShowDatePicker(true);
                            } catch (_) {}
                        }}
                    >
                        Select date
                    </Button>
                    {hasSelectedDate && !showDatePicker ? (
                        <Text style={styles.selectedDateText}>
                            {date.toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })}
                        </Text>
                    ) : null}

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            // Use spinner on iOS to avoid the "second tap" behavior and reduce crash risk.
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            minimumDate={new Date()}
                            maximumDate={maxReleaseDate()}
                            onChange={(event, d) => {
                                // Only mark as selected when the user actually sets a date.
                                if ((event as any)?.type === "set" && d) {
                                    const prevMs = date.getTime();
                                    setDate(d);
                                    // If the picker fires an initial "set" with the same default date,
                                    // don't render the selected date text until the user changes it.
                                    setHasSelectedDate(d.getTime() !== prevMs);
                                }
                                setShowDatePicker(false);
                            }}
                        />
                    )}

                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            You can choose a release date up to the next 30 days.
                        </Text>
                    </View>
                </>
            ) : null}

            <View style={styles.actions}>
                <Button mode="outlined" style={styles.button} onPress={onClose}>
                    Cancel
                </Button>
                <Button
                    mode="contained"
                    style={styles.button}
                    onPress={handleConfirm}
                    disabled={
                        !selectedOption ||
                        (needsScheduledDate && !hasSelectedDate) ||
                        submitting
                    }
                >
                    Approve Video
                </Button>
            </View>
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
            backgroundColor: colors.gray300,
            alignSelf: "center",
            marginBottom: 16,
        },
        title: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
            marginTop: 10,
            marginBottom: 2,
        },
        subtitle: {
            fontSize: 13,
            color: colors.gray300,
            marginBottom: 12,
            lineHeight: 18,
        },
        card: {
            backgroundColor: colors.surface ?? colors.background,
            borderWidth: 1,
            borderColor: colors.budgetCardBorder,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
        },
        cardSelected: {
            borderColor: colors.primary,
            borderWidth: 2,
            backgroundColor: colors.primaryLight ?? colors.tag,
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
            marginBottom: 20,
        },
        checkboxLabel: {
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
            flex: 1,
            marginLeft: 8,
            lineHeight: 18,
        },
        selectDateButton: {
            marginBottom: 12,
        },
        selectedDateText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 10,
        },
        warningBox: {
            padding: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.budgetCardBorder,
            backgroundColor: colors.planBadgeProBg,
            marginBottom: 18,
        },
        warningText: {
            fontSize: 13,
            color: colors.gray100 ?? colors.text,
            lineHeight: 18,
        },
        actions: {
            flexDirection: "row",
            gap: 12,
        },
        button: { flex: 1 },
    });
}

export default ApproveVideoReleaseBottomSheet;

