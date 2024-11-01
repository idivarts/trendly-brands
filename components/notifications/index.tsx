import { stylesFn } from "@/styles/NotificationCard.styles";
import { useTheme } from "@react-navigation/native";
import { ScrollView } from "react-native";
import { NotificationCard } from "../NotificationCard";
import { Notification } from "@/types/Notification";
import EmptyState from "@/components/ui/empty-state";

interface NotificationsProps {
  notifications: Notification[];
  onCreateGroup: (
    collaborationId: string,
    userId: string,
  ) => void;
  onMarkAsRead: (notificationId: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({
  notifications,
  onCreateGroup,
  onMarkAsRead,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <ScrollView style={styles.container}>
      {notifications.length === 0 ? (
        <EmptyState
          actionLabel="Go back"
          title="No notifications found"
        />
      ) : notifications.map((item) => (
        <NotificationCard
          avatar="https://cdn.iconscout.com/icon/free/png-256/avatar-370-456322.png"
          data={{
            collaborationId: item.data?.collaborationId,
            groupId: item.data?.groupId,
            userId: item.data?.userId,
          }}
          description={item.description}
          isRead={item.isRead}
          key={item.id}
          onCreateGroup={onCreateGroup}
          onMarkAsRead={() => onMarkAsRead(item.id)}
          time={item.timeStamp}
          title={item.title}
        />
      ))}
    </ScrollView>
  );
};

export default Notifications;
