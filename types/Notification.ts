import { INotifications } from "@/shared-libs/firestore/trendly-pro/models/notifications";

export interface Notification extends INotifications {
    id: string;
}

export interface PushNotificationPayload {
    data?: {
        [key: string]: any;
    };
    notification: {
        title: string;
        description: string;
        image?: string;
    };
}
