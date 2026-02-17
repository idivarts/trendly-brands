import { Text, View } from "@/components/theme/Themed";
import { INFLUENCER_CATEGORIES } from "@/constants/ItemsList";
import { GENDER_SELECT } from "@/shared-constants/preferences/gender";
import { POPULAR_CITIES } from "@/shared-constants/preferences/locations";
import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import Colors from "@/shared-uis/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { Button, Chip, ProgressBar } from "react-native-paper";

interface DiscoverSurveyProps {
    onComplete: (filters: IAdvanceFilters) => void;
}

interface SurveyQuestion {
    id: string;
    question: string;
    subtitle?: string;
    type: "multiselect" | "range" | "single-select" | "slider";
    field: keyof IAdvanceFilters | "followerRange" | "budgetRange";
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
        options: INFLUENCER_CATEGORIES.map((cat) => ({
            label: cat,
            value: cat,
        })),
        skippable: true,
    },
    {
        id: "followers",
        question: "What's your ideal follower range?",
        subtitle: "Target influencers with the right audience size",
        type: "single-select",
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
        id: "engagement",
        question: "What level of engagement are you targeting?",
        subtitle: "Higher engagement rates often mean better campaign performance",
        type: "single-select",
        field: "budgetRange",
        options: [
            { label: "High Engagement (5%+)", value: { min: 5, max: undefined } },
            { label: "Good Engagement (2% - 5%)", value: { min: 2, max: 5 } },
            { label: "Standard Engagement (1% - 2%)", value: { min: 1, max: 2 } },
            { label: "Any Engagement", value: { min: undefined, max: undefined } },
        ],
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
    {
        id: "quality",
        question: "What content quality are you looking for?",
        subtitle: "Filter by aesthetic and production quality",
        type: "single-select",
        field: "qualityMin",
        options: [
            { label: "High Quality (80+)", value: 80 },
            { label: "Good Quality (60+)", value: 60 },
            { label: "Standard Quality (40+)", value: 40 },
            { label: "Any Quality", value: undefined },
        ],
        skippable: true,
    },
];

const DiscoverSurvey: React.FC<DiscoverSurveyProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const theme = useTheme();
    const primaryColor = Colors(theme).primary;
    const textColor = Colors(theme).text;

    const currentQuestion = SURVEY_QUESTIONS[currentStep];
    const progress = (currentStep + 1) / SURVEY_QUESTIONS.length;

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

            // Handle follower range
            if (answers.followerRange) {
                filters.followerMin = answers.followerRange.min;
                filters.followerMax = answers.followerRange.max;
            }

            // Handle engagement rate (budgetRange field temporarily)
            if (answers.budgetRange) {
                filters.erMin = answers.budgetRange.min;
                filters.erMax = answers.budgetRange.max;
            }

            // Handle quality
            if (answers.qualityMin !== undefined) {
                filters.qualityMin = answers.qualityMin;
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

    const toggleMultiSelect = (value: any) => {
        const currentValues = answers[currentQuestion.field] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter((v: any) => v !== value)
            : [...currentValues, value];
        handleAnswer(newValues);
    };

    const renderQuestion = () => {
        switch (currentQuestion.type) {
            case "multiselect":
                return (
                    <ScrollView style={styles.optionsContainer}>
                        <View style={styles.chipsContainer}>
                            {currentQuestion.options?.map((option) => {
                                const isSelected = (
                                    answers[currentQuestion.field] || []
                                ).includes(option.value);
                                return (
                                    <Chip
                                        key={option.value}
                                        selected={isSelected}
                                        onPress={() => toggleMultiSelect(option.value)}
                                        style={[
                                            styles.chip,
                                            isSelected && {
                                                backgroundColor: primaryColor,
                                            },
                                        ]}
                                        textStyle={[
                                            styles.chipText,
                                            isSelected && { color: "#fff" },
                                        ]}
                                    >
                                        {option.label}
                                    </Chip>
                                );
                            })}
                        </View>
                    </ScrollView>
                );

            case "single-select":
                return (
                    <ScrollView style={styles.optionsContainer}>
                        <View style={styles.singleSelectContainer}>
                            {currentQuestion.options?.map((option) => {
                                const isSelected =
                                    JSON.stringify(answers[currentQuestion.field]) ===
                                    JSON.stringify(option.value);
                                return (
                                    <Pressable
                                        key={option.label}
                                        onPress={() => handleAnswer(option.value)}
                                        style={[
                                            styles.singleSelectOption,
                                        ]}
                                    >
                                        <View style={styles.radioContainer}>
                                            <View
                                                style={[
                                                    styles.radioOuter,
                                                    isSelected && {
                                                        borderColor: primaryColor,
                                                    },
                                                ]}
                                            >
                                                {isSelected && (
                                                    <View
                                                        style={[
                                                            styles.radioInner,
                                                            { backgroundColor: primaryColor },
                                                        ]}
                                                    />
                                                )}
                                            </View>
                                            <Text
                                                style={[
                                                    styles.optionText,
                                                    isSelected && {
                                                        fontWeight: "600",
                                                    },
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </ScrollView>
                );

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

const styles = StyleSheet.create({
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
    chipsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    chip: {
        marginBottom: 0,
    },
    chipText: {
        fontSize: 14,
    },
    singleSelectContainer: {
        gap: 12,

    },
    singleSelectOption: {
        backgroundColor: "rgba(0, 0, 0, 0.03)",
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: "transparent",
    },
    radioContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "rgba(0, 0, 0, 0.03)",

    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#ccc",
        justifyContent: "center",
        alignItems: "center",
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    optionText: {
        fontSize: 16,
        fontWeight: "500",
    },
    footer: {
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "rgba(0, 0, 0, 0.1)",
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
