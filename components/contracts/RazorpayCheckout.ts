import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

/**
 * Opens Razorpay hosted payment URL when checkout.js modal is unavailable or failed.
 */
export async function openRazorpayHostedPaymentLink(shortUrl: string): Promise<void> {
    if (Platform.OS === "web") {
        if (typeof window === "undefined") return;
        const opened = window.open(shortUrl, "_blank", "noopener,noreferrer");
        if (!opened) {
            window.location.assign(shortUrl);
        }
        return;
    }

    await WebBrowser.openBrowserAsync(shortUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
}
