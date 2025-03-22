import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

import { INotifications } from "@/shared-libs/firestore/trendly-pro/models/notifications";
import { Notification, PushNotificationPayload } from "@/types/Notification";
import { FirestoreDB } from "@/utils/firestore";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useAuthContext } from "./auth-context.provider";

interface NotificationContextProps {
  createNotification: (
    userId: string,
    notification: INotifications,
    userType: string,
  ) => Promise<void>;
  managerNotifications: Notification[];
  markAllNotificationsAsRead: (managerId: string) => Promise<void>;
  sendNotification: (
    ids: {
      users?: string[];
      managers?: string[];
    },
    payload: PushNotificationPayload,
  ) => Promise<void>;
  unreadNotifications: number;
  updateManagerNotification: (
    managerId: string,
    notificationId: string,
    data: Partial<Notification>,
  ) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps>(null!);

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [managerNotifications, setManagerNotifications] = useState<Notification[]>([]);

  const {
    manager,
  } = useAuthContext();

  const fetchManagerNotifications = (
    managerId: string
  ) => {
    const managerRef = doc(FirestoreDB, "managers", managerId);

    const notificationsRef = collection(managerRef, "notifications");
    const notificationsQuery = query(notificationsRef, orderBy("timeStamp", "desc"));
    return onSnapshot(notificationsQuery, (snapshot) => {
      const notifications: Notification[] = [];
      snapshot.forEach((doc) => {
        notifications.push({
          ...doc.data() as Notification,
          id: doc.id,
        });
      });

      const unreadNotifications = notifications.filter((notification) => !notification.isRead);

      setUnreadNotifications(unreadNotifications.length);

      setManagerNotifications(notifications);
    });
  }

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (manager && manager.id) {
      unsubscribe = fetchManagerNotifications(manager.id);
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [manager]);

  const sendNotification = async (
    ids: {
      users?: string[];
      managers?: string[];
    },
    payload: PushNotificationPayload,
  ) => {
    await fetch("https://be.trendly.now/api/v1/chat/notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${manager}`,
      },
      body: JSON.stringify({
        userId: ids.users || [],
        managerId: ids.managers || [],
        payload,
      }),
    });
  }

  const createNotification = async (
    userId: string,
    notification: INotifications,
    userType: string = "managers",
  ) => {
    const userRef = doc(FirestoreDB, userType, userId);
    const notificationsRef = collection(userRef, "notifications");
    await addDoc(notificationsRef, {
      data: notification.data,
      description: notification.description,
      isRead: notification.isRead,
      timeStamp: notification.timeStamp,
      title: notification.title,
      type: notification.type,
    });
  }

  const updateManagerNotification = async (
    managerId: string,
    notificationId: string,
    data: Partial<Notification>,
  ) => {
    const managerRef = doc(FirestoreDB, "managers", managerId);
    const notificationRef = doc(managerRef, "notifications", notificationId);

    await updateDoc(notificationRef, data);
  }

  const markAllNotificationsAsRead = async (
    managerId: string,
  ) => {
    try {
      const managerRef = doc(FirestoreDB, "managers", managerId);
      const notificationsRef = collection(managerRef, "notifications");

      const unreadNotificationsQuery = query(notificationsRef, where("isRead", "==", false));

      const unreadSnapshot = await getDocs(unreadNotificationsQuery);

      if (unreadSnapshot.empty) {
        return;
      }

      const batch = writeBatch(FirestoreDB);

      unreadSnapshot.forEach((notificationDoc) => {
        const notificationRef = notificationDoc.ref;
        batch.update(notificationRef, { isRead: true });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error updating notifications: ", error);
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        createNotification,
        managerNotifications,
        markAllNotificationsAsRead,
        sendNotification,
        unreadNotifications,
        updateManagerNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
