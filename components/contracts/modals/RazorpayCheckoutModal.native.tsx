import React, { useEffect, useRef } from "react";
import RazorpayCheckout from "react-native-razorpay";
import type {
    RazorpayCheckoutModalOptions,
    RazorpayCheckoutModalProps,
} from "../utils/razorpay-checkout-modal.types";

export type { RazorpayCheckoutModalOptions } from "../utils/razorpay-checkout-modal.types";

type RazorpayNativeError = {
    code?: string | number;
    description?: string;
    reason?: string;
};

function isUserCancelledPayment(error: unknown): boolean {
    if (error == null || typeof error !== "object") return false;
    const e = error as RazorpayNativeError;
    const text = `${e.description ?? ""} ${e.reason ?? ""}`.toLowerCase();
    if (text.includes("cancel")) return true;
    const code = String(e.code ?? "");
    return (
        code === "0" ||
        code === "2" ||
        code.toLowerCase() === "payment_cancelled" ||
        code.toLowerCase() === "payment_processing_cancelled"
    );
}

/**
 * Maps checkout.js-style options (key, order_id, amount, …) to react-native-razorpay.open().
 * Amount is sent as a string (paise) per SDK examples.
 */
function toNativeCheckoutOptions(raw: RazorpayCheckoutModalOptions): Record<string, unknown> {
    const key = raw.key;
    if (typeof key !== "string" || !key.trim()) {
        throw new Error("Missing Razorpay key");
    }

    const out: Record<string, unknown> = {
        key: key.trim(),
        name: typeof raw.name === "string" ? raw.name : "Trendly",
        description: typeof raw.description === "string" ? raw.description : "Contract pre-payment",
    };

    const orderId = raw.order_id;
    if (typeof orderId === "string" && orderId.length > 0) {
        out.order_id = orderId;
    }

    if (raw.amount != null) {
        const n = typeof raw.amount === "number" ? raw.amount : Number(raw.amount);
        if (!Number.isNaN(n) && n > 0) {
            out.amount = String(Math.round(n));
        }
    }

    if (typeof raw.currency === "string" && raw.currency.length > 0) {
        out.currency = raw.currency;
    }

    if (raw.prefill != null && typeof raw.prefill === "object") {
        out.prefill = raw.prefill;
    }

    if (raw.theme != null && typeof raw.theme === "object") {
        const t = raw.theme as { color?: string };
        if (typeof t.color === "string") {
            out.theme = { color: t.color };
        }
    }

    return out;
}

/**
 * Native: Razorpay Standard Checkout via react-native-razorpay (official mobile SDK).
 * Same server order + options as web checkout.js.
 */
export default function RazorpayCheckoutModal({
    visible,
    options,
    onSuccess,
    onClose,
    onError,
}: RazorpayCheckoutModalProps) {
    const openedRef = useRef(false);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const onSuccessRef = useRef(onSuccess);
    const onCloseRef = useRef(onClose);
    const onErrorRef = useRef(onError);
    onSuccessRef.current = onSuccess;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;

    useEffect(() => {
        if (!visible) {
            openedRef.current = false;
            return;
        }

        if (openedRef.current) return;
        openedRef.current = true;

        let cancelled = false;

        const run = async () => {
            try {
                const nativeOpts = toNativeCheckoutOptions(optionsRef.current);
                const data = await RazorpayCheckout.open(nativeOpts);
                if (cancelled) return;
                openedRef.current = false;
                onSuccessRef.current(data);
            } catch (err: unknown) {
                if (cancelled) return;
                openedRef.current = false;
                if (isUserCancelledPayment(err)) {
                    onCloseRef.current();
                    return;
                }
                const message =
                    err != null && typeof err === "object" && "description" in err
                        ? String((err as RazorpayNativeError).description)
                        : err instanceof Error
                          ? err.message
                          : "Payment failed";
                onErrorRef.current?.(err instanceof Error ? err : new Error(message));
            }
        };

        void run();

        return () => {
            cancelled = true;
            openedRef.current = false;
        };
    }, [visible]);

    return null;
}
