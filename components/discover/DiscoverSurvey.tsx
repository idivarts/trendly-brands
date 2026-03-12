import { Text, View } from "@/components/theme/Themed";
import { useNiche } from "@/contexts";
import { GENDER_SELECT } from "@/shared-constants/preferences/gender";
import {
    CITIES,
    POPULAR_CITIES,
} from "@/shared-constants/preferences/locations";
import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { MultiSelectExtendableAsync } from "@/shared-uis/components/multiselect-extendable/async";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable/index";
import Colors from "@/shared-uis/constants/Colors";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Button, ProgressBar } from "react-native-paper";

interface DiscoverSurveyProps {
    onComplete: (filters: IAdvanceFilters) => void;
}

interface SurveyQuestion {
    id: string;
    question: string;
    subtitle?: string;
    type: "multiselect";
    field: keyof IAdvanceFilters | "followerRange";
    options?: Array<{ label: string; value: any }>;
    rangeOptions?: { min: number; max: number; step: number; prefix?: string; suffix?: string };
    skippable?: boolean;
}

const SURVEY_QUESTIONS: SurveyQuestion[] = [
    {
        id: "niches",
        question: "What type of influencers are you looking for?",
        subtitle: "Select all categories that match your campaign",
        type: "multiselect",
        field: "selectedNiches",
        options: undefined, // Loaded from niche context API + Others sheet
        skippable: true,
    },
    {
        id: "followers",
        question: "What's your ideal follower range?",
        subtitle: "Select all audience sizes that match your campaign",
        type: "multiselect",
        field: "followerRange",
        options: [
            { label: "Nano (1K - 10K)", value: { min: 1000, max: 10000 } },
            { label: "Micro (10K - 100K)", value: { min: 10000, max: 100000 } },
            { label: "Mid-tier (100K - 500K)", value: { min: 100000, max: 500000 } },
            { label: "Macro (500K - 1M)", value: { min: 500000, max: 1000000 } },
            { label: "Mega (1M+)", value: { min: 1000000, max: undefined } },
            { label: "Any Size", value: { min: undefined, max: undefined } },
        ],
        skippable: false,
    },
    {
        id: "location",
        question: "Where should the influencers be from?",
        subtitle: "Select preferred locations",
        type: "multiselect",
        field: "selectedLocations",
        options: POPULAR_CITIES.map((city) => ({
            label: city,
            value: city,
        })),
        skippable: true,
    },
    {
        id: "gender",
        question: "Any gender preference?",
        subtitle: "Select the gender(s) you'd like to work with",
        type: "multiselect",
        field: "genders",
        options: GENDER_SELECT.map((g) => ({
            label: g.label,
            value: g.value,
        })),
        skippable: true,
    },
];

const isSameRange = (
    a?: { min?: number; max?: number },
    b?: { min?: number; max?: number }
) => a?.min === b?.min && a?.max === b?.max;

