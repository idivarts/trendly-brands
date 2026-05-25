import { useBrandContext } from "@/contexts/brand-context.provider";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { DEFAULT_AGENCY_HIRE, IAgencyHire } from "@/types/AgencyHire";
import { router } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import StepFive from "./StepFive";
import StepFour from "./StepFour";
import StepTwo from "./StepTwo";

/**
 * 3-step hire-us wizard:
 *   Step 1 (StepTwo)  — Engagement model education + budget type selection
 *   Step 2 (StepFour) — Feature toggles + live budget/ROI calculator
 *   Step 3 (StepFive) — Summary + submit
 */
const HireAgency: React.FC = () => {
    const { selectedBrand } = useBrandContext();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [hire, setHire] = useState<Partial<IAgencyHire>>({
        ...DEFAULT_AGENCY_HIRE,
    });

    const next = () => setStep((s) => s + 1);
    const back = () => setStep((s) => Math.max(1, s - 1));

    const saveDraft = async (data: Partial<IAgencyHire>): Promise<string | null> => {
        try {
            if (!selectedBrand || !AuthApp.currentUser) return null;
            const now = Date.now();
            const docRef = await addDoc(collection(FirestoreDB, "agency-hires"), {
                ...data,
                brandId: selectedBrand.id,
                managerId: AuthApp.currentUser.uid,
                status: "draft",
                createdAt: now,
                updatedAt: now,
            });
            return docRef.id;
        } catch (err) {
            Console.error(err, "Failed to save agency hire draft");
            return null;
        }
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            await saveDraft(hire);
            Toaster.success(
                "Request submitted! A Trendly POC will contact you within 24 hours to proceed."
            );
            router.back();
        } catch (err) {
            Console.error(err);
            Toaster.error("Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // Persist draft silently before moving to the summary step
    const handleNextFromFeatures = async () => {
        await saveDraft(hire).catch(() => {});
        next();
    };

    // Step 1 — Engagement model + budget type
    if (step === 1)
        return (
            <StepTwo
                hire={hire}
                setHire={setHire}
                onNext={next}
                onBack={back}
            />
        );

    // Step 2 — Features & budget calculator
    if (step === 2)
        return (
            <StepFour
                hire={hire}
                setHire={setHire}
                onNext={handleNextFromFeatures}
                onBack={back}
            />
        );

    // Step 3 — Summary & submit
    return (
        <StepFive
            hire={hire}
            onBack={back}
            onSubmit={handleSubmit}
            isSaving={isSaving}
        />
    );
};

export default HireAgency;
