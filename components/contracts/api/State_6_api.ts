import type { ReleasePlanOption } from "@/shared-constants/contract-status";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";

export type RequestVideoRevisionPayload = {
    contractId: string;
    revisionNotes: string;
};

export type ApproveVideoReleasePayload = {
    contractId: string;
    option: ReleasePlanOption;
    scheduledReleaseAt?: number;
    trendlyBoost: boolean;
};

export async function requestVideoRevision(
    payload: RequestVideoRevisionPayload
): Promise<void> {
    // TODO: replace URL path with the backend endpoint for "request revision".
    const urlPath = `/api/collabs/contracts/${payload.contractId}/state-6/request-revision`;
    const body = { revisionNotes: payload.revisionNotes };

    try {
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
    // TODO: replace URL path with the backend endpoint for "approve video + release scheduling".
    const urlPath = `/api/collabs/contracts/${payload.contractId}/state-6/approve-video-release`;
    const body = {
        option: payload.option,
        scheduledReleaseAt: payload.scheduledReleaseAt,
        trendlyBoost: payload.trendlyBoost,
    };

    try {
        await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to approve video release");
    }
}

