import * as Updates from "expo-updates";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";

// Prompts the user to restart once an OTA update has finished downloading.
// Without this, `checkAutomatically: "ON_LOAD"` only applies the update on the
// NEXT cold start, leaving users a launch behind.
export const OTAUpdateGate = () => {
    const { isUpdatePending, downloadError } = Updates.useUpdates();
    const prompted = useRef(false);

    useEffect(() => {
        if (__DEV__ || !Updates.isEnabled) return;
        if (!isUpdatePending || prompted.current) return;
        prompted.current = true;

        // Let the forced store-update Alert from UpdateProvider claim the first
        // few seconds; two stacked Alerts would bury this one.
        const timer = setTimeout(() => {
            Alert.alert(
                "Update ready",
                "Restart the app to apply the latest version.",
                [
                    { text: "Later", style: "cancel" },
                    {
                        text: "Restart now",
                        style: "default",
                        onPress: () => {
                            Updates.reloadAsync().catch((e) =>
                                console.warn("[ota] reload failed", e)
                            );
                        },
                    },
                ],
                { cancelable: true }
            );
        }, 4000);

        return () => clearTimeout(timer);
    }, [isUpdatePending]);

    useEffect(() => {
        if (downloadError) console.warn("[ota] download failed", downloadError);
    }, [downloadError]);

    return null;
};

export default OTAUpdateGate;
