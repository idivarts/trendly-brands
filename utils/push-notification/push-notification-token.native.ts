import { Manager } from "@/types/Manager";

export const updatedTokens = async (user: Manager | null) => {
    if (!user) return null;

    let newUpdatedTokens: {
        ios?: string[];
        android?: string[];
        web?: string[];
    } | null = null;

    // const token = await messaging().getToken();

    // if (Platform.OS === "ios") {
    //   newUpdatedTokens = removeToken("ios", user, token);
    // } else if (Platform.OS === "android") {
    //   newUpdatedTokens = removeToken("android", user, token);
    // }

    // await messaging().deleteToken();

    return newUpdatedTokens;
};
