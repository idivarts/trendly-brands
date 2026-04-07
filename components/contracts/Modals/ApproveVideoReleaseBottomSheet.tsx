import type { ReleasePlanOption } from "@/shared-constants/contract-status";
import { RELEASE_DATE_MAX_DAYS } from "@/shared-constants/contract-status";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Checkbox } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
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

const sendDebugLog = (
    runId: string,
    hypothesisId: string,
    location: string,
    message: string,
    data: Record<string, unknown>
) =>
    fetch("http://127.0.0.1:7635/ingest/35d7f708-ae10-4154-b612-6c5217b8dac1", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "320059",
        },
        body: JSON.stringify({
            sessionId: "320059",
            runId,
            hypothesisId,
            location,
            message,
            data,
            timestamp: Date.now(),
        }),
    }).catch(() => {});

const formatDateForWebInput = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const parseWebInputDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
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

    const [selectedOption, setSelectedOption] = useState<ReleasePlanOption | null>(null);
    const [date, setDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
    });
    const [hasSelectedDate, setHasSelectedDate] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const webDateInputRef = useRef<any>(null);

    const needsScheduledDate = selectedOption !== "brand_posts_alone";

    useEffect(() => {
        if (selectedOption === "brand_posts_alone") {
            setShowDatePicker(false);
            setHasSelectedDate(false);
        }
    }, [selectedOption]);

    useEffect(() => {
        if (Platform.OS !== "web" || !showDatePicker) return;
        const input = webDateInputRef.current;
        // #region agent log
        sendDebugLog(
            "post-fix",
            "H8",
            "ApproveVideoReleaseBottomSheet.tsx:web-input:effect-open",
            "web date input open effect running",
            { hasInputRef: !!input }
        );
        // #endregion
        if (!input) return;
        try {
            input.focus();
            // #region agent log
            sendDebugLog(
                "post-fix",
                "H8",
                "ApproveVideoReleaseBottomSheet.tsx:web-input:effect-focus",
                "web date input focused",
                {}
            );
            // #endregion
        } catch (error) {
            // #region agent log
            sendDebugLog(
                "post-fix",
                "H8",
                "ApproveVideoReleaseBottomSheet.tsx:web-input:effect-focus-error",
                "web date input focus threw",
                { error: error instanceof Error ? error.message : "unknown_focus_error" }
            );
            // #endregion
        }
        try {
            if (typeof input.showPicker === "function") {
                input.showPicker();
                // #region agent log
                sendDebugLog(
                    "post-fix",
                    "H8",
                    "ApproveVideoReleaseBottomSheet.tsx:web-input:effect-showPicker",
                    "web date input showPicker invoked",
                    {}
                );
                // #endregion
            } else {
                input.click();
                // #region agent log
                sendDebugLog(
                    "post-fix",
                    "H8",
                    "ApproveVideoReleaseBottomSheet.tsx:web-input:effect-click",
                    "web date input click invoked",
                    {}
                );
                // #endregion
            }
        } catch (error) {
            // #region agent log
            sendDebugLog(
                "post-fix",
                "H8",
                "ApproveVideoReleaseBottomSheet.tsx:web-input:effect-open-error",
                "web date input open attempt threw",
                { error: error instanceof Error ? error.message : "unknown_open_error" }
            );
            // #endregion
        }
    }, [showDatePicker]);

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
                            // #region agent log
                            sendDebugLog(
                                "pre-fix",
                                "H1",
                                "ApproveVideoReleaseBottomSheet.tsx:select-date:onPress",
                                "select date button pressed",
                                {
                                    platform: Platform.OS,
                                    selectedOption,
                                    needsScheduledDate,
                                }
                            );
                            // #endregion
                            // Reset so "selected date" text doesn't appear until the user actually confirms.
                            setHasSelectedDate(false);
                            if (Platform.OS === "web") {
                                // #region agent log
                                sendDebugLog(
                                    "post-fix",
                                    "H6",
                                    "ApproveVideoReleaseBottomSheet.tsx:select-date:web-open-inline",
                                    "opening inline web DateTimePicker",
                                    {}
                                );
                                // #endregion
                                setShowDatePicker(true);
                                return;
                            }
                            setShowDatePicker(true);
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
                        Platform.OS === "web" ? (
                            <>
                                {React.createElement("input", {
                                    ref: webDateInputRef,
                                    type: "date",
                                    value: formatDateForWebInput(date),
                                    min: formatDateForWebInput(new Date()),
                                    max: formatDateForWebInput(maxReleaseDate()),
                                    onFocus: () => {
                                        // #region agent log
                                        sendDebugLog(
                                            "post-fix",
                                            "H8",
                                            "ApproveVideoReleaseBottomSheet.tsx:web-input:onFocus",
                                            "native HTML date input focused by user/system",
                                            {}
                                        );
                                        // #endregion
                                    },
                                    onClick: () => {
                                        // #region agent log
                                        sendDebugLog(
                                            "post-fix",
                                            "H8",
                                            "ApproveVideoReleaseBottomSheet.tsx:web-input:onClick",
                                            "native HTML date input clicked",
                                            {}
                                        );
                                        // #endregion
                                    },
                                    onChange: (e: any) => {
                                        const selected = parseWebInputDate(e?.target?.value ?? "");
                                        // #region agent log
                                        sendDebugLog(
                                            "post-fix",
                                            "H8",
                                            "ApproveVideoReleaseBottomSheet.tsx:web-input:onChange",
                                            "native HTML date input changed",
                                            {
                                                rawValue: e?.target?.value ?? null,
                                                parsedMs: selected?.getTime() ?? null,
                                            }
                                        );
                                        // #endregion
                                        if (!selected) return;
                                        const prevMs = date.getTime();
                                        setDate(selected);
                                        setHasSelectedDate(selected.getTime() !== prevMs);
                                    },
                                    style: {
                                        width: "100%",
                                        height: 42,
                                        marginBottom: 12,
                                        borderRadius: 8,
                                        border: `1px solid ${colors.budgetCardBorder}`,
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                        padding: "8px 12px",
                                        fontSize: "14px",
                                        boxSizing: "border-box",
                                    },
                                })}
                            </>
                        ) : (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                // Use spinner on iOS to avoid the "second tap" behavior and reduce crash risk.
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                minimumDate={new Date()}
                                maximumDate={maxReleaseDate()}
                                onChange={(event, d) => {
                                    // #region agent log
                                    sendDebugLog(
                                        "post-fix",
                                        "H6",
                                        "ApproveVideoReleaseBottomSheet.tsx:DateTimePicker:onChange",
                                        "DateTimePicker onChange fired",
                                        {
                                            platform: Platform.OS,
                                            eventType: (event as any)?.type ?? null,
                                            hasDate: !!d,
                                            pickedMs: d?.getTime() ?? null,
                                        }
                                    );
                                    // #endregion
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
                        )
                    )}
                    {Platform.OS === "web" && showDatePicker ? (
                        <Button
                            mode="outlined"
                            style={styles.selectDateDoneButton}
                            onPress={() => {
                                // #region agent log
                                sendDebugLog(
                                    "post-fix",
                                    "H6",
                                    "ApproveVideoReleaseBottomSheet.tsx:DateTimePicker:web-done",
                                    "web date picker done tapped",
                                    {
                                        hasSelectedDate,
                                        selectedMs: date.getTime(),
                                    }
                                );
                                // #endregion
                                setShowDatePicker(false);
                            }}
                        >
                            Done
                        </Button>
                    ) : null}

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
        selectDateButton: {
            marginBottom: 12,
        },
        selectDateDoneButton: {
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

