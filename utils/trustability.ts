/**
 * Trustability score mappings and utilities
 * Maps trustability percentage to descriptive text
 */

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
        color: "#4CAF50", // Green
    },
    {
        minScore: 80,
        maxScore: 89.99,
        label: "Good",
        description: "Good trustable influencer",
        color: "#2196F3", // Blue
    },
    {
        minScore: 70,
        maxScore: 79.99,
        label: "Fair",
        description: "Fair trustable influencer",
        color: "#FF9800", // Orange
    },
    {
        minScore: 60,
        maxScore: 69.99,
        label: "Average",
        description: "Average trustability",
        color: "#FFC107", // Amber
    },
    {
        minScore: 0,
        maxScore: 59.99,
        label: "Low",
        description: "Low trustability score",
        color: "#F44336", // Red
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
