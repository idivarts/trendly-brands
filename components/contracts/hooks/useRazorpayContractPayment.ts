import { PaymentStatus } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useCallback, useRef, useState } from "react";
import { createContractOrder, getContractOrderStatus } from "../api/payment-pending.api";
import type { RazorpayCheckoutModalOptions } from "../utils/razorpay-checkout-modal.types";

type RazorpayPayerPrefill = {
    name?: string;
    email?: string;
    contact?: string;
};

export type UseRazorpayContractPaymentParams = {
    contractId: string;
    themeColor: string;
    prefill: RazorpayPayerPrefill;
    onRefresh: () => void;
};

export type StartContractPaymentOptions = {
    /** Load checkout from GET /order (reuse server order) instead of POST /order. */
    resumeExistingOrder?: boolean;
};

function isPaidLikeStatus(status: unknown): boolean {
    if (status === PaymentStatus.Paid || status === PaymentStatus.TransferProcessed) return true;
    if (typeof status === "string" && status.toLowerCase() === PaymentStatus.Paid) return true;
    return false;
}

export function useRazorpayContractPayment({
    contractId,
    themeColor,
    prefill,
    onRefresh,
}: UseRazorpayContractPaymentParams) {
    const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
    const [checkoutOptions, setCheckoutOptions] = useState<RazorpayCheckoutModalOptions>({});
    const [paymentButtonLoading, setPaymentButtonLoading] = useState(false);

    const checkoutDeferredRef = useRef<{
        resolve: (value: unknown) => void;
        reject: (reason: Error) => void;
    } | null>(null);

    const handleRazorpayModalSuccess = useCallback((data: unknown) => {
        setCheckoutModalVisible(false);
        checkoutDeferredRef.current?.resolve(data);
        checkoutDeferredRef.current = null;
    }, []);

    const handleRazorpayModalClose = useCallback(() => {
        setCheckoutModalVisible(false);
        checkoutDeferredRef.current?.reject(new Error("Payment cancelled"));
        checkoutDeferredRef.current = null;
    }, []);

    const handleRazorpayModalError = useCallback((err: unknown) => {
        setCheckoutModalVisible(false);
        const e = err instanceof Error ? err : new Error(String(err));
        checkoutDeferredRef.current?.reject(e);
        checkoutDeferredRef.current = null;
    }, []);

    const startPayment = useCallback(async (options?: StartContractPaymentOptions) => {
        if (paymentButtonLoading) return;

        const resumeExistingOrder = options?.resumeExistingOrder === true;

        const razorpayKeyId = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RtPhjl6Q2YAk8S";
        if (!razorpayKeyId) {
            Toaster.error("Missing Razorpay key. Set EXPO_PUBLIC_RAZORPAY_KEY_ID.");
            return;
        }

        setPaymentButtonLoading(true);
        let order: Awaited<ReturnType<typeof createContractOrder>> | undefined;
        try {
            if (resumeExistingOrder) {
                order = await getContractOrderStatus({ contractId });
                if (isPaidLikeStatus(order.status)) {
                    setPaymentButtonLoading(false);
                    Toaster.success("Payment already completed");
                    onRefresh();
                    return;
                }
            } else {
                order = await createContractOrder({ contractId });
            }
        } catch (e) {
            setPaymentButtonLoading(false);
            const message = e instanceof Error ? e.message : "Unable to create payment order";
            Toaster.error(message);
            onRefresh();
            return;
        }

        if (!order.id) {
            setPaymentButtonLoading(false);
            Toaster.error(
                resumeExistingOrder
                    ? "No pending payment order found. Try again or contact support."
                    : "Invalid order response from server (missing orderId)"
            );
            onRefresh();
            return;
        }

        const razorpayOptions: RazorpayCheckoutModalOptions = {
            key: razorpayKeyId,
            order_id: order.id,
            name: "Trendly",
            description: "Contract pre-payment",
            prefill,
            theme: { color: themeColor },
        };
        if (order.amount > 0) razorpayOptions.amount = order.amount;
        if (order.currency) razorpayOptions.currency = order.currency;

        setPaymentButtonLoading(false);

        try {
            try {
                await new Promise<unknown>((resolve, reject) => {
                    checkoutDeferredRef.current = { resolve, reject };
                    setCheckoutOptions(razorpayOptions);
                    setCheckoutModalVisible(true);
                });
            } catch (checkoutErr) {
                const msg = checkoutErr instanceof Error ? checkoutErr.message : "";
                if (msg === "Payment cancelled") {
                    onRefresh();
                    return;
                }
                throw checkoutErr;
            }

            const latest = await getContractOrderStatus({ contractId });
            if (isPaidLikeStatus(latest?.status)) {
                Toaster.success("Payment completed successfully");
            } else {
                Toaster.info("Payment submitted. We'll update status shortly.");
            }
            onRefresh();
        } catch (e) {
            const message = e instanceof Error ? e.message : "Unable to complete payment";
            Toaster.error(message);
            onRefresh();
        }
    }, [contractId, onRefresh, paymentButtonLoading, prefill, themeColor]);

    return {
        paymentButtonLoading,
        startPayment,
        razorpayModalProps: {
            visible: checkoutModalVisible,
            options: checkoutOptions,
            onSuccess: handleRazorpayModalSuccess,
            onClose: handleRazorpayModalClose,
            onError: handleRazorpayModalError,
        },
    };
}

