import { stylesFn } from "@/styles/NotificationCard.styles";
import { useTheme } from "@react-navigation/native";
import { ScrollView } from "react-native";
import { NotificationCard } from "../NotificationCard";
import { Notification } from "@/types/Notification";
import EmptyState from "@/components/ui/empty-state";

interface NotificationsProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({
  notifications,
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
          collaborationId={item.data?.collaborationId || ""}
          description={item.description}
          groupId={item.data?.groupId || ""}
          isRead={item.isRead}
          key={item.id}
          onMarkAsRead={() => onMarkAsRead(item.id)}
          time={item.timeStamp}
          title={item.title}
        />
      ))}
    </ScrollView>
  );
};

export default Notifications;