const DiscoverSurvey: React.FC<DiscoverSurveyProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const theme = useTheme();
    const colors = Colors(theme);
    const primaryColor = colors.primary;
    const textColor = colors.text;
    const styles = useMemo(() => createDiscoverSurveyStyles(colors), [colors]);

    const { niches: topNiches, searchNiches } = useNiche();
    const progress = (currentStep + 1) / SURVEY_QUESTIONS.length;
    const currentQuestion = SURVEY_QUESTIONS[currentStep];

    const handleAnswer = (value: any) => {
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.field]: value,
        }));
    };

    const handleNext = () => {
        if (currentStep < SURVEY_QUESTIONS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            // Survey complete, convert answers to IAdvanceFilters
            const filters: IAdvanceFilters = {};

            // Handle follower range (multiselect: combine selected ranges into min/max)
            const followerRanges = answers.followerRange as Array<{ min?: number; max?: number }> | undefined;
            if (followerRanges && followerRanges.length > 0) {
                const mins = followerRanges.map((r) => r.min).filter((m): m is number => m != null);
                const maxes = followerRanges.map((r) => r.max).filter((m): m is number => m != null);
                const hasUnboundedMax = followerRanges.some((r) => r.max == null);
                filters.followerMin = mins.length > 0 ? Math.min(...mins) : undefined;
                filters.followerMax = hasUnboundedMax ? undefined : (maxes.length > 0 ? Math.max(...maxes) : undefined);
            }

            // Handle multi-selects
            if (answers.selectedNiches?.length > 0) {
                filters.selectedNiches = answers.selectedNiches;
            }

            if (answers.selectedLocations?.length > 0) {
                filters.selectedLocations = answers.selectedLocations;
            }

            if (answers.genders?.length > 0) {
                filters.genders = answers.genders;
            }

            onComplete(filters);
        }
    };

    const handleSkip = () => {
        handleNext();
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const renderQuestion = () => {
        switch (currentQuestion.type) {
            case "multiselect":
                if (currentQuestion.field === "selectedNiches") {
                    const selectedNiches = (answers.selectedNiches || []) as string[];
                    return (
                        <View style={styles.optionsContainer}>
                            <MultiSelectExtendableAsync
                                key={`niches-${topNiches.length}`}
                                buttonLabel="Others"
                                initialItemsList={topNiches}
                                initialMultiselectItemsList={includeSelectedItems(topNiches, selectedNiches)}
                                onSelectedItemsChange={handleAnswer}
                                onSearch={async (query) => {
                                    const results = await searchNiches(query || "");
                                    return results.map((item) => item.niche);
                                }}
                                selectedItems={selectedNiches}
                                theme={theme}
                            />
                        </View>
                    );
                }

                if (currentQuestion.field === "selectedLocations") {
                    const selectedLocations = (answers.selectedLocations || []) as string[];
                    return (
                        <View style={styles.optionsContainer}>
                            <MultiSelectExtendable
                                buttonLabel="Others"
                                initialItemsList={includeSelectedItems(CITIES, selectedLocations)}
                                initialMultiselectItemsList={includeSelectedItems(POPULAR_CITIES, selectedLocations)}
                                onSelectedItemsChange={handleAnswer}
                                selectedItems={selectedLocations}
                                theme={theme}
                            />
                        </View>
                    );
                }

                if (currentQuestion.field === "followerRange") {
                    const followerOptions = currentQuestion.options || [];
                    const selectedFollowerRanges = (answers.followerRange || []) as Array<{
                        min?: number;
                        max?: number;
                    }>;
                    const selectedFollowerLabels = followerOptions
                        .filter((option) =>
                            selectedFollowerRanges.some((range) =>
                                isSameRange(range, option.value)
                            )
                        )
                        .map((option) => option.label);

                    return (
                        <View style={styles.optionsContainer}>
                            <MultiSelectExtendable
                                initialItemsList={followerOptions.map((option) => option.label)}
                                initialMultiselectItemsList={followerOptions.map((option) => option.label)}
                                onSelectedItemsChange={(labels) => {
                                    const nextRanges = followerOptions
                                        .filter((option) => labels.includes(option.label))
                                        .map((option) => option.value);
                                    handleAnswer(nextRanges);
                                }}
                                selectedItems={selectedFollowerLabels}
                                theme={theme}
                            />
                        </View>
                    );
                }

                if (currentQuestion.field === "genders") {
                    const genderLabelByValue = new Map(
                        GENDER_SELECT.map((gender) => [gender.value, gender.label])
                    );
                    const genderValueByLabel = new Map(
                        GENDER_SELECT.map((gender) => [gender.label, gender.value])
                    );
                    const selectedGenderValues = (answers.genders || []) as string[];
                    const selectedGenderLabels = selectedGenderValues.map(
                        (value) => genderLabelByValue.get(value) || value
                    );

                    return (
                        <View style={styles.optionsContainer}>
                            <MultiSelectExtendable
                                initialItemsList={GENDER_SELECT.map((gender) => gender.label)}
                                initialMultiselectItemsList={GENDER_SELECT.map((gender) => gender.label)}
                                onSelectedItemsChange={(labels) =>
                                    handleAnswer(
                                        labels.map((label) => genderValueByLabel.get(label) || label)
                                    )
                                }
                                selectedItems={selectedGenderLabels}
                                theme={theme}
                            />
                        </View>
                    );
                }

                return null;

            default:
                return null;
        }
    };

    const canProceed = () => {
        if (currentQuestion.skippable) return true;
        const answer = answers[currentQuestion.field];
        if (currentQuestion.type === "multiselect") {
            return answer && answer.length > 0;
        }
        return answer !== undefined;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.stepText}>
                            Question {currentStep + 1} of {SURVEY_QUESTIONS.length}
                        </Text>
                        {currentStep > 0 && (
                            <Pressable onPress={handleBack} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={20} color={textColor} />
                                <Text style={styles.backText}>Back</Text>
                            </Pressable>
                        )}
                    </View>
                    <ProgressBar
                        progress={progress}
                        color={primaryColor}
                        style={styles.progressBar}
                    />
                </View>

                <Text style={styles.question}>{currentQuestion.question}</Text>
                {currentQuestion.subtitle && (
                    <Text style={styles.subtitle}>{currentQuestion.subtitle}</Text>
                )}
            </View>

            {renderQuestion()}

            <View style={styles.footer}>
                <View style={styles.buttonContainer}>
                    {currentQuestion.skippable && (
                        <Button
                            mode="text"
                            onPress={handleSkip}
                            style={styles.skipButton}
                            textColor={textColor}
                        >
                            Skip
                        </Button>
                    )}
                    <Button
                        mode="contained"
                        onPress={handleNext}
                        disabled={!canProceed()}
                        style={[
                            styles.nextButton,
                            { backgroundColor: primaryColor },
                        ]}
                        contentStyle={styles.nextButtonContent}
                    >
                        {currentStep === SURVEY_QUESTIONS.length - 1
                            ? "Show Results"
                            : "Next"}
                    </Button>
                </View>
            </View>
        </View>
    );
};

const createDiscoverSurveyStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        container: {
            flex: 1,
            width: "100%",
            maxWidth: 800,
            alignSelf: "center",
            padding: 24,
        },
        header: {
            marginBottom: 32,
        },
        progressSection: {
            marginBottom: 24,
        },
        progressHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
        },
        stepText: {
            fontSize: 14,
            fontWeight: "500",
            opacity: 0.7,
        },
        backButton: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        backText: {
            fontSize: 14,
            fontWeight: "500",
        },
        progressBar: {
            height: 6,
            borderRadius: 3,
        },
        question: {
            fontSize: 28,
            fontWeight: "700",
            marginBottom: 8,
            lineHeight: 36,
        },
        subtitle: {
            fontSize: 16,
            opacity: 0.7,
            lineHeight: 22,
        },
        optionsContainer: {
            flex: 1,
            marginBottom: 20,
        },
        footer: {
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: colors.surveyBorderTop,
        },
        buttonContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
        },
        skipButton: {
            flex: 1,
        },
        nextButton: {
            flex: 2,
        },
        nextButtonContent: {
            paddingVertical: 8,
        },
    });

export default DiscoverSurvey;
