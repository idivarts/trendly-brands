import { ContractStatus } from "@/shared-constants/contract-status";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { logContractApiCall } from "./logContractApiCall";

export type RequestDeliverablePayload = {
    contractId: string;
};

export async function requestDeliverable(
    payload: RequestDeliverablePayload
): Promise<void> {
    const urlPath = `/monetize/brands/contracts/${payload.contractId}/deliverable/request`;

    try {
        logContractApiCall({
            apiState: "State_5_api",
            state: ContractStatus.VideoPending,
            action: "requestDeliverable",
            contractId: payload.contractId,
        });
        await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to request deliverable");
    }
}

