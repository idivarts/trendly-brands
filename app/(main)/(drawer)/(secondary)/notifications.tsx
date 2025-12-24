import Notifications from "@/components/notifications";
import ScreenHeader from "@/components/ui/screen-header";
import Colors from "@/constants/Colors";
import {
    useAuthContext,
    useNotificationContext
} from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Appbar } from "react-native-paper";

const NotificationsScreen = () => {
    const theme = useTheme();

    const {
        manager,
    } = useAuthContext();
    const {
        markAllNotificationsAsRead,
        managerNotifications,
        updateManagerNotification,
    } = useNotificationContext();

    const onMarkAsRead = (notificationId: string) => {
        updateManagerNotification(
            manager?.id as string,
            notificationId,
            {
                isRead: true,
            },
        );
    };

    return (
        <AppLayout withWebPadding={false}>
            <ScreenHeader
                title="Notifications"
                rightAction
                rightActionButton={
                    <Appbar.Action
                        icon={() => (
                            <FontAwesomeIcon
                                icon={faCheck}
                                size={20}
                                color={Colors(theme).text}
                            />
                        )}
                        onPress={() => {
                            markAllNotificationsAsRead(manager?.id as string);
                        }}
                        color={Colors(theme).text}
                    />
                }
            />
            <Notifications
                notifications={managerNotifications}
                onMarkAsRead={onMarkAsRead}
            />
        </AppLayout>
    );
};

export default NotificationsScreen;
