import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import React, {
    createContext,
    type PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { View } from "react-native";
import { useAuthContext } from "./auth-context.provider";
import { useBreakpoints } from "@/hooks";

export type StepId =
    | "step-0"
    | "step-1"
    | "step-2-web"
    | "step-2-mobile"
    | "step-3-web"
    | "step-3-mobile"
    | "step-4";

export interface StepConfig {
    message: string;
    isLastStep: boolean;
}

export interface CoachMarkLayout {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface GuideTourContextValue {
    hasCompletedTour: boolean;
    currentStep: number;
    isTourActive: boolean;
    startTour: () => void;
    nextStep: () => void;
    skipTour: () => void;
    completeTour: () => void;
    registerMeasureTarget: (stepId: StepId, ref: React.RefObject<View | null> | null) => void;
    getStepConfig: () => StepConfig | null;
    getActiveStepId: () => StepId | null;
    measureActiveStep: () => Promise<CoachMarkLayout | null>;
}

const GuideTourContext = createContext<GuideTourContextValue | null>(null);

const STORAGE_KEY_PREFIX = "guide-tour-completed-";

export const useGuideTour = () => {
    const ctx = useContext(GuideTourContext);
    if (!ctx) {
        throw new Error("useGuideTour must be used within GuideTourProvider");
    }
    return ctx;
};

export const useGuideTourOptional = () => useContext(GuideTourContext);

export const GuideTourProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { manager } = useAuthContext();
    const { xl } = useBreakpoints();
    const [hasCompletedTour, setHasCompletedTour] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isTourActive, setIsTourActive] = useState(false);
    const [storageLoaded, setStorageLoaded] = useState(false);

    const measureRefs = useRef<Partial<Record<StepId, React.RefObject<View | null> | null>>>({});

    const storageKey = useMemo(
        () => (manager?.id ? `${STORAGE_KEY_PREFIX}${manager.id}` : null),
        [manager?.id]
    );

    useEffect(() => {
        if (!storageKey) {
            setStorageLoaded(true);
            return;
        }
        if (__DEV__) {
            setHasCompletedTour(false);
            setStorageLoaded(true);
            return;
        }
        PersistentStorage.get(storageKey).then((val) => {
            setHasCompletedTour(val === "true");
            setStorageLoaded(true);
        });
    }, [storageKey]);

    const persistCompleted = useCallback(async () => {
        if (!storageKey || __DEV__) return;
        await PersistentStorage.set(storageKey, "true");
    }, [storageKey]);

    const startTour = useCallback(() => {
        if (hasCompletedTour) return;
        setCurrentStep(0);
        setIsTourActive(true);
    }, [hasCompletedTour]);

    const nextStep = useCallback(() => {
        setCurrentStep((prev) => Math.min(prev + 1, 4));
    }, []);

    const skipTour = useCallback(async () => {
        await persistCompleted();
        setHasCompletedTour(true);
        setIsTourActive(false);
    }, [persistCompleted]);

    const completeTour = useCallback(async () => {
        await persistCompleted();
        setHasCompletedTour(true);
        setIsTourActive(false);
    }, [persistCompleted]);

    const registerMeasureTarget = useCallback((stepId: StepId, ref: React.RefObject<View | null> | null) => {
        measureRefs.current[stepId] = ref;
    }, []);

    const getActiveStepId = useCallback((): StepId | null => {
        if (xl) {
            switch (currentStep) {
                case 0:
                    return "step-0";
                case 1:
                    return "step-1";
                case 2:
                    return "step-2-web";
                case 3:
                    return "step-3-web";
                case 4:
                    return "step-4";
                default:
                    return null;
            }
        } else {
            switch (currentStep) {
                case 0:
                    return "step-0";
                case 1:
                    return "step-1";
                case 2:
                    return "step-2-mobile";
                case 3:
                    return "step-3-mobile";
                case 4:
                    return "step-4";
                default:
                    return null;
            }
        }
    }, [currentStep, xl]);

    const measureActiveStep = useCallback((): Promise<CoachMarkLayout | null> => {
        return new Promise((resolve) => {
            const stepId = getActiveStepId();
            if (!stepId) {
                resolve(null);
                return;
            }
            const ref = measureRefs.current[stepId];
            if (!ref?.current) {
                resolve(null);
                return;
            }
            ref.current.measureInWindow((x, y, width, height) => {
                resolve({ x, y, width, height });
            });
        });
    }, [getActiveStepId]);

    const getStepConfig = useCallback((): StepConfig | null => {
        const stepId = getActiveStepId();
        if (!stepId) return null;

        const isLastStep = currentStep === 4;
        const messages: Record<StepId, string> = {
            "step-0":
                "This is an influencer card. Tap to view their profile and invite them to your campaign.",
            "step-1":
                "Use the Filters button to refine your search by followers, engagement, location, and more.",
            "step-2-web":
                "The Campaigns tab shows all your active and past campaigns. Manage collaborations here.",
            "step-2-mobile":
                "The Campaigns tab shows all your active and past campaigns. Manage collaborations here.",
            "step-3-web":
                "This is your credits card. Discovery credits are used when you view influencer profiles. Invites are used to send collaboration requests. Tap REFILL to top up.",
            "step-3-mobile":
                "The My Brand tab lets you manage your brand, check usage, and access billing.",
            "step-4":
                "Use the brand switcher here to switch between your brands and manage your account.",
        };

        return {
            message: messages[stepId],
            isLastStep,
        };
    }, [currentStep, getActiveStepId]);

    const value = useMemo<GuideTourContextValue>(
        () => ({
            hasCompletedTour,
            currentStep,
            isTourActive,
            startTour,
            nextStep,
            skipTour,
            completeTour,
            registerMeasureTarget,
            getStepConfig,
            getActiveStepId,
            measureActiveStep,
        }),
        [
            hasCompletedTour,
            currentStep,
            isTourActive,
            startTour,
            nextStep,
            skipTour,
            completeTour,
            registerMeasureTarget,
            getStepConfig,
            getActiveStepId,
            measureActiveStep,
        ]
    );

    return (
        <GuideTourContext.Provider value={value}>
            {children}
        </GuideTourContext.Provider>
    );
};
