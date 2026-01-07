
//  import pricingPage from "@/app/(landing)/pricing-page";
import Colors from "@/shared-uis/constants/Colors";
import { Theme, useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { BillingCycle, PlanKey } from "./plans/PlanWrapper";

/* ======================= Custom Link Modal ======================= */

type PaymentType = "subscription" | "one-time";
export type IAdminData = {
    isOnTrial: boolean;
    trialDays?: number;
    email: string;
    phone?: string;
    password: string;
    offerId?: string;
    oneTimePayment?: number;
}

interface CreateCustomLinkModalProps {
    visible: boolean;
    onClose: () => void;
    planKey: PlanKey;
    planCycle: BillingCycle;
    onSubmit: (adminData: IAdminData, planKey: PlanKey, planCycle: BillingCycle) => void;
}

export function CreateCustomLinkModal(props: CreateCustomLinkModalProps) {
    const { visible, onClose, planKey, planCycle, onSubmit } = props;
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = stylesCustomModalFn(theme);

    const [isOnTrial, setIsOnTrial] = useState(false);
    const [trialDays, setTrialDays] = useState<string>("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [paymentType, setPaymentType] = useState<PaymentType>("subscription");
    const [offerId, setOfferId] = useState("");
    const [amount, setAmount] = useState("");

    const canSubmit = () => {
        if (!email.trim() || !password.trim()) return false;
        if (paymentType === "one-time" && (!amount || Number.isNaN(Number(amount)))) return false;
        if (isOnTrial && (!trialDays || Number.isNaN(Number(trialDays)))) return false;
        return true;
    };

    const handleSubmit = () => {
        if (!canSubmit()) return;
        onSubmit({
            isOnTrial,
            trialDays: isOnTrial ? Number(trialDays) : undefined,
            email: email.trim(), phone: phone.trim(), password: password.trim(),
            offerId: paymentType === "subscription" && offerId.trim() ? offerId.trim() : undefined,
            oneTimePayment: paymentType === "one-time" ? Number(amount) : undefined,
        }, planKey, planCycle,);
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Create custom payment link</Text>
                    <Text style={styles.modalSub}>Configure trial, contact, and payment details.</Text>

                    <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ paddingBottom: 8 }}>

                        {/* Trial section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Trial</Text>
                            <Pressable
                                accessibilityRole="checkbox"
                                onPress={() => setIsOnTrial(!isOnTrial)}
                                style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}
                            >
                                <View style={[styles.checkboxBox, isOnTrial && styles.checkboxBoxChecked]}>
                                    <Text style={styles.checkboxMark}>{isOnTrial ? "✓" : ""}</Text>
                                </View>
                                <Text style={styles.label}>Offer free trial?</Text>
                            </Pressable>

                            {isOnTrial && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Trial days</Text>
                                    <TextInput
                                        value={trialDays}
                                        onChangeText={setTrialDays}
                                        keyboardType="number-pad"
                                        placeholder="e.g. 7"
                                        placeholderTextColor={colors.textSecondary}
                                        style={styles.input}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Contact section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Contact information</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholder="name@example.com"
                                    placeholderTextColor={colors.textSecondary}
                                    style={styles.input}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone</Text>
                                <TextInput
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholder="Optional"
                                    placeholderTextColor={colors.textSecondary}
                                    style={styles.input}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    placeholder="Set account password"
                                    placeholderTextColor={colors.textSecondary}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* Payment section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Payment type</Text>
                            <View style={styles.row}>
                                <Pressable
                                    onPress={() => setPaymentType("subscription")}
                                    style={({ pressed }) => [styles.radioRow, pressed && styles.pressed]}
                                >
                                    <View style={[styles.radioOuter, paymentType === "subscription" && styles.radioOuterActive]}>
                                        <View style={[styles.radioInner, paymentType === "subscription" && styles.radioInnerActive]} />
                                    </View>
                                    <Text style={styles.label}>Subscription</Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => setPaymentType("one-time")}
                                    style={({ pressed }) => [styles.radioRow, pressed && styles.pressed]}
                                >
                                    <View style={[styles.radioOuter, paymentType === "one-time" && styles.radioOuterActive]}>
                                        <View style={[styles.radioInner, paymentType === "one-time" && styles.radioInnerActive]} />
                                    </View>
                                    <Text style={styles.label}>One-time</Text>
                                </Pressable>
                            </View>

                            {/* Always show selected plan summary */}
                            <View style={styles.summaryBox}>
                                <Text style={styles.summaryText}>Plan: <Text style={styles.summaryStrong}>{planKey}</Text></Text>
                                <Text style={styles.summaryText}>Billing: <Text style={styles.summaryStrong}>{planCycle}</Text></Text>
                            </View>

                            {paymentType === "subscription" ? (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Apply offer? Enter Offer ID (optional)</Text>
                                    <TextInput
                                        value={offerId}
                                        onChangeText={setOfferId}
                                        placeholder="e.g. OFF10M"
                                        placeholderTextColor={colors.textSecondary}
                                        style={styles.input}
                                    />
                                </View>
                            ) : (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Total amount (one-time)</Text>
                                    <TextInput
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="decimal-pad"
                                        placeholder="e.g. 4999"
                                        placeholderTextColor={colors.textSecondary}
                                        style={styles.input}
                                    />
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    <View style={styles.btnRow}>
                        <Pressable style={({ pressed }) => [styles.modalBtnAlt, pressed && styles.pressed]} onPress={onClose}>
                            <Text style={styles.modalBtnAltText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            disabled={!canSubmit()}
                            style={({ pressed }) => [styles.modalBtn, (!canSubmit() ? { opacity: 0.5 } : null), pressed && styles.pressed]}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.modalBtnText}>Create Custom Link</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

/* -------- Styles for Custom Modal (kept consistent with overall design) -------- */
const stylesCustomModalFn = (theme: Theme) => {
    const colors = Colors(theme);
    return StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
        },
        modalCard: {
            width: "100%",
            maxWidth: 520,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            ...Platform.select({ android: { elevation: 4 } }),
        },
        modalTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
        modalSub: { color: colors.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 10 },

        section: { marginTop: 12 },
        sectionTitle: { color: colors.text, fontSize: 14, fontWeight: "800", marginBottom: 6 },

        checkboxRow: { flexDirection: "row", alignItems: "center" },
        checkboxBox: {
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
        },
        checkboxBoxChecked: { borderColor: colors.primary, backgroundColor: colors.surface },
        checkboxMark: { color: colors.primary, fontWeight: "900" },

        inputGroup: { marginTop: 10 },
        label: { color: colors.text, fontSize: 12, marginBottom: 6, fontWeight: "700" },
        input: {
            height: 42,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
            paddingHorizontal: 12,
            color: colors.text,
        },

        row: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 6 },
        radioRow: { flexDirection: "row", alignItems: "center" },
        radioOuter: {
            width: 18,
            height: 18,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
        },
        radioOuterActive: { borderColor: colors.primary },
        radioInner: {
            width: 8,
            height: 8,
            borderRadius: 8,
            backgroundColor: "transparent",
        },
        radioInnerActive: { backgroundColor: colors.primary },

        summaryBox: {
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 10,
            marginTop: 10,
        },
        summaryText: { color: colors.textSecondary, fontSize: 12, marginBottom: 2 },
        summaryStrong: { color: colors.text, fontWeight: "800" },

        btnRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },

        modalBtn: {
            backgroundColor: colors.primary,
            height: 44,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
        },
        modalBtnText: { color: colors.background, fontWeight: "800" },
        modalBtnAlt: {
            backgroundColor: colors.surface,
            height: 44,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 16,
        },
        modalBtnAltText: { color: colors.text, fontWeight: "800" },

        pressed: { opacity: 0.9 },
    });
};