import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { ContractStatus } from "@/shared-constants/contract-status";
import { logContractApiCall } from "./logContractApiCall";

export type ScheduleReleasePayload = {
    contractId: string;
    scheduledReleaseAt: number;
    // Some legacy UI paths send the release plan option; backend can ignore if not needed.
    option?: "brand_and_influencer_post" | "influencer_posts_alone" | "brand_posts_alone";
};

export type ChangeReleaseDatePayload = {
    contractId: string;
    scheduledReleaseAt: number;
};

export async function scheduleRelease(
    payload: ScheduleReleasePayload
): Promise<void> {
    // TODO: replace URL path with the backend endpoint for scheduling release (state 8).
    const urlPath = `/api/collabs/contracts/${payload.contractId}/state-8/schedule-release`;
    const body = {
        scheduledReleaseAt: payload.scheduledReleaseAt,
        option: payload.option,
    };

    try {
        logContractApiCall({
            apiState: "State_8_api",
            state: ContractStatus.PostingPending,
            action: "scheduleRelease",
            contractId: payload.contractId,
        });
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
    // TODO: replace URL path with the backend endpoint for updating release date (state 8).
    const urlPath = `/api/collabs/contracts/${payload.contractId}/state-8/change-release-date`;
    const body = { scheduledReleaseAt: payload.scheduledReleaseAt };

    try {
        logContractApiCall({
            apiState: "State_8_api",
            state: ContractStatus.PostingPending,
            action: "changeReleaseDate",
            contractId: payload.contractId,
        });
        await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to change release date");
    }
}

