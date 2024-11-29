import AppLayout from "@/layouts/app-layout";
import React from "react";
import { Appbar } from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import Colors from "@/constants/Colors";
import Notifications from "@/components/notifications";
import {
  useAuthContext,
  useChatContext,
  useCollaborationContext,
  useNotificationContext
} from "@/contexts";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import ScreenHeader from "@/components/ui/screen-header";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";

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
  const {
    client,
    createGroupWithMembers,
  } = useChatContext();

  const {
    getCollaborationById,
  } = useCollaborationContext();

  const onMarkAsRead = (notificationId: string) => {
    updateManagerNotification(
      manager?.id as string,
      notificationId,
      {
        isRead: true,
      },
    );
  };

  const onCreateGroup = async (
    collaborationId: string,
    userId: string,
  ) => {
    const collaborationData = await getCollaborationById(collaborationId);
    // @ts-ignore
    createGroupWithMembers(client, collaborationData.name, [
      // @ts-ignore
      client.user?.id as string,
      userId,
    ]).then(() => {
      Toaster.success("Group created successfully");
    });
  };

  return (
    <AppLayout>
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
        onCreateGroup={onCreateGroup}
      />
    </AppLayout>
  );
};

export default NotificationsScreen;
