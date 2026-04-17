import { ContractStatus } from "@/shared-constants/contract-status";
import { PaymentStatus } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { logContractApiCall } from "./logContractApiCall";

export type CreateContractOrderPayload = {
    contractId: string;
};

export type ReviseQuotationPayload = {
    collabId: string;
    userId: string;
};

export type ContractOrderData = {
    id: string;
    amount: number;
    currency: string;
    shortUrl?: string;
    /** Razorpay / backend order status; prefer `PaymentStatus` when it matches contract payment */
    status?: PaymentStatus;
    [key: string]: unknown;
};

export type ContractOrderStatusData = {
    id?: string;
    status?: PaymentStatus | string;
    amount?: number;
    currency?: string;
    [key: string]: unknown;
};

function normalizeOrderData(raw: unknown): ContractOrderData {
    const source = (raw ?? {}) as Record<string, unknown>;
    const nestedOrder =
        (source.order as Record<string, unknown> | undefined) ??
        (source.data as Record<string, unknown> | undefined);
    const candidate = (nestedOrder ?? source) as Record<string, unknown>;

    const id = String(
        candidate.id ??
        candidate.orderId ??
        candidate.order_id ??
        candidate.razorpayOrderId ??
        candidate.razorpay_order_id ??
        ""
    );

    const amountRaw =
        candidate.amount ??
        candidate.amount_due ??
        candidate.amountDue ??
        candidate.total_amount ??
        candidate.totalAmount ??
        0;
    const amount = Number(amountRaw);

    const currencyRaw = candidate.currency ?? candidate.currency_code ?? candidate.currencyCode ?? "INR";
    const currency = String(currencyRaw || "INR");

    return {
        ...candidate,
        id,
        amount,
        currency,
        shortUrl:
            (candidate.shortUrl as string | undefined) ??
            (candidate.short_url as string | undefined) ??
            (candidate.paymentLink as string | undefined) ??
            (candidate.payment_link as string | undefined),
    };
}

export async function createContractOrder(
    payload: CreateContractOrderPayload
): Promise<ContractOrderData> {
    const urlPath = `/monetize/brands/contracts/${payload.contractId}/order`;

    try {
        logContractApiCall({
            apiState: "State_0_api",
            state: "Payment",
            action: "createContractOrder",
            contractId: payload.contractId,
        });
        const response = await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        const json = await response.json();
        return normalizeOrderData(json);
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to create payment order");
    }
}

export async function getContractOrderStatus(
    payload: CreateContractOrderPayload
): Promise<ContractOrderData> {
    const urlPath = `/monetize/brands/contracts/${payload.contractId}/order`;

    try {
        logContractApiCall({
            apiState: "State_0_api",
            state: "Payment",
            action: "getContractOrderStatus",
            contractId: payload.contractId,
        });
        const response = await HttpWrapper.fetch(urlPath, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const json = await response.json();
        return normalizeOrderData(json);
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to fetch payment status");
    }
}

const REVISE_QUOTATION_DEBOUNCE_MS = 60_000;
const reviseQuotationLastStartedAt = new Map<string, number>();
const reviseQuotationInFlight = new Map<string, Promise<void>>();

function getReviseQuotationKey(payload: ReviseQuotationPayload) {
    return `${payload.collabId}:${payload.userId}`;
}

export async function reviseQuotation(payload: ReviseQuotationPayload): Promise<void> {
    const key = getReviseQuotationKey(payload);
    const now = Date.now();

    const inFlight = reviseQuotationInFlight.get(key);
    if (inFlight) return inFlight;

    const lastStartedAt = reviseQuotationLastStartedAt.get(key) ?? 0;
    if (now - lastStartedAt < REVISE_QUOTATION_DEBOUNCE_MS) {
        // Debounced (1 min). No-op to prevent duplicate calls on rapid taps.
        return;
    }

    reviseQuotationLastStartedAt.set(key, now);

    const urlPath = `/api/collabs/collaborations/${payload.collabId}/applications/${payload.userId}/revise`;

    const promise = (async () => {
        try {
            logContractApiCall({
                apiState: "State_0_api",
                state: ContractStatus.Pending,
                action: "reviseQuotation",
                contractId: payload.collabId,
            });

            await HttpWrapper.fetch(urlPath, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
        } catch (err) {
            // Allow retry immediately on failure.
            reviseQuotationLastStartedAt.delete(key);
            const message = await HttpWrapper.extractErrorMessage(err);
            throw new Error(message ?? "Failed to request quotation revision");
        } finally {
            reviseQuotationInFlight.delete(key);
        }
    })();

    reviseQuotationInFlight.set(key, promise);
    return promise;
}

