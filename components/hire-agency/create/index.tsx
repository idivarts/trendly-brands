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
import StepOne from "./StepOne";
import StepThree from "./StepThree";
import StepTwo from "./StepTwo";

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
    const handleNext = async () => {
        if (step === 4) {
            await saveDraft(hire).catch(() => {});
        }
        next();
    };

    if (step === 1)
        return (
            <StepOne
                hire={hire}
                setHire={setHire}
                onNext={next}
                onBack={back}
            />
        );

    if (step === 2)
        return (
            <StepTwo
                hire={hire}
                setHire={setHire}
                onNext={next}
                onBack={back}
            />
        );

    if (step === 3)
        return (
            <StepThree
                hire={hire}
                setHire={setHire}
                onNext={next}
                onBack={back}
            />
        );

    if (step === 4)
        return (
            <StepFour
                hire={hire}
                setHire={setHire}
                onNext={handleNext}
                onBack={back}
            />
        );

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
