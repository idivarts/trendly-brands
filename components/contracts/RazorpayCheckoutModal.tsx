import React, { useEffect, useRef } from "react";
import type { RazorpayCheckoutModalProps } from "./razorpay-checkout-modal.types";

export type { RazorpayCheckoutModalOptions } from "./razorpay-checkout-modal.types";

/**
 * Web: Razorpay Standard Checkout via checkout.js (in-page overlay).
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
        let pollId: ReturnType<typeof setInterval> | undefined;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const getRazorpay = () =>
            (window as unknown as { Razorpay?: new (o: object) => { open: () => void; on: (ev: string, fn: (r: unknown) => void) => void } })
                .Razorpay;

        const openCheckout = () => {
            if (cancelled) return;
            try {
                const Razorpay = getRazorpay();
                if (!Razorpay) throw new Error("Razorpay SDK not loaded");

                const rzp = new Razorpay({
                    ...optionsRef.current,
                    handler: (response: unknown) => {
                        onSuccessRef.current(response);
                        openedRef.current = false;
                    },
                    modal: {
                        ondismiss: () => {
                            onCloseRef.current();
                            openedRef.current = false;
                        },
                    },
                });

                rzp.on("payment.failed", (response: unknown) => {
                    const r = response as { error?: { description?: string } };
                    const message = r?.error?.description || "Payment failed";
                    onErrorRef.current?.(new Error(message));
                    openedRef.current = false;
                });

                rzp.open();
            } catch (err) {
                onErrorRef.current?.(err);
                openedRef.current = false;
            }
        };

        const ensureScript = (): Promise<void> =>
            new Promise((resolve, reject) => {
                if (getRazorpay()) {
                    resolve();
                    return;
                }
                const existing = document.querySelector(
                    'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
                );
                if (existing) {
                    pollId = setInterval(() => {
                        if (getRazorpay()) {
                            if (pollId) clearInterval(pollId);
                            resolve();
                        }
                    }, 50);
                    timeoutId = setTimeout(() => {
                        if (pollId) clearInterval(pollId);
                        if (!getRazorpay()) reject(new Error("Razorpay SDK load timeout"));
                        else resolve();
                    }, 15_000);
                    return;
                }
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
                document.body.appendChild(script);
            });

        void ensureScript()
            .then(() => {
                if (!cancelled) openCheckout();
            })
            .catch((err) => {
                if (!cancelled) {
                    onErrorRef.current?.(err);
                    openedRef.current = false;
                }
            });

        return () => {
            cancelled = true;
            if (pollId) clearInterval(pollId);
            if (timeoutId) clearTimeout(timeoutId);
            openedRef.current = false;
        };
    }, [visible]);

    return null;
}
