import { Text, View } from "@/components/theme/Themed";
import { useNiche } from "@/contexts";
import { GENDER_SELECT } from "@/shared-constants/preferences/gender";
import {
    CITIES,
    POPULAR_CITIES,
} from "@/shared-constants/preferences/locations";
import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import BottomSheetContainer from "@/shared-uis/components/bottom-sheet";
import Colors from "@/shared-uis/constants/Colors";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
} from "react-native";
import { Button, Chip, ProgressBar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DiscoverSurveyProps {
    onComplete: (filters: IAdvanceFilters) => void;
}

interface SurveyQuestion {
    id: string;
    question: string;
    subtitle?: string;
    type: "multiselect" | "range" | "slider";
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

const DiscoverSurvey: React.FC<DiscoverSurveyProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [locationOthersSheetVisible, setLocationOthersSheetVisible] = useState(false);
    const [locationSearchText, setLocationSearchText] = useState("");
    const [nicheOthersSheetVisible, setNicheOthersSheetVisible] = useState(false);
    const [nicheSearchText, setNicheSearchText] = useState("");
    const [nicheSearchResults, setNicheSearchResults] = useState<string[]>([]);
    const [nicheSearchLoading, setNicheSearchLoading] = useState(false);
    const theme = useTheme();
    const colors = Colors(theme);
    const primaryColor = colors.primary;
    const textColor = colors.text;
    const styles = useMemo(() => createDiscoverSurveyStyles(colors), [colors]);

    const { niches: topNiches, searchNiches } = useNiche();
    const insets = useSafeAreaInsets();
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

    const toggleMultiSelect = (value: any) => {
        const currentValues = answers[currentQuestion.field] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter((v: any) => v !== value)
            : [...currentValues, value];
        handleAnswer(newValues);
    };

    const selectedNiches = (answers.selectedNiches || []) as string[];
    const nicheOtherSelections = selectedNiches.filter((n) => !topNiches.includes(n));

    // Other niches list for the sheet: search results minus top niches so we don't duplicate
    const nicheSheetOptions = useMemo(
        () => nicheSearchResults.filter((n) => !topNiches.includes(n)),
        [nicheSearchResults, topNiches]
    );

    const nicheSheetSnapPoints = useMemo(() => ["50%", "75%", "100%"], []);

    const selectedLocations = (answers.selectedLocations || []) as string[];
    const locationOtherCities = selectedLocations.filter((c) => !POPULAR_CITIES.includes(c));
    const locationSheetCities = useMemo(
        () => includeSelectedItems(CITIES, selectedLocations),
        [selectedLocations]
    );
    const filteredLocationSheetCities = useMemo(() => {
        if (!locationSearchText.trim()) return locationSheetCities;
        const q = locationSearchText.toLowerCase();
        return locationSheetCities.filter((c) => c.toLowerCase().includes(q));
    }, [locationSheetCities, locationSearchText]);

    const handleLocationOtherSelect = (city: string) => {
        const next = selectedLocations.includes(city)
            ? selectedLocations.filter((c) => c !== city)
            : [...selectedLocations, city];
        handleAnswer(next);
        setLocationOthersSheetVisible(false);
    };

    const handleNicheOtherSelect = (niche: string) => {
        const next = selectedNiches.includes(niche)
            ? selectedNiches.filter((n) => n !== niche)
            : [...selectedNiches, niche];
        handleAnswer(next);
        setNicheOthersSheetVisible(false);
    };

    // Debounced search for niche Others sheet + load initial list when sheet opens
    useEffect(() => {
        if (!nicheOthersSheetVisible) return;
        const query = nicheSearchText.trim();
        const t = setTimeout(async () => {
            setNicheSearchLoading(true);
            try {
                const results = await searchNiches(query || "");
                setNicheSearchResults(results.map((item) => item.niche));
            } catch {
                setNicheSearchResults([]);
            } finally {
                setNicheSearchLoading(false);
            }
        }, query ? 300 : 0);
        return () => clearTimeout(t);
    }, [nicheOthersSheetVisible, nicheSearchText, searchNiches]);

    const renderQuestion = () => {
        switch (currentQuestion.type) {
            case "multiselect":
                if (currentQuestion.field === "selectedNiches") {
                    return (
                        <>
                            <ScrollView style={styles.optionsContainer}>
                                <View style={styles.chipsContainer}>
                                    {topNiches.map((niche) => {
                                        const isSelected = selectedNiches.includes(niche);
                                        return (
                                            <Chip
                                                key={niche}
                                                selected={isSelected}
                                                onPress={() => toggleMultiSelect(niche)}
                                                style={[
                                                    styles.chip,
                                                    isSelected && {
                                                        backgroundColor: primaryColor,
                                                    },
                                                ]}
                                                textStyle={[
                                                    styles.chipText,
                                                    isSelected && { color: colors.white },
                                                ]}
                                            >
                                                {niche}
                                            </Chip>
                                        );
                                    })}
                                    {nicheOtherSelections.map((niche) => {
                                        const isSelected = selectedNiches.includes(niche);
                                        return (
                                            <Chip
                                                key={niche}
                                                selected={isSelected}
                                                onPress={() => toggleMultiSelect(niche)}
                                                style={[
                                                    styles.chip,
                                                    isSelected && {
                                                        backgroundColor: primaryColor,
                                                    },
                                                ]}
                                                textStyle={[
                                                    styles.chipText,
                                                    isSelected && { color: colors.white },
                                                ]}
                                            >
                                                {niche}
                                            </Chip>
                                        );
                                    })}
                                    <Chip
                                        selected={false}
                                        onPress={() => setNicheOthersSheetVisible(true)}
                                        style={[styles.chip, styles.othersChip]}
                                        textStyle={[styles.chipText, { color: primaryColor }]}
                                        icon={() => (
                                            <Ionicons
                                                name="chevron-forward"
                                                size={16}
                                                color={primaryColor}
                                            />
                                        )}
                                    >
                                        Others
                                    </Chip>
                                </View>
                            </ScrollView>
                            {nicheOthersSheetVisible && (
                                <BottomSheetContainer
                                    isVisible={nicheOthersSheetVisible}
                                    onClose={() => {
                                        setNicheOthersSheetVisible(false);
                                        setNicheSearchText("");
                                        setNicheSearchResults([]);
                                    }}
                                    useBottomSheetView={false}
                                    enablePanDownToClose
                                    index={0}
                                    snapPoints={nicheSheetSnapPoints}
                                    topInset={insets.top}
                                    backgroundStyle={{
                                        backgroundColor: Colors(theme).background,
                                    }}
                                    handleIndicatorStyle={{
                                        backgroundColor: primaryColor,
                                    }}
                                >
                                    <View style={styles.locationSheetContent}>
                                        <TextInput
                                            style={[
                                                styles.locationSearchInput,
                                                {
                                                    borderColor: primaryColor,
                                                    color: Colors(theme).text,
                                                },
                                            ]}
                                            value={nicheSearchText}
                                            onChangeText={setNicheSearchText}
                                            placeholder="Search niches"
                                            placeholderTextColor={Colors(theme).gray300}
                                            autoCapitalize="none"
                                        />
                                        {nicheSearchLoading ? (
                                            <View style={{ padding: 24, alignItems: "center" }}>
                                                <Text style={{ color: Colors(theme).text }}>Searching...</Text>
                                            </View>
                                        ) : (
                                            <BottomSheetScrollView
                                                style={styles.locationSheetList}
                                                keyboardShouldPersistTaps="handled"
                                            >
                                                {nicheSheetOptions.length === 0 ? (
                                                    <View style={{ padding: 24, alignItems: "center" }}>
                                                        <Text style={{ color: Colors(theme).textSecondary, textAlign: "center" }}>
                                                            {nicheSearchText.trim()
                                                                ? "No niches found. Try a different search."
                                                                : "Loading other niches…"}
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <>
                                                        {nicheSheetOptions.map((niche) => {
                                                            const isSelected = selectedNiches.includes(niche);
                                                            return (
                                                                <Pressable
                                                                    key={niche}
                                                                    style={[
                                                                        styles.locationSheetItem,
                                                                        isSelected && {
                                                                            backgroundColor: primaryColor,
                                                                        },
                                                                    ]}
                                                                    onPress={() => handleNicheOtherSelect(niche)}
                                                                >
                                                                    <Text
                                                                        style={[
                                                                            styles.locationSheetItemText,
                                                                            {
                                                                                color: isSelected
                                                                                    ? colors.white
                                                                                    : Colors(theme).text,
                                                                            },
                                                                        ]}
                                                                    >
                                                                        {niche}
                                                                    </Text>
                                                                    {isSelected && (
                                                                        <Ionicons
                                                                            name="checkmark"
                                                                            size={20}
                                                                            color={colors.white}
                                                                        />
                                                                    )}
                                                                </Pressable>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </BottomSheetScrollView>
                                        )}
                                    </View>
                                </BottomSheetContainer>
                            )}
                        </>
                    );
                }
                if (currentQuestion.field === "selectedLocations") {
                    return (
                        <>
                            <ScrollView style={styles.optionsContainer}>
                                <View style={styles.chipsContainer}>
                                    {POPULAR_CITIES.map((city) => {
                                        const isSelected = selectedLocations.includes(city);
                                        return (
                                            <Chip
                                                key={city}
                                                selected={isSelected}
                                                onPress={() => toggleMultiSelect(city)}
                                                style={[
                                                    styles.chip,
                                                    isSelected && {
                                                        backgroundColor: primaryColor,
                                                    },
                                                ]}
                                                textStyle={[
                                                    styles.chipText,
                                                    isSelected && { color: colors.white },
                                                ]}
                                            >
                                                {city}
                                            </Chip>
                                        );
                                    })}
                                    {locationOtherCities.map((city) => {
                                        const isSelected = selectedLocations.includes(city);
                                        return (
                                            <Chip
                                                key={city}
                                                selected={isSelected}
                                                onPress={() => toggleMultiSelect(city)}
                                                style={[
                                                    styles.chip,
                                                    isSelected && {
                                                        backgroundColor: primaryColor,
                                                    },
                                                ]}
                                                textStyle={[
                                                    styles.chipText,
                                                    isSelected && { color: colors.white },
                                                ]}
                                            >
                                                {city}
                                            </Chip>
                                        );
                                    })}
                                    <Chip
                                        selected={false}
                                        onPress={() => setLocationOthersSheetVisible(true)}
                                        style={[styles.chip, styles.othersChip]}
                                        textStyle={[styles.chipText, { color: primaryColor }]}
                                        icon={() => (
                                            <Ionicons
                                                name="chevron-forward"
                                                size={16}
                                                color={primaryColor}
                                            />
                                        )}
                                    >
                                        Others
                                    </Chip>
                                </View>
                            </ScrollView>
                            {locationOthersSheetVisible && (
                                <BottomSheetContainer
                                    isVisible={locationOthersSheetVisible}
                                    onClose={() => {
                                        setLocationOthersSheetVisible(false);
                                        setLocationSearchText("");
                                    }}
                                    useBottomSheetView={false}
                                    enablePanDownToClose
                                    snapPoints={["50%", "75%", "100%"]}
                                    topInset={insets.top}
                                    backgroundStyle={{
                                        backgroundColor: Colors(theme).background,
                                    }}
                                    handleIndicatorStyle={{
                                        backgroundColor: primaryColor,
                                    }}
                                >
                                    <View style={styles.locationSheetContent}>
                                        <TextInput
                                            style={[
                                                styles.locationSearchInput,
                                                {
                                                    borderColor: primaryColor,
                                                    color: Colors(theme).text,
                                                },
                                            ]}
                                            value={locationSearchText}
                                            onChangeText={setLocationSearchText}
                                            placeholder="Search cities"
                                            placeholderTextColor={Colors(theme).gray300}
                                            autoCapitalize="none"
                                        />
                                        <BottomSheetScrollView
                                            style={styles.locationSheetList}
                                            keyboardShouldPersistTaps="handled"
                                        >
                                            {filteredLocationSheetCities.map((city) => {
                                                const isSelected = selectedLocations.includes(city);
                                                return (
                                                    <Pressable
                                                        key={city}
                                                        style={[
                                                            styles.locationSheetItem,
                                                            isSelected && {
                                                                backgroundColor: primaryColor,
                                                            },
                                                        ]}
                                                        onPress={() => handleLocationOtherSelect(city)}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.locationSheetItemText,
                                                                {
                                                                    color: isSelected
                                                                        ? colors.white
                                                                        : Colors(theme).text,
                                                                },
                                                            ]}
                                                        >
                                                            {city}
                                                        </Text>
                                                        {isSelected && (
                                                            <Ionicons
                                                                name="checkmark"
                                                                size={20}
                                                                color={colors.white}
                                                            />
                                                        )}
                                                    </Pressable>
                                                );
                                            })}
                                        </BottomSheetScrollView>
                                    </View>
                                </BottomSheetContainer>
                            )}
                        </>
                    );
                }
                return (
                    <ScrollView style={styles.optionsContainer}>
                        <View style={styles.chipsContainer}>
                            {currentQuestion.options?.map((option) => {
                                const isSelected = (
                                    answers[currentQuestion.field] || []
                                ).some(
                                    (v: any) =>
                                        typeof v === "object" && v !== null && typeof option.value === "object" && option.value !== null
                                            ? v.min === option.value.min && v.max === option.value.max
                                            : v === option.value
                                );
                                return (
                                    <Chip
                                        key={option.label}
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
                                            isSelected && { color: colors.white },
                                        ]}
                                    >
                                        {option.label}
                                    </Chip>
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
        othersChip: {
            borderWidth: 1,
            borderColor: colors.surveyOutline,
        },
        locationSheetContent: {
            padding: 16,
            paddingTop: Platform.OS === "web" ? 30 : 16,
            paddingBottom: 20,
        },
        locationSearchInput: {
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 16,
            fontSize: 16,
        },
        locationSheetList: {
            maxHeight: 400,
        },
        locationSheetItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.surveyOutlineLight,
        },
        locationSheetItemText: {
            fontSize: 16,
            fontWeight: "500",
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
