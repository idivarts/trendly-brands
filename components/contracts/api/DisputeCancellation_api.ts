import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";

export interface RaiseDisputePayload {
    contractId: string;
    type: string;
    description: string;
    evidence?: string[];
}

export interface RequestCancellationPayload {
    contractId: string;
    reason: string;
}

export interface RespondToCancellationPayload {
    contractId: string;
    approve: boolean;
}

export async function raiseDisputeAsBrand(payload: RaiseDisputePayload): Promise<void> {
    await HttpWrapper.fetch(
        `/monetize/brands/contracts/${payload.contractId}/dispute`,
        {
            method: "POST",
            body: JSON.stringify({
                type: payload.type,
                description: payload.description,
                evidence: payload.evidence ?? [],
            }),
        }
    );
}

export async function requestCancellationAsBrand(payload: RequestCancellationPayload): Promise<void> {
    await HttpWrapper.fetch(
        `/monetize/brands/contracts/${payload.contractId}/cancel/request`,
        {
            method: "POST",
            body: JSON.stringify({ reason: payload.reason }),
        }
    );
}

export async function respondToCancellationAsBrand(payload: RespondToCancellationPayload): Promise<void> {
    await HttpWrapper.fetch(
        `/monetize/brands/contracts/${payload.contractId}/cancel/respond`,
        {
            method: "POST",
            body: JSON.stringify({ approve: payload.approve }),
        }
    );
}
