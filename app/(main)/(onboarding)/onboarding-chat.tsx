import AIChatPanel from "@/components/shared/AIChatPanel";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { useTheme, type Theme } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

// The essential fields onboarding must collect, used to drive the progress bar.
const ESSENTIALS = 4;

const OnboardingChatScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useChatStyles(theme), [theme]);

    const router = useMyNavigation();
    const { firstBrand } = useLocalSearchParams<{ firstBrand?: string }>();
    const { selectedBrand, createDraftBrand, finalizeBrand, setSelectedBrand } =
        useBrandContext();

    const [draftId, setDraftId] = useState<string | undefined>();
    const [isFresh, setIsFresh] = useState(false);
    const [error, setError] = useState(false);

    const initOnce = useRef(false);
    const finalizedOnce = useRef(false);

    // Ensure a draft brand exists and is the active brand before the chat mounts.
    useEffect(() => {
        if (initOnce.current) return;
        initOnce.current = true;

        (async () => {
            // Resume an in-progress draft.
            if (selectedBrand && selectedBrand.onboardingComplete === false) {
                setDraftId(selectedBrand.id);
                setIsFresh(false);
                return;
            }
            // Start a fresh draft.
            const ref = await createDraftBrand();
            if (!ref) {
                setError(true);
                Toaster.error("Couldn't start onboarding");
                return;
            }
            setSelectedBrand(
                {
                    id: ref.id,
                    name: "",
                    creationTime: Date.now(),
                    isBillingDisabled: false,
                    onboardingComplete: false,
                } as Brand,
                false
            );
            setDraftId(ref.id);
            setIsFresh(true);
        })();
    }, [selectedBrand, createDraftBrand, setSelectedBrand]);

    const handleComplete = async () => {
        if (finalizedOnce.current || !draftId) return;
        finalizedOnce.current = true;
        try {
            await finalizeBrand(draftId);
            // Optimistically flip the flag so the global resume-redirect doesn't
            // bounce us back to onboarding before the Firestore snapshot arrives.
            if (selectedBrand) {
                setSelectedBrand(
                    { ...selectedBrand, onboardingComplete: true } as Brand,
                    false
                );
            }
            Toaster.success(
                firstBrand === "true"
                    ? "Welcome aboard! Your brand is ready."
                    : "Brand created successfully!"
            );
            router.resetAndNavigate("/content-strategies");
        } catch {
            finalizedOnce.current = false;
            Toaster.error("Couldn't finish setting up your brand");
        }
    };

    // Live progress derived from the draft brand (updated as fields are saved).
    const progress = useMemo(() => {
        if (!selectedBrand) return 0;
        let done = 0;
        if (selectedBrand.name?.trim()) done++;
        if (selectedBrand.profile?.phone?.trim()) done++;
        if ((selectedBrand.profile?.industries?.length ?? 0) > 0) done++;
        if (selectedBrand.age?.trim()) done++;
        return done;
    }, [selectedBrand]);

    if (error) {
        return (
            <AppLayout>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>
                        Something went wrong starting onboarding. Please try again.
                    </Text>
                </View>
            </AppLayout>
        );
    }

    if (!draftId) {
        return (
            <AppLayout>
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            </AppLayout>
        );
    }

    return (
        <AppLayout withWebPadding={false}>
            <View style={[styles.container, xl && styles.containerDesktop]}>
                <View style={[styles.card, xl && styles.cardDesktop]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Let's set up your brand</Text>
                        <Text style={styles.subtitle}>
                            {progress} of {ESSENTIALS} essentials done
                        </Text>
                        <View style={styles.progressTrack}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${(progress / ESSENTIALS) * 100}%` },
                                ]}
                            />
                        </View>
                    </View>

                    <View style={styles.panelWrap}>
                        <AIChatPanel
                            module="onboarding"
                            contextId={draftId}
                            isCompact={!xl}
                            hideHeader
                            messageAlign="top"
                            placeholder="Type your answer…"
                            welcomeText="Hi! I'm here to help you set up your brand. Let's start — what's your brand called?"
                            initialMessage={
                                isFresh ? "Hi! I'm ready to set up my brand." : undefined
                            }
                            onOnboardingComplete={handleComplete}
                        />
                    </View>
                </View>

                <Pressable
                    style={({ pressed }) => [styles.fallbackBtn, pressed && styles.pressed]}
                    onPress={() =>
                        router.push({
                            pathname: "/onboarding-your-brand",
                            params: firstBrand ? { firstBrand } : {},
                        })
                    }
                >
                    <Text style={styles.fallbackText}>Prefer to fill a form instead?</Text>
                </Pressable>
            </View>
        </AppLayout>
    );
};

export default OnboardingChatScreen;

function useChatStyles(theme: Theme) {
    const colors = Colors(theme);
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        // On desktop, center a bounded "setup window" instead of stretching the
        // chat across the whole screen (which leaves it sparse and unreadable).
        containerDesktop: {
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 14,
        },
        // Mobile: the card is the full screen. Desktop: a contained card whose
        // height comes from flex (capped by maxHeight) — a percentage height
        // would collapse to 0 because the flex parent has no fixed pixel height.
        card: { flex: 1, width: "100%", backgroundColor: colors.card, overflow: "hidden" },
        cardDesktop: {
            width: 760,
            maxWidth: "100%",
            maxHeight: 860,
            borderRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 24,
            shadowOpacity: 0.1,
            elevation: 8,
        },
        centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
        errorText: { color: colors.text, fontSize: 14, textAlign: "center" },
        header: {
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            backgroundColor: colors.card,
            gap: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.06,
            elevation: 3,
            zIndex: 1,
        },
        title: { fontSize: 17, fontWeight: "700", color: colors.text },
        subtitle: { fontSize: 12, color: colors.textSecondary },
        progressTrack: {
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.tag,
            overflow: "hidden",
            marginTop: 2,
        },
        progressFill: { height: "100%", borderRadius: 3, backgroundColor: colors.primary },
        panelWrap: { flex: 1 },
        fallbackBtn: {
            alignItems: "center",
            paddingVertical: 12,
        },
        fallbackText: {
            color: colors.textSecondary,
            fontSize: 13,
            fontWeight: "600",
            textDecorationLine: "underline",
        },
        pressed: { opacity: 0.7 },
    });
}
