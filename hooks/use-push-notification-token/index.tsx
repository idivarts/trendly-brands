import { Platform } from "react-native";
import { Manager } from "@/types/Manager";

import usePushNotificationTokenNative from "./use-push-notification-token.native";
import usePushNotificationTokenWeb from "./use-push-notification-token.web";

interface PushNotificationTokenHookProps {
  user: Manager | null;
}

const usePushNotificationToken = ({
  user,
}: PushNotificationTokenHookProps): {
  updatedTokens: () => Promise<{
    ios?: string[];
    android?: string[];
    web?: string[];
  } | null>;
} => {
  let updatedTokens: () => Promise<{
    ios?: string[];
    android?: string[];
    web?: string[];
  } | null>;

  if (Platform.OS === "web") {
    updatedTokens = usePushNotificationTokenWeb({ user }).updatedTokens;
  } else {
    updatedTokens = usePushNotificationTokenNative({ user }).updatedTokens;
  }

  return {
    updatedTokens,
  };
};

export default usePushNotificationToken;
