import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import type { ReleasePlanOption } from "@/shared-constants/contract-status";

export type PlanReleaseConfirmPayload = {
    contractId: string;
    option: ReleasePlanOption;
    trendlyBoost: boolean;
    scheduledReleaseAt: number;
};

export type ChangeReleaseDatePayload = {
    contractId: string;
    scheduledReleaseAt: number;
};

export async function scheduleReleaseFromPlan(
    payload: PlanReleaseConfirmPayload
): Promise<void> {
    // TODO: replace URL path with the backend endpoint for scheduling from plan.
    const urlPath = `/api/collabs/contracts/${payload.contractId}/state-7/schedule-from-plan`;
    const body = {
        option: payload.option,
        trendlyBoost: payload.trendlyBoost,
        scheduledReleaseAt: payload.scheduledReleaseAt,
    };

    try {
        await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to schedule release");
    }
}

export async function changeReleaseDate(
    payload: ChangeReleaseDatePayload
): Promise<void> {
    // TODO: replace URL path with the backend endpoint for updating release date (state 7).
    const urlPath = `/api/collabs/contracts/${payload.contractId}/state-7/change-release-date`;
    const body = { scheduledReleaseAt: payload.scheduledReleaseAt };

    try {
        await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to update release date");
    }
}

