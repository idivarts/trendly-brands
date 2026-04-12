import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import BottomSheetScrollContainer from "@/shared-uis/components/bottom-sheet/scroll-view";
import { faClose, faStar as faStarSolid } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { Modal as PaperModal, Portal } from "react-native-paper";
import { Text } from "../../theme/Themed";
import Button from "../../ui/button";
import TextInput from "../../ui/text-input";
import { submitBrandFeedback } from "../api/feedback-pending.api";

export interface BrandFeedbackModalProps {
    visible: boolean;
    onClose: () => void;
    contractId: string;
    refreshData: () => void;
    initialRating?: number;
}

const BrandFeedbackModal: React.FC<BrandFeedbackModalProps> = ({
    visible,
    onClose,
    contractId,
    refreshData,
    initialRating = 0,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [selectedRating, setSelectedRating] = useState(initialRating);
    const [feedbackReview, setFeedbackReview] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleDismiss = () => {
        setSelectedRating(initialRating);
        setFeedbackReview("");
        onClose();
    };

    const handleSubmit = async () => {
        if (selectedRating < 1 || selectedRating > 5) {
            Toaster.error("Please select a rating between 1 and 5.");
            return;
        }

        setSubmitting(true);
        try {
            await submitBrandFeedback({
                contractId,
                ratings: selectedRating,
                feedbackReview: feedbackReview.trim() || undefined,
            });
            Toaster.success("Feedback submitted successfully.");
            handleDismiss();
            refreshData();
        } catch (e) {
            const message = e instanceof Error ? e.message : undefined;
            Toaster.error(message ?? "Failed to submit feedback.");
        } finally {
            setSubmitting(false);
        }
    };

    const content = (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
        >
            <Pressable
                style={styles.contentWrap}
                onPress={() => Platform.OS !== "web" && Keyboard.dismiss()}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Give Feedback</Text>
                    <Pressable onPress={handleDismiss} hitSlop={12}>
                        <FontAwesomeIcon icon={faClose} color={colors.primary} size={20} />
                    </Pressable>
                </View>
                <Text style={styles.subtitle}>
                    Rate the influencer and optionally add your review.
                </Text>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.label}>Rating</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((rating) => {
                            const selected = rating <= selectedRating;
                            return (
                                <Pressable
                                    key={rating}
                                    onPress={() => setSelectedRating(rating)}
                                    hitSlop={8}
                                    style={styles.starButton}
                                >
                                    <FontAwesomeIcon
                                        icon={selected ? faStarSolid : faStarRegular}
                                        color={selected ? colors.yellow : colors.gray300}
                                        size={28}
                                    />
                                </Pressable>
                            );
                        })}
                    </View>

                    <Text style={styles.label}>Review (optional)</Text>
                    <TextInput
                        value={feedbackReview}
                        onChangeText={setFeedbackReview}
                        placeholder="Share your experience..."
                        multiline
                        numberOfLines={4}
                        style={styles.input}
                    />

                    <View style={styles.actions}>
                        <Button
                            mode="outlined"
                            style={styles.button}
                            onPress={handleDismiss}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            style={styles.button}
                            onPress={handleSubmit}
                            disabled={submitting || selectedRating < 1}
                        >
                            {submitting ? "Submitting..." : "Submit Feedback"}
                        </Button>
                    </View>
                </ScrollView>
            </Pressable>
        </KeyboardAvoidingView>
    );

    if (Platform.OS !== "web") {
        return (
            <BottomSheetScrollContainer
                isVisible={visible}
                snapPointsRange={["55%", "75%"]}
                onClose={handleDismiss}
            >
                {content}
            </BottomSheetScrollContainer>
        );
    }

    return (
        <Portal>
            <PaperModal
                visible={visible}
                onDismiss={handleDismiss}
                contentContainerStyle={styles.webModalContainer}
            >
                {content}
            </PaperModal>
        </Portal>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    const isNative = Platform.OS !== "web";
    return StyleSheet.create({
        webModalContainer: {
            backgroundColor: colors.background,
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 18,
            marginHorizontal: 24,
            width: "100%",
            maxWidth: 520,
            alignSelf: "center",
        },
        keyboardView: {
            width: "100%",
            ...(isNative && { paddingHorizontal: 14 }),
        },
        contentWrap: {
            width: "100%",
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            fontSize: 14,
            color: colors.gray100,
            marginBottom: 16,
            lineHeight: 20,
        },
        scrollView: {
            width: "100%",
        },
        scrollContent: {
            paddingBottom: 12,
        },
        label: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.gray100,
            marginBottom: 8,
        },
        starsRow: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 18,
            gap: 12,
        },
        starButton: {
            paddingVertical: 4,
        },
        input: {
            minHeight: 96,
            textAlignVertical: "top",
            marginBottom: 18,
        },
        actions: {
            flexDirection: "row",
            gap: 12,
        },
        button: {
            flex: 1,
        },
    });
}

export default BrandFeedbackModal;

