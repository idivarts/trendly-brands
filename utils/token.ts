import { Manager } from "@/types/Manager";
import { User } from "@/types/User";

export const newToken = (
  os: "ios" | "android" | "web",
  user: Manager,
  token: string
) => {
  if (!user) return null;

  const createOrUpdateToken = (platformTokens: string[] = []) => {
    if (!platformTokens.includes(token)) {
      return platformTokens.concat(token);
    }
    return null;
  };

  const updatedPushNotificationToken = {
    ...user?.pushNotificationToken,
    [os]: createOrUpdateToken(user?.pushNotificationToken[os]),
  };

  return updatedPushNotificationToken[os] ? updatedPushNotificationToken : null;
};
