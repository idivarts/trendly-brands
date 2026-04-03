import * as WebBrowser from "expo-web-browser";

export type RazorpayPrefill = {
    name?: string;
    email?: string;
    contact?: string;
};

export type OpenRazorpayCheckoutOptions = {
    /**
     * Native apps cannot use Razorpay `checkout.js`.
     * Provide the hosted payment link from backend (e.g. `https://rzp.io/rzp/...`).
     */
    shortUrl?: string;
    // Kept for callsite parity; not used on native for now.
    key?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
    name?: string;
    description?: string;
    prefill?: RazorpayPrefill;
    themeColor?: string;
};

export async function loadRazorpayCheckoutScript() {
    // No-op on native; checkout.js is web-only.
}

export async function openRazorpayCheckout(options: OpenRazorpayCheckoutOptions) {
    if (!options.shortUrl) {
        throw new Error("Missing Razorpay shortUrl for native checkout");
    }

    const result = await WebBrowser.openBrowserAsync(options.shortUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });

    return result;
}

