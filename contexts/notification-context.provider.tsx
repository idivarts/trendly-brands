import {
  useContext,
  createContext,
  type PropsWithChildren,
  useState,
  useEffect,
} from "react";

import { collection, query, doc, orderBy, updateDoc, onSnapshot } from "firebase/firestore";
import { Notification } from "@/types/Notification";
import { FirestoreDB } from "@/utils/firestore";
import { useAuthContext } from "./auth-context.provider";

interface NotificationContextProps {
  managerNotifications: Notification[];
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

  const updateManagerNotification = async (
    managerId: string,
    notificationId: string,
    data: Partial<Notification>,
  ) => {
    const managerRef = doc(FirestoreDB, "managers", managerId);
    const notificationRef = doc(managerRef, "notifications", notificationId);

    await updateDoc(notificationRef, data);
  }

  return (
    <NotificationContext.Provider
      value={{
        managerNotifications,
        unreadNotifications,
        updateManagerNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};