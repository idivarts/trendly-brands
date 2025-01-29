import { Manager } from "@/types/Manager";

export const newToken = (
  os: "ios" | "android" | "web",
  user: Manager,
  currentToken: string
) => {
  if (!user) return null;

  const createOrUpdateToken = (platformTokens: string[] = []) => {
    if (!platformTokens.includes(currentToken)) {
      return platformTokens.concat(currentToken);
    }
    return null;
  };

  const updatedPushNotificationToken = {
    ...user?.pushNotificationToken,
    [os]: createOrUpdateToken(user?.pushNotificationToken[os]),
  };

  return updatedPushNotificationToken[os] ? updatedPushNotificationToken : null;
};

export const removeToken = (
  os: "ios" | "android" | "web",
  user: Manager,
  currentToken: string
) => {
  if (!user) return null;

  const deleteToken = (platformTokens: string[] = []) => {
    if (platformTokens.includes(currentToken)) {
      return platformTokens.filter((t) => t !== currentToken);
    }
    return null;
  };

  const updatedPushNotificationToken = {
    ...user?.pushNotificationToken,
    [os]: deleteToken(user?.pushNotificationToken[os]),
  };

  return updatedPushNotificationToken[os] ? updatedPushNotificationToken : null;
};
