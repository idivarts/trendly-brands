import {
  useContext,
  createContext,
  type PropsWithChildren,
  useEffect,
} from "react";
import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";

import { PermissionsAndroid } from 'react-native';
import { useAuthContext } from "./auth-context.provider";
import { newToken } from "@/utils/token";

interface CloudMessagingContextProps {
  getToken: () => Promise<string>;
}

const CloudMessagingContext = createContext<CloudMessagingContextProps>({
  getToken: async () => "",
});

export const useCloudMessagingContext = () => useContext(CloudMessagingContext);

export const CloudMessagingContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const {
    session,
    manager: user,
    updateManager,
  } = useAuthContext();

  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log("Authorization status:", authStatus);
    }
  }

  const getToken = async () => {
    const token = await messaging().getToken();
    if (session && user) {
      const newNativeToken = Platform.OS === "ios" ? newToken("ios", user, token) : newToken("android", user, token);

      if (newNativeToken) {
        await updateManager(session as string, {
          pushNotificationToken: newNativeToken,
        });
      }
    }

    return token;
  };

  const initNotification = async () => {
    await requestUserPermission();
    await getToken();

    messaging()
      .getInitialNotification()
      .then(async (remoteMessage) => {
        if (remoteMessage) {
          console.log("Notification caused app to open from quit state:", remoteMessage);
        }
      });
  }

  useEffect(() => {
    if (session && Platform.OS === 'android') {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
  }, [session]);

  useEffect(() => {
    if (!session && !user) return;

    initNotification();

    const backgroundSubscription = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("Notification caused app to open from background state:", remoteMessage.notification);
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("Message handled in the background:", remoteMessage);
    });

    const foregroundSubscription = messaging().onMessage(async (remoteMessage) => {
      console.log("A new FCM message arrived!", remoteMessage);
    });

    return () => {
      backgroundSubscription();
      foregroundSubscription();
    };
  }, [session, user]);

  return (
    <CloudMessagingContext.Provider
      value={{
        getToken,
      }}
    >
      {children}
    </CloudMessagingContext.Provider>
  );
};
