import { BRANDS_APP_SCHEME, BRANDS_APPSTORE_URL, BRANDS_PLAYSTORE_URL } from "@/shared-constants/app";
import { Console } from "@/shared-libs/utils/console";
import { Linking, Platform } from "react-native";

export const handleDeepLink = async (
    redirectUrl?: string,
    screenSize?: boolean
) => {
    if (screenSize) return;

    if (Platform.OS === "web" && !screenSize) {
        await Linking.openURL(BRANDS_APPSTORE_URL);
    }

    const url = `${BRANDS_APP_SCHEME}://${redirectUrl}`;

    try {
        const canOpen = await Linking.canOpenURL(url);

        if (canOpen) {
            await Linking.openURL(url);
        } else {
            const storeUrl = Platform.OS === "ios" ? BRANDS_APPSTORE_URL : BRANDS_PLAYSTORE_URL;
            await Linking.openURL(storeUrl);
        }
    } catch (error) {
        Console.error(error, "Error handling deep link:");
    }
};
