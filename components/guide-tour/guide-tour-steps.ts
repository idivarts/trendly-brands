import type { StepId } from "@/contexts/guide-tour-context.provider";

export const WEB_STEP_IDS: StepId[] = [
    "step-0",
    "step-1",
    "step-2-web",
    "step-3-web",
    "step-4",
];

export const MOBILE_STEP_IDS: StepId[] = [
    "step-0",
    "step-1",
    "step-2-mobile",
    "step-3-mobile",
    "step-4",
];

export const STEP_INDEX_TO_ID = (
    index: number,
    xl: boolean
): StepId | null => {
    const ids = xl ? WEB_STEP_IDS : MOBILE_STEP_IDS;
    return ids[index] ?? null;
};
