import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef } from "react";
import type { RazorpayCheckoutModalProps } from "../utils/razorpay-checkout-modal.types";

export type { RazorpayCheckoutModalOptions } from "../utils/razorpay-checkout-modal.types";

/**
 * Native: opens the backend-issued Razorpay Payment Link (`short_url`) in an
 * in-app browser (SFSafariViewController / Chrome Custom Tab) instead of a
 * native checkout SDK — so the app carries no in-app payment module.
 *
 * `openBrowserAsync` resolves when the user dismisses the browser; we treat
 * that as "done" and let the hook poll the authoritative payment status from
 * the backend (the browser result is not trusted as proof of payment).
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
            const shortUrl = optionsRef.current?.short_url;
            if (typeof shortUrl !== "string" || !shortUrl.trim()) {
                openedRef.current = false;
                onErrorRef.current?.(new Error("Payment link unavailable. Please try again."));
                return;
            }

            try {
                await WebBrowser.openBrowserAsync(shortUrl.trim());
                if (cancelled) return;
                openedRef.current = false;
                // Browser dismissed — hook re-checks real status from backend.
                onSuccessRef.current({ dismissed: true });
            } catch (err: unknown) {
                if (cancelled) return;
                openedRef.current = false;
                const message = err instanceof Error ? err.message : "Could not open payment page";
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
