import { ContractStatus } from "@/shared-constants/contract-status";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { logContractApiCall } from "./logContractApiCall";

export type SubmitBrandFeedbackPayload = {
    contractId: string;
    ratings: number;
    feedbackReview?: string;
};

export async function submitBrandFeedback(
    payload: SubmitBrandFeedbackPayload
): Promise<void> {
    const urlPath = `/api/collabs/contracts/${payload.contractId}/brand-feedback`;
    const body = {
        ratings: payload.ratings,
        feedbackReview: payload.feedbackReview,
    };

    try {
        logContractApiCall({
            apiState: "State_9_api",
            state: ContractStatus.SettlementPending,
            action: "submitBrandFeedback",
            contractId: payload.contractId,
        });
        await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to submit feedback");
    }
}

