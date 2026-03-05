import { useGuideTour } from "@/contexts/guide-tour-context.provider";
import { useBreakpoints } from "@/hooks";
import React, { useCallback, useEffect, useState } from "react";
import CoachMarkOverlay from "./CoachMarkOverlay";
import TourCard from "./TourCard";

const STEP_3_WEB = 3;

const GuideTourOverlay: React.FC = () => {
    const {
        hasCompletedTour,
        isTourActive,
        currentStep,
        nextStep,
        skipTour,
        completeTour,
        getStepConfig,
        measureActiveStep,
    } = useGuideTour();
    const { xl } = useBreakpoints();
    const [highlightLayout, setHighlightLayout] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);

    const isStep3Web = xl && currentStep === STEP_3_WEB;
    const showGenericOverlay = isTourActive && !hasCompletedTour && !isStep3Web;

    useEffect(() => {
        if (!showGenericOverlay) {
            setHighlightLayout(null);
            return;
        }
        setHighlightLayout(null);
        let cancelled = false;
        const maxAttempts = currentStep === 0 ? 8 : 4;
        const initialDelay = currentStep === 0 ? 400 : 200;
        const retryDelay = currentStep === 0 ? 350 : 250;
        const measureWithRetry = (attempt: number) => {
            if (cancelled) return;
            measureActiveStep().then((layout) => {
                if (cancelled) return;
                if (layout && layout.width > 0 && layout.height > 0) {
                    setHighlightLayout(layout);
                } else if (attempt < maxAttempts) {
                    setTimeout(() => measureWithRetry(attempt + 1), retryDelay);
                }
            });
        };
        const t = setTimeout(() => measureWithRetry(0), initialDelay);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [showGenericOverlay, currentStep, measureActiveStep]);

    const stepConfig = getStepConfig();

    const handleNext = useCallback(() => {
        if (stepConfig?.isLastStep) {
            completeTour();
        } else {
            nextStep();
            setHighlightLayout(null);
        }
    }, [stepConfig?.isLastStep, completeTour, nextStep]);

    const handleSkip = useCallback(() => {
        skipTour();
    }, [skipTour]);

    if (!showGenericOverlay || !stepConfig) return null;

    return (
        <CoachMarkOverlay
            visible={true}
            highlightLayout={highlightLayout}
            stepIndex={currentStep}
            onRequestClose={handleSkip}
        >
            <TourCard
                message={stepConfig.message}
                onSkip={handleSkip}
                onNext={handleNext}
                isLastStep={stepConfig.isLastStep}
            />
        </CoachMarkOverlay>
    );
};

export default GuideTourOverlay;
