import type { ReleasePlanOption } from "@/shared-constants/contract-status";
import { RELEASE_DATE_MAX_DAYS } from "@/shared-constants/contract-status";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Checkbox } from "react-native-paper";
import DatePickerModal, {
    formatDateForWebInput,
    parseWebInputDate,
} from "../../modals/DatePickerModal";
import { Text } from "../../theme/Themed";
import Button from "../../ui/button";
import { approveVideoRelease } from "../api/review-pending.api";
import ContractActionOverlay from "../ContractActionOverlay";

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
    visible: boolean;
    onClose: () => void;
    contractId: string;
    onSuccess: () => void;
}

const ApproveVideoReleaseBottomSheet: React.FC<
    ApproveVideoReleaseBottomSheetProps
> = ({ visible, onClose, contractId, onSuccess }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const webReleaseDateInputStyle = useMemo(
        () => ({
            width: "100%" as const,
            height: 44,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            border: `1px solid ${colors.budgetCardBorder}`,
            backgroundColor: colors.tag ?? colors.gray200,
            color: colors.text,
            fontSize: 15,
            boxSizing: "border-box" as const,
        }),
        [colors.budgetCardBorder, colors.gray200, colors.tag, colors.text]
    );

    const [selectedOption, setSelectedOption] = useState<ReleasePlanOption | null>(null);
    const [date, setDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
    });
    const [hasSelectedDate, setHasSelectedDate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [dateModalVisible, setDateModalVisible] = useState(false);

    const needsScheduledDate = selectedOption !== "brand_posts_alone";

    const handleSelectReleaseOption = (value: ReleasePlanOption) => {
        const needsDate = value !== "brand_posts_alone";
        if (selectedOption === value && needsDate) {
            if (Platform.OS !== "web") {
                setDateModalVisible(true);
            }
            return;
        }
        setSelectedOption(value);
        if (Platform.OS === "web") {
            setHasSelectedDate(needsDate);
        } else {
            setHasSelectedDate(false);
            if (needsDate) {
                setDateModalVisible(true);
            }
        }
    };

    useEffect(() => {
        if (selectedOption === "brand_posts_alone") {
            setDateModalVisible(false);
            setHasSelectedDate(false);
        }
    }, [selectedOption]);

    const handleConfirm = async () => {
        if (!selectedOption) return;
        if (needsScheduledDate && !hasSelectedDate) return;

        setSubmitting(true);
        try {
            if (selectedOption === "brand_posts_alone") {
                await approveVideoRelease({
                    contractId,
                    option: selectedOption,
                });
            } else {
                const ts = Math.min(date.getTime(), maxReleaseDate().getTime());
                await approveVideoRelease({
                    contractId,
                    option: selectedOption,
                    scheduledReleaseAt: ts,
                });
            }
            Toaster.success("Video approved");
            onSuccess();
            onClose();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(
                message ? `Failed to approve video: ${message}` : "Failed to approve video"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const content = (
        <View style={styles.container}>
            <View style={styles.grabHandle} />

            {RELEASE_CARDS.map((card) => {
                const isSelected = selectedOption === card.value;
                return (
                    <TouchableOpacity
                        key={card.value}
                        style={[styles.card, isSelected && styles.cardSelected]}
                        onPress={() => handleSelectReleaseOption(card.value)}
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
                    {Platform.OS === "web" ? (
                        <View style={styles.webDateSection}>
                            <Text style={styles.dateLabel}>Release date</Text>
                            {React.createElement("input", {
                                type: "date",
                                value: formatDateForWebInput(date),
                                min: formatDateForWebInput(new Date()),
                                max: formatDateForWebInput(maxReleaseDate()),
                                onChange: (e: { target?: { value?: string } }) => {
                                    const raw = e?.target?.value ?? "";
                                    const parsed = parseWebInputDate(raw);
                                    if (!parsed) return;
                                    const capped = Math.min(
                                        parsed.getTime(),
                                        maxReleaseDate().getTime()
                                    );
                                    setDate(new Date(capped));
                                    setHasSelectedDate(true);
                                },
                                style: webReleaseDateInputStyle,
                            })}
                        </View>
                    ) : (
                        <>
                            {hasSelectedDate && !dateModalVisible ? (
                                <Text style={styles.selectedDateText}>
                                    {date.toLocaleDateString(undefined, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </Text>
                            ) : null}
                            <DatePickerModal
                                visible={dateModalVisible}
                                title="Select release date"
                                value={date}
                                onChange={(d) => {
                                    const prevMs = date.getTime();
                                    const nextMs = d.getTime();
                                    setDate(d);
                                    setHasSelectedDate(nextMs !== prevMs);
                                }}
                                onSubmit={() => setHasSelectedDate(true)}
                                onClose={() => setDateModalVisible(false)}
                                minimumDate={new Date()}
                                maximumDate={maxReleaseDate()}
                                submitText="Done"
                                cancelText="Cancel"
                            />
                        </>
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
                    loading={submitting}
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

    return (
        <ContractActionOverlay
            visible={visible}
            onClose={onClose}
            mode="auto"
            snapPointsRange={["65%", "95%"]}
            modalMaxWidth={720}
        >
            {content}
        </ContractActionOverlay>
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
        webDateSection: {
            marginBottom: 12,
        },
        dateLabel: {
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
            marginBottom: 6,
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

