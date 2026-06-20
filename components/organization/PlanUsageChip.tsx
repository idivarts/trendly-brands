import Tag from "@/components/ui/tag";
import React from "react";

interface PlanUsageChipProps {
    planKey?: string;
    used?: number;
    max?: number;
}

/**
 * Single, reusable representation of an org's plan + brand usage, e.g.
 * "TEAM · 2/3". Used on the Organizations hub and the manage screen so plan
 * info reads identically everywhere.
 */
const PlanUsageChip: React.FC<PlanUsageChipProps> = ({ planKey, used, max }) => {
    const plan = (planKey || "free").toUpperCase();
    const usage =
        typeof used === "number" && typeof max === "number" ? ` · ${used}/${max}` : "";
    return <Tag compact>{`${plan}${usage}`}</Tag>;
};

export default PlanUsageChip;
