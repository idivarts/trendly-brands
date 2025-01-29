import {
  getToken,
  messaging,
  deleteToken,
} from "@/utils/messaging-web";
import { Manager } from "@/types/Manager";
import { removeToken } from "@/utils/token";

interface PushNotificationTokenWebHookProps {
  user: Manager | null;
}

const usePushNotificationTokenWeb = ({
  user,
}: PushNotificationTokenWebHookProps): {
  updatedTokens: () => Promise<{
    ios?: string[];
    android?: string[];
    web?: string[];
  } | null>;
} => {
  const updatedTokens = async () => {
    if (!user) return null;

    const webToken = await getToken(
      messaging,
      {
        vapidKey: process.env.EXPO_PUBLIC_CLOUD_MESSAGING_VALID_KEY,
      },
    );

    const newUpdatedTokens = removeToken("web", user, webToken);

    await deleteToken(messaging);

    return newUpdatedTokens;
  }

  return {
    updatedTokens,
  };
};

export default usePushNotificationTokenWeb;
