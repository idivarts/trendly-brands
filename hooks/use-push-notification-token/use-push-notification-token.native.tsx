import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import { Manager } from "@/types/Manager";
import { removeToken } from "@/utils/token";

interface PushNotificationTokenNativeHookProps {
  user: Manager | null;
}

const usePushNotificationTokenNative = ({
  user,
}: PushNotificationTokenNativeHookProps): {
  updatedTokens: () => Promise<{
    ios?: string[];
    android?: string[];
    web?: string[];
  } | null>;
} => {
  const updatedTokens = async () => {
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
  }

  return {
    updatedTokens,
  };
};

export default usePushNotificationTokenNative;
