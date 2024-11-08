import {
  useContext,
  createContext,
  type PropsWithChildren,
  useEffect,
} from "react";

import { getToken } from "firebase/messaging";
import { messaging } from "@/utils/messaging-web";
import { Platform } from "react-native";
import { useAuthContext } from "./auth-context.provider";
import { newToken } from "@/utils/token";

interface CloudMessagingContextProps { }

const CloudMessagingContext = createContext<CloudMessagingContextProps>(null!);

export const useCloudMessagingContext = () => useContext(CloudMessagingContext);

export const CloudMessagingContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const {
    session,
    manager: user,
    updateManager,
  } = useAuthContext();

  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(
        messaging,
        {
          vapidKey: process.env.EXPO_PUBLIC_CLOUD_MESSAGING_VALID_KEY,
        },
      );

      if (user && session) {
        const newNativeToken = newToken("web", user, token);

        if (newNativeToken) {
          await updateManager(session, {
            pushNotificationToken: newNativeToken,
          });
        }
      }
    } else if (permission === "denied") {
      alert("You denied the permission to receive notifications");
    }
  }

  useEffect(() => {
    if (Platform.OS === "web" && session && user) {
      requestPermission();
    }
  }, [session, user]);

  return (
    <CloudMessagingContext.Provider
      value={null!}
    >
      {children}
    </CloudMessagingContext.Provider>
  );
};
