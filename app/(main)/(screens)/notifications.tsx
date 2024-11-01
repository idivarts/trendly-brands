import AppLayout from "@/layouts/app-layout";
import { useNavigation } from "expo-router";
import React from "react";
import { Appbar } from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import Colors from "@/constants/Colors";
import Notifications from "@/components/notifications";
import {
  useAuthContext,
  useChatContext as useChat,
  useCollaborationContext,
  useNotificationContext
} from "@/contexts";
import { useChatContext } from "stream-chat-expo";
import Toaster from "@/shared-uis/components/toaster/Toaster";


const NotificationsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  const {
    manager,
  } = useAuthContext();
  const {
    markAllNotificationsAsRead,
    managerNotifications,
    updateManagerNotification,
  } = useNotificationContext();
  const {
    createGroupWithMembers,
  } = useChat();
  const {
    client,
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
    createGroupWithMembers(client, collaborationData.name, [
      client.user?.id as string,
      userId,
    ]).then(() => {
      Toaster.success("Group created successfully");
    });
  };

  return (
    <AppLayout>
      <Appbar.Header
        style={{
          backgroundColor: Colors(theme).background,
          elevation: 0,
        }}
        statusBarHeight={0}
      >
        <Appbar.Action
          icon="arrow-left"
          color={Colors(theme).text}
          onPress={() => {
            navigation.goBack();
          }}
        />

        <Appbar.Content
          title="Notifications"
          color={Colors(theme).text}
        />

        <Appbar.Action
          icon="check"
          onPress={() => {
            markAllNotificationsAsRead(manager?.id as string);
          }}
          color={Colors(theme).text}
        />
      </Appbar.Header>
      <Notifications
        notifications={managerNotifications}
        onMarkAsRead={onMarkAsRead}
        onCreateGroup={onCreateGroup}
      />
    </AppLayout>
  );
};

export default NotificationsScreen;
