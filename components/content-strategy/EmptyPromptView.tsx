import Colors from "@/shared-uis/constants/Colors";
import { formatTimeToNow } from "@/utils/date";
import { faArrowUp, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { StrategyStatus } from "@/shared-libs/firestore/trendly-pro/models/strategies";
import StrategyActionsMenu from "./StrategyActionsMenu";
import { ContentStrategy, ReviewStatus } from "./types";

interface EmptyPromptViewProps {
    onSubmit: (prompt: string) => void;
    strategies?: ContentStrategy[];
    onSelectStrategy?: (strategy: ContentStrategy) => void;
    onDuplicateStrategy?: (strategy: ContentStrategy) => void;
    onDeleteStrategy?: (strategy: ContentStrategy) => void;
    onShareStrategy?: (strategy: ContentStrategy) => void;
}

const SUGGESTIONS = [
    "Launch a 30-day influencer campaign",
    "Build brand awareness for a new product",
    "Plan seasonal content for Diwali",
    "Grow engagement on Instagram Reels",
];

const RESUME_LIMIT = 3;

// States that mean "user still has work to do" — approved strategies are
// excluded since they need no further action from the brand manager.
const ACTIONABLE_STATUSES: ReviewStatus[] = ["draft", "in_review", "changes_requested"];

type Pill = { label: string; bg: string; text: string };

const STATUS_PILL: Record<ReviewStatus, Pill> = {
    draft: { label: "Draft", bg: "rgba(120,120,120,0.12)", text: "#6B6B6B" },
    in_review: { label: "In Review", bg: "rgba(224,122,0,0.12)", text: "#E07A00" },
    changes_requested: { label: "Changes Requested", bg: "rgba(220,38,38,0.12)", text: "#DC2626" },
    approved: { label: "Approved", bg: "rgba(26,122,58,0.12)", text: "#1A7A3A" },
};

// Finalized (pushed to calendar) is a terminal operational state that sits on
// `status`, not `reviewStatus` — it overrides the review pill so the card
// reflects the real lifecycle state rather than the stale review label.
const FINALIZED_PILL: Pill = { label: "Finalized", bg: "rgba(26,122,58,0.12)", text: "#1A7A3A" };

function pillFor(s: ContentStrategy): Pill {
    if (s.status === StrategyStatus.Finalized) return FINALIZED_PILL;
    return STATUS_PILL[s.reviewStatus] ?? STATUS_PILL.draft;
}

const EmptyPromptView: React.FC<EmptyPromptViewProps> = ({
    onSubmit,
    strategies = [],
    onSelectStrategy,
    onDuplicateStrategy,
    onDeleteStrategy,
    onShareStrategy,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [prompt, setPrompt] = useState("");
    const styles = useMemo(() => useStyles(colors), [colors]);

    const resumeStrategies = useMemo(() => {
        return strategies
            // Finalized strategies are locked/done — not "work to pick up".
            .filter((s) => s.status !== StrategyStatus.Finalized)
            .filter((s) => ACTIONABLE_STATUSES.includes(s.reviewStatus))
            .slice()
            .sort((a, b) => (b.lastEditedAt ?? 0) - (a.lastEditedAt ?? 0))
            .slice(0, RESUME_LIMIT);
    }, [strategies]);

    const hasResume = resumeStrategies.length > 0 && !!onSelectStrategy;

    const handleSubmit = () => {
        const trimmed = prompt.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
        setPrompt("");
    };

    const handleSuggestion = (text: string) => {
        onSubmit(text);
    };

    return (
        <View style={styles.container}>
            <View style={styles.hero}>
                <Text style={styles.heading}>What&apos;s your content strategy goal?</Text>
                <Text style={styles.subheading}>
                    Describe your campaign idea and I&apos;ll build a strategy tailored to your brand.
                </Text>
            </View>

            {!hasResume && (
                <View style={styles.suggestionsRow}>
                    {SUGGESTIONS.map((s) => (
                        <Pressable
                            key={s}
                            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                            onPress={() => handleSuggestion(s)}
                        >
                            <Text style={styles.chipText}>{s}</Text>
                        </Pressable>
                    ))}
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, { outline: "none" } as any]}
                    placeholder="Describe your brand and what you want to achieve…"
                    placeholderTextColor={colors.textSecondary}
                    value={prompt}
                    onChangeText={setPrompt}
                    multiline
                    onSubmitEditing={handleSubmit}
                />
                <Pressable
                    style={({ pressed }) => [
                        styles.sendBtn,
                        pressed && styles.sendBtnPressed,
                        !prompt.trim() && styles.sendBtnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!prompt.trim()}
                >
                    <FontAwesomeIcon icon={faArrowUp} size={16} color={colors.onPrimary} />
                </Pressable>
            </View>

            {hasResume && (
                <View style={styles.resumeSection}>
                    <Text style={styles.resumeLabel}>PICK UP WHERE YOU LEFT OFF</Text>
                    <View style={styles.resumeList}>
                        {resumeStrategies.map((s) => {
                            const pill = pillFor(s);
                            const editedAt = s.lastEditedAt
                                ? formatTimeToNow(new Date(s.lastEditedAt))
                                : s.createdAt;
                            return (
                                <Pressable
                                    key={s.id}
                                    style={({ pressed }) => [
                                        styles.resumeItem,
                                        pressed && styles.resumeItemPressed,
                                    ]}
                                    onPress={() => onSelectStrategy?.(s)}
                                >
                                    <View style={styles.resumeIcon}>
                                        <FontAwesomeIcon
                                            icon={faPenToSquare}
                                            size={14}
                                            color={colors.primary}
                                        />
                                    </View>
                                    <View style={styles.resumeInfo}>
                                        <Text style={styles.resumeTitle} numberOfLines={1}>
                                            {s.title}
                                        </Text>
                                        <View style={styles.resumeMetaRow}>
                                            <Text style={styles.resumeDate} numberOfLines={1}>
                                                {editedAt}
                                            </Text>
                                            <View
                                                style={[styles.statusPill, { backgroundColor: pill.bg }]}
                                            >
                                                <Text style={[styles.statusPillText, { color: pill.text }]}>
                                                    {pill.label}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    {onDuplicateStrategy && onDeleteStrategy ? (
                                        <StrategyActionsMenu
                                            onDuplicate={() => onDuplicateStrategy(s)}
                                            onDelete={() => onDeleteStrategy(s)}
                                            onShare={onShareStrategy ? () => onShareStrategy(s) : undefined}
                                        />
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 24,
                    paddingBottom: 40,
                    gap: 32,
                },
                hero: {
                    alignItems: "center",
                    maxWidth: 560,
                    gap: 12,
                },
                heading: {
                    fontSize: 28,
                    fontWeight: "700",
                    color: colors.text,
                    textAlign: "center",
                    letterSpacing: -0.5,
                },
                subheading: {
                    fontSize: 15,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 22,
                },
                suggestionsRow: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 10,
                    maxWidth: 680,
                },
                chip: {
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 20,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                chipPressed: {
                    opacity: 0.7,
                },
                chipText: {
                    fontSize: 13,
                    fontWeight: "500",
                    color: colors.text,
                },
                inputContainer: {
                    width: "100%",
                    maxWidth: 680,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    gap: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 16,
                    shadowOpacity: 0.08,
                    elevation: 6,
                },
                input: {
                    flex: 1,
                    maxHeight: 140,
                    fontSize: 15,
                    color: colors.text,
                    lineHeight: 22,
                },
                sendBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                sendBtnPressed: {
                    opacity: 0.75,
                },
                sendBtnDisabled: {
                    opacity: 0.35,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                resumeSection: {
                    width: "100%",
                    maxWidth: 680,
                    gap: 12,
                },
                resumeLabel: {
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1,
                    color: colors.textSecondary,
                    textAlign: "center",
                },
                resumeList: {
                    gap: 8,
                },
                resumeItem: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    minHeight: 64,
                    borderRadius: 12,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                resumeItemPressed: {
                    opacity: 0.75,
                },
                resumeIcon: {
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.aliceBlue,
                },
                resumeInfo: {
                    flex: 1,
                    gap: 4,
                },
                resumeTitle: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.text,
                },
                resumeMetaRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                },
                resumeDate: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    flexShrink: 1,
                },
                statusPill: {
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                },
                statusPillText: {
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 0.3,
                },
            }),
        [colors]
    );
}

export default EmptyPromptView;
