import type { ReleasePlanOption } from "@/shared-constants/contract-status";
import { ContractStatus } from "@/shared-constants/contract-status";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { logContractApiCall } from "./logContractApiCall";

export type RequestVideoRevisionPayload = {
    contractId: string;
    notes: string;
};

export type ApproveVideoReleasePayload = {
    contractId: string;
    option: ReleasePlanOption;
    scheduledReleaseAt?: number;
};

export async function requestVideoRevision(
    payload: RequestVideoRevisionPayload
): Promise<void> {
    const urlPath = `/monetize/brands/contracts/${payload.contractId}/deliverable/revision`;
    const body = { notes: payload.notes };

    try {
        logContractApiCall({
            apiState: "State_6_api",
            state: ContractStatus.ReviewPending,
            action: "requestVideoRevision",
            contractId: payload.contractId,
        });
        await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to request video revision");
    }
}

export async function approveVideoRelease(
    payload: ApproveVideoReleasePayload
): Promise<void> {
    const urlPath = `/monetize/brands/contracts/${payload.contractId}/deliverable/approve`;
    const postingScenario =
        payload.option === "influencer_posts_alone"
            ? 1
            : payload.option === "brand_and_influencer_post"
              ? 2
              : 3;
    const body: { postingScenario: 1 | 2 | 3; scheduledDate?: number } = {
        postingScenario,
    };

    if (postingScenario !== 3 && payload.scheduledReleaseAt != null) {
        body.scheduledDate = payload.scheduledReleaseAt;
    }

    try {
        logContractApiCall({
            apiState: "State_6_api",
            state: ContractStatus.ReviewPending,
            action: "approveVideoRelease",
            contractId: payload.contractId,
        });
        await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to approve deliverable");
    }
}

