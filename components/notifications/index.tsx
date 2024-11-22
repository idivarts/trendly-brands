import { stylesFn } from "@/styles/NotificationCard.styles";
import { useTheme } from "@react-navigation/native";
import { ScrollView } from "react-native";
import { NotificationCard } from "../NotificationCard";
import { Notification } from "@/types/Notification";
import EmptyState from "@/components/ui/empty-state";
import { View } from "../theme/Themed";

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
    <>
      {
        notifications.length === 0 ? (
          <View style={styles.container}>
            <EmptyState
              hideAction
              image={require("@/assets/images/illustration2.png")}
              subtitle="We have no notifications for you today!"
              title="You are all caught up! "
            />
          </View >
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
          >
            {
              notifications.map((item) => (
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
              ))
            }
          </ScrollView>
        )
      }
    </>
  );
};

export default Notifications;
