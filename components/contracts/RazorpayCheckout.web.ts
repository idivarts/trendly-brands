let checkoutLoaderPromise: Promise<void> | null = null;

const CHECKOUT_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
    interface Window {
        Razorpay?: any;
    }
}

export type RazorpayPrefill = {
    name?: string;
    email?: string;
    contact?: string;
};

export type OpenRazorpayCheckoutOptions = {
    key: string;
    orderId: string;
    amount?: number;
    currency?: string;
    name?: string;
    description?: string;
    prefill?: RazorpayPrefill;
    themeColor?: string;
};

export async function loadRazorpayCheckoutScript() {
    if (typeof window === "undefined") {
        throw new Error("Razorpay checkout.js is only available on web.");
    }

    if (window.Razorpay) return;
    if (checkoutLoaderPromise) return checkoutLoaderPromise;

    checkoutLoaderPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = CHECKOUT_SCRIPT_URL;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay checkout.js"));
        document.body.appendChild(script);
    });

    return checkoutLoaderPromise;
}

export async function openRazorpayCheckout(options: OpenRazorpayCheckoutOptions) {
    await loadRazorpayCheckoutScript();

    return new Promise((resolve, reject) => {
        if (!window.Razorpay) {
            reject(new Error("Razorpay checkout.js failed to initialize"));
            return;
        }

        const razorpayOptions: any = {
            key: options.key,
            order_id: options.orderId,
            name: options.name || "Trendly",
            description: options.description || "Contract Payment",
            prefill: options.prefill,
            theme: options.themeColor ? { color: options.themeColor } : undefined,
            handler: (response: unknown) => resolve(response),
            modal: {
                ondismiss: () => reject(new Error("Payment cancelled")),
            },
        };

        if (options.amount != null) razorpayOptions.amount = options.amount;
        if (options.currency != null) razorpayOptions.currency = options.currency;

        const razorpay = new window.Razorpay(razorpayOptions);

        razorpay.on("payment.failed", (response: any) => {
            const message = response?.error?.description || "Payment failed";
            reject(new Error(message));
        });

        razorpay.open();
    });
}

