import { useBrandContext } from "@/contexts/brand-context.provider";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { DEFAULT_CAMPAIGN, ICampaign } from "@/types/Campaign";
import { router } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import StepFive from "./StepFive";
import StepFour from "./StepFour";
import StepOne from "./StepOne";
import StepThree from "./StepThree";
import StepTwo from "./StepTwo";

const CreateCampaign: React.FC = () => {
    const { selectedBrand } = useBrandContext();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [campaign, setCampaign] = useState<Partial<ICampaign>>({
        ...DEFAULT_CAMPAIGN,
    });

    const next = () => setStep((s) => s + 1);
    const back = () => setStep((s) => Math.max(1, s - 1));

    const saveDraft = async (data: Partial<ICampaign>): Promise<string | null> => {
        try {
            if (!selectedBrand || !AuthApp.currentUser) return null;
            const now = Date.now();
            const docRef = await addDoc(collection(FirestoreDB, "campaigns"), {
                ...data,
                brandId: selectedBrand.id,
                managerId: AuthApp.currentUser.uid,
                status: "draft",
                createdAt: now,
                updatedAt: now,
            });
            return docRef.id;
        } catch (err) {
            Console.error(err, "Failed to save campaign draft");
            return null;
        }
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            // Save as draft regardless — payment initiates later
            await saveDraft(campaign);
            Toaster.success(
                "Campaign saved! A Trendly POC will contact you shortly to proceed with payment and next steps."
            );
            router.replace("/campaigns");
        } catch (err) {
            Console.error(err);
            Toaster.error("Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // Persist draft whenever moving to next step so data isn't lost
    const handleNext = async () => {
        if (step === 4) {
            // Save draft silently before going to summary
            await saveDraft(campaign).catch(() => {});
        }
        next();
    };

    if (step === 1)
        return (
            <StepOne
                campaign={campaign}
                setCampaign={setCampaign}
                onNext={next}
                onBack={back}
            />
        );

    if (step === 2)
        return (
            <StepTwo
                campaign={campaign}
                setCampaign={setCampaign}
                onNext={next}
                onBack={back}
            />
        );

    if (step === 3)
        return (
            <StepThree
                campaign={campaign}
                setCampaign={setCampaign}
                onNext={next}
                onBack={back}
            />
        );

    if (step === 4)
        return (
            <StepFour
                campaign={campaign}
                setCampaign={setCampaign}
                onNext={handleNext}
                onBack={back}
            />
        );

    return (
        <StepFive
            campaign={campaign}
            onBack={back}
            onSubmit={handleSubmit}
            isSaving={isSaving}
        />
    );
};

export default CreateCampaign;
