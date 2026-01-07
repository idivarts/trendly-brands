import {
    createContext,
    type PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from "react";

import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { Notification } from "@/types/Notification";
import {
    collection,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";
import { useAuthContext } from "./auth-context.provider";

interface NotificationContextProps {
    managerNotifications: Notification[];
    markAllNotificationsAsRead: (managerId: string) => Promise<void>;
    unreadNotifications: number;
    updateManagerNotification: (
        managerId: string,
        notificationId: string,
        data: Partial<Notification>,
    ) => Promise<void>;
}

export const NotficationTypesToHandle = ["application", "new-quotation", "contract-start-request", "contract-end-request", "feedback-given"]

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
        if (manager && manager.id) {
            const unsubscribe = fetchManagerNotifications(manager.id);
            return () => {
                unsubscribe()
            }
        }
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
            Console.error(error, "Error updating notifications");
        }
    }

    return (
        <NotificationContext.Provider
            value={{
                managerNotifications,
                markAllNotificationsAsRead,
                unreadNotifications,
                updateManagerNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
