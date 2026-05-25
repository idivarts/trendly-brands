import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import { CollaborationLocationType } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { IS_LIVE } from "@/shared-libs/utils/environment";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import {
    faChevronRight,
    faHandshake,
    faMinus,
    faPlus,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export interface CollabContentSource {
    contentId: string;
    title: string;
    idea?: string;
    type: string;
    date?: string;
}

interface CreateCollabFromContentModalProps {
    visible: boolean;
    content: CollabContentSource | null;
    onClose: () => void;
    onSuccess?: (collabId: string) => void;
}

const PROMOTION_SUBJECT_OPTIONS = [
    { key: "physical-product", label: "Physical Product" },
    { key: "services", label: "Services" },
    { key: "others", label: "Other" },
] as const;

type PromotionSubject = "physical-product" | "services" | "others";

const FULFILLMENT_TYPES = [
    "Product Shipment",
    "Digital Delivery",
    "On-site Visit",
    "Service Access",
];

function contentTypeToFormat(type: string): string[] {
    const map: Record<string, string> = {
        reel: "Reels",
        post: "Posts",
        story: "Stories",
        carousel: "Posts",
        live: "Live",
    };
    return [map[type] ?? "Posts"];
}

const CreateCollabFromContentModal: React.FC<CreateCollabFromContentModalProps> = ({
    visible,
    content,
    onClose,
    onSuccess,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();
    const router = useRouter();

    const [promotionType, setPromotionType] = useState<"paid" | "barter">("paid");
    const [budgetMin, setBudgetMin] = useState("");
    const [budgetMax, setBudgetMax] = useState("");
    const [promotionSubject, setPromotionSubject] = useState<PromotionSubject | null>(null);
    const [fulfillmentType, setFulfillmentType] = useState<string | null>(null);
    const [questions, setQuestions] = useState<string[]>([""]);
    const [submitting, setSubmitting] = useState(false);

    const isPaid = promotionType === "paid";

    const canSubmit =
        !submitting &&
        promotionSubject !== null &&
        fulfillmentType !== null &&
        (!isPaid || budgetMin.trim() !== "" || budgetMax.trim() !== "");

    const handleAddQuestion = () => setQuestions((q) => [...q, ""]);
    const handleRemoveQuestion = (i: number) =>
        setQuestions((q) => q.filter((_, idx) => idx !== i));
    const handleQuestionChange = (i: number, val: string) =>
        setQuestions((q) => q.map((v, idx) => (idx === i ? val : v)));

    const reset = () => {
        setPromotionType("paid");
        setBudgetMin("");
        setBudgetMax("");
        setPromotionSubject(null);
        setFulfillmentType(null);
        setQuestions([""]);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async () => {
        if (!selectedBrand || !content) return;
        setSubmitting(true);
        try {
            const uid = AuthApp.currentUser?.uid ?? manager?.id ?? "";
            const nonEmptyQuestions = questions.filter((q) => q.trim().length > 0);

            const payload: Record<string, any> = {
                name: content.title,
                description: content.idea ?? "",
                version: 2,
                contentId: content.contentId,
                brandId: selectedBrand.id,
                managerId: uid,
                status: "draft",
                isLive: IS_LIVE,
                timeStamp: Date.now(),
                promotionType: isPaid ? PromotionType.PAID_COLLAB : PromotionType.BARTER_COLLAB,
                promotionSubject,
                collaborationFulfillmentType: fulfillmentType,
                questionsToInfluencers: nonEmptyQuestions,
                contentFormat: contentTypeToFormat(content.type),
                platform: ["Instagram"],
                preferredContentLanguage: ["English"],
                location: { type: CollaborationLocationType.Remote },
                preferences: {},
                numberOfInfluencersNeeded: 1,
            };

            if (isPaid) {
                const min = parseFloat(budgetMin);
                const max = parseFloat(budgetMax);
                payload.budget = {
                    ...(isNaN(min) ? {} : { min }),
                    ...(isNaN(max) ? {} : { max }),
                };
            }

            const ref = await addDoc(collection(FirestoreDB, "collaborations"), payload);
            Toaster.success("Collaboration draft created!");
            reset();
            onClose();
            onSuccess?.(ref.id);
            router.push(`/collaboration-details/${ref.id}`);
        } catch (err) {
            Toaster.error("Failed to create collaboration. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.backdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
                    <View style={styles.sheet}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerIcon}>
                                <FontAwesomeIcon icon={faHandshake} size={16} color={colors.primary} />
                            </View>
                            <View style={styles.headerText}>
                                <Text style={styles.headerTitle}>Create Collab Requirement</Text>
                                {content ? (
                                    <Text style={styles.headerSub} numberOfLines={1}>
                                        {content.title}
                                    </Text>
                                ) : null}
                            </View>
                            <Pressable onPress={handleClose} style={styles.closeBtn}>
                                <FontAwesomeIcon icon={faXmark} size={16} color={colors.textSecondary} />
                            </Pressable>
                        </View>

                        <ScrollView
                            style={styles.body}
                            contentContainerStyle={styles.bodyContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Budget */}
                            <Text style={styles.sectionLabel}>BUDGET</Text>
                            <View style={styles.toggleRow}>
                                {(["paid", "barter"] as const).map((opt) => (
                                    <Pressable
                                        key={opt}
                                        style={[
                                            styles.toggleChip,
                                            promotionType === opt && styles.toggleChipActive,
                                        ]}
                                        onPress={() => setPromotionType(opt)}
                                    >
                                        <Text
                                            style={[
                                                styles.toggleChipText,
                                                promotionType === opt && styles.toggleChipTextActive,
                                            ]}
                                        >
                                            {opt === "paid" ? "Paid" : "Barter"}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {isPaid && (
                                <View style={styles.budgetRow}>
                                    <View style={styles.budgetField}>
                                        <Text style={styles.fieldLabel}>Min (₹)</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. 5000"
                                            placeholderTextColor={colors.textSecondary}
                                            value={budgetMin}
                                            onChangeText={setBudgetMin}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.budgetDash}>
                                        <Text style={styles.budgetDashText}>–</Text>
                                    </View>
                                    <View style={styles.budgetField}>
                                        <Text style={styles.fieldLabel}>Max (₹)</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. 20000"
                                            placeholderTextColor={colors.textSecondary}
                                            value={budgetMax}
                                            onChangeText={setBudgetMax}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Promotion Subject */}
                            <Text style={[styles.sectionLabel, styles.mt20]}>WHAT ARE YOU PROMOTING</Text>
                            <View style={styles.chipRow}>
                                {PROMOTION_SUBJECT_OPTIONS.map((opt) => (
                                    <Pressable
                                        key={opt.key}
                                        style={[
                                            styles.chip,
                                            promotionSubject === opt.key && styles.chipActive,
                                        ]}
                                        onPress={() => setPromotionSubject(opt.key)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                promotionSubject === opt.key && styles.chipTextActive,
                                            ]}
                                        >
                                            {opt.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Fulfilment Type */}
                            <Text style={[styles.sectionLabel, styles.mt20]}>COLLABORATION FULFILMENT TYPE</Text>
                            <View style={styles.chipRow}>
                                {FULFILLMENT_TYPES.map((ft) => (
                                    <Pressable
                                        key={ft}
                                        style={[
                                            styles.chip,
                                            fulfillmentType === ft && styles.chipActive,
                                        ]}
                                        onPress={() => setFulfillmentType(ft)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                fulfillmentType === ft && styles.chipTextActive,
                                            ]}
                                        >
                                            {ft}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Questions to Influencers */}
                            <Text style={[styles.sectionLabel, styles.mt20]}>QUESTIONS TO INFLUENCERS</Text>
                            <Text style={styles.hint}>
                                Ask influencers anything before they apply — deliverables, experience, availability.
                            </Text>
                            {questions.map((q, i) => (
                                <View key={i} style={styles.questionRow}>
                                    <TextInput
                                        style={[styles.input, styles.questionInput]}
                                        placeholder={`Question ${i + 1}`}
                                        placeholderTextColor={colors.textSecondary}
                                        value={q}
                                        onChangeText={(v) => handleQuestionChange(i, v)}
                                        maxLength={200}
                                    />
                                    {questions.length > 1 && (
                                        <Pressable
                                            style={styles.removeBtn}
                                            onPress={() => handleRemoveQuestion(i)}
                                        >
                                            <FontAwesomeIcon
                                                icon={faMinus}
                                                size={12}
                                                color={colors.textSecondary}
                                            />
                                        </Pressable>
                                    )}
                                </View>
                            ))}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.addQuestionBtn,
                                    pressed && styles.pressed,
                                ]}
                                onPress={handleAddQuestion}
                            >
                                <FontAwesomeIcon icon={faPlus} size={12} color={colors.primary} />
                                <Text style={styles.addQuestionText}>Add Question</Text>
                            </Pressable>

                            {/* Inherited fields notice */}
                            <View style={styles.inheritedCard}>
                                <Text style={styles.inheritedLabel}>INHERITED FROM CONTENT</Text>
                                <View style={styles.inheritedRow}>
                                    <Text style={styles.inheritedKey}>Format</Text>
                                    <Text style={styles.inheritedValue}>
                                        {content ? contentTypeToFormat(content.type).join(", ") : "—"}
                                    </Text>
                                </View>
                                <View style={styles.inheritedRow}>
                                    <Text style={styles.inheritedKey}>Platform</Text>
                                    <Text style={styles.inheritedValue}>Instagram</Text>
                                </View>
                                <View style={styles.inheritedRow}>
                                    <Text style={styles.inheritedKey}>Language</Text>
                                    <Text style={styles.inheritedValue}>English</Text>
                                </View>
                                <View style={styles.inheritedRow}>
                                    <Text style={styles.inheritedKey}>Name &amp; Description</Text>
                                    <Text style={styles.inheritedValue}>From content title &amp; idea</Text>
                                </View>
                            </View>

                            <View style={styles.bottomPad} />
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Pressable
                                style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                                onPress={handleClose}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.submitBtn,
                                    !canSubmit && styles.submitBtnDisabled,
                                    pressed && styles.pressed,
                                ]}
                                onPress={handleSubmit}
                                disabled={!canSubmit}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color={colors.onPrimary} />
                                ) : (
                                    <>
                                        <Text style={styles.submitText}>Save as Draft</Text>
                                        <FontAwesomeIcon
                                            icon={faChevronRight}
                                            size={13}
                                            color={colors.onPrimary}
                                        />
                                    </>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                flex1: { flex: 1 },
                backdrop: {
                    flex: 1,
                    backgroundColor: colors.backdrop,
                    justifyContent: "flex-end",
                },
                sheet: {
                    backgroundColor: colors.card,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: "92%",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -6 },
                    shadowRadius: 20,
                    shadowOpacity: 0.12,
                    elevation: 16,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 2,
                },
                headerIcon: {
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.aliceBlue,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                },
                headerText: { flex: 1, gap: 2 },
                headerTitle: {
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                },
                headerSub: {
                    fontSize: 12,
                    color: colors.textSecondary,
                },
                closeBtn: { padding: 4 },
                body: { flexShrink: 1 },
                bodyContent: {
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: 8,
                },
                sectionLabel: {
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1,
                    color: colors.textSecondary,
                    marginBottom: 10,
                },
                mt20: { marginTop: 20 },
                toggleRow: {
                    flexDirection: "row",
                    gap: 8,
                },
                toggleChip: {
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                toggleChipActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                toggleChipText: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                toggleChipTextActive: {
                    color: colors.onPrimary,
                },
                budgetRow: {
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 8,
                    marginTop: 12,
                },
                budgetField: { flex: 1, gap: 4 },
                budgetDash: {
                    paddingBottom: 10,
                },
                budgetDashText: {
                    fontSize: 18,
                    color: colors.textSecondary,
                    fontWeight: "300",
                },
                fieldLabel: {
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 4,
                },
                input: {
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: colors.text,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                chipRow: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                },
                chip: {
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 20,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                chipActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                chipText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                chipTextActive: {
                    color: colors.onPrimary,
                },
                hint: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    lineHeight: 17,
                    marginBottom: 10,
                },
                questionRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                },
                questionInput: { flex: 1 },
                removeBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                },
                addQuestionBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor: colors.aliceBlue,
                    alignSelf: "flex-start",
                    marginTop: 2,
                },
                addQuestionText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.primary,
                },
                inheritedCard: {
                    marginTop: 20,
                    backgroundColor: colors.tag,
                    borderRadius: 12,
                    padding: 14,
                    gap: 8,
                },
                inheritedLabel: {
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1,
                    color: colors.textSecondary,
                    marginBottom: 4,
                },
                inheritedRow: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                },
                inheritedKey: {
                    fontSize: 12,
                    color: colors.textSecondary,
                },
                inheritedValue: {
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.text,
                },
                bottomPad: { height: 16 },
                footer: {
                    flexDirection: "row",
                    gap: 12,
                    padding: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 3,
                },
                cancelBtn: {
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: colors.tag,
                },
                cancelText: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                submitBtn: {
                    flex: 2,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                submitBtnDisabled: {
                    opacity: 0.45,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                submitText: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                pressed: { opacity: 0.72 },
            }),
        [colors]
    );
}

export default CreateCollabFromContentModal;
