/**
 * Trustability score mappings and utilities
 * Maps trustability percentage to descriptive text
 * Colors from shared-uis/constants/Colors.ts
 */

import { ColorsStatic } from "@/shared-uis/constants/Colors";

export interface TrustabilityLevel {
    minScore: number;
    maxScore: number;
    label: string;
    description: string;
    color: string;
}

export const TRUSTABILITY_LEVELS: TrustabilityLevel[] = [
    {
        minScore: 90,
        maxScore: 100,
        label: "Excellent",
        description: "Excellent trustable influencer",
        color: ColorsStatic.toastSuccess,
    },
    {
        minScore: 80,
        maxScore: 89.99,
        label: "Good",
        description: "Good trustable influencer",
        color: ColorsStatic.toastInfo,
    },
    {
        minScore: 70,
        maxScore: 79.99,
        label: "Fair",
        description: "Fair trustable influencer",
        color: ColorsStatic.toastWarning,
    },
    {
        minScore: 60,
        maxScore: 69.99,
        label: "Average",
        description: "Average trustability",
        color: ColorsStatic.yellow,
    },
    {
        minScore: 0,
        maxScore: 59.99,
        label: "Low",
        description: "Low trustability score",
        color: ColorsStatic.toastError,
    },
];

/**
 * Get trustability level based on score
 * @param score - The trustability score (0-100)
 * @returns TrustabilityLevel object with label and description
 */
export const getTrustabilityLevel = (
    score?: number | null
): TrustabilityLevel | null => {
    if (score === null || score === undefined) {
        return null;
    }

    return (
        TRUSTABILITY_LEVELS.find(
            (level) => score >= level.minScore && score <= level.maxScore
        ) || null
    );
};

/**
 * Get display text for trustability score
 * @param score - The trustability score (0-100)
 * @returns Formatted string like "More than 90% - Excellent"
 */
export const getTrustabilityText = (score?: number | null): string => {
    if (score === null || score === undefined) {
        return "—";
    }

    const level = getTrustabilityLevel(score);
    if (!level) {
        return "—";
    }

    return `${level.label}`;
};
