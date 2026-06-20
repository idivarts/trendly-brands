import { ContractStatus } from "@/shared-constants/contract-status";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
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

export type RequestDeliverableUXOptions = {
    /** Called after a successful API call (e.g. refetch contract). */
    onSuccess?: () => void;
    /** Called when the API call fails. */
    onError?: (error: unknown) => void;
    /** Override success toast copy. */
    successMessage?: string;
};

/**
 * Request deliverable and also handle UX (toast + refresh).
 * Keeps UI components thin by centralizing repeated behavior.
 */
export async function requestDeliverableWithUX(
    payload: RequestDeliverablePayload,
    options: RequestDeliverableUXOptions = {}
): Promise<void> {
    try {
        await requestDeliverable(payload);
        Toaster.success(options.successMessage ?? "Deliverable requested");
        options.onSuccess?.();
    } catch (e) {
        options.onError?.(e);
        const message = e instanceof Error ? e.message : undefined;
        Toaster.error(message ? `Failed to request deliverable: ${message}` : "Failed to request deliverable");
        throw e;
    }
}

