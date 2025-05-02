import { removeToken } from "@/shared-libs/utils/token";
import { Manager } from "@/types/Manager";
import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";

export const updatedTokens = async (user: Manager | null) => {
  if (!user) return null;

  let newUpdatedTokens: {
    ios?: string[];
    android?: string[];
    web?: string[];
  } | null = null;

  const token = await messaging().getToken();

  if (Platform.OS === "ios") {
    newUpdatedTokens = removeToken("ios", user, token);
  } else if (Platform.OS === "android") {
    newUpdatedTokens = removeToken("android", user, token);
  }

  await messaging().deleteToken();

  return newUpdatedTokens;
};
