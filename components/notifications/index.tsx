import EmptyState from "@/components/ui/empty-state";
import AppLayout from "@/layouts/app-layout";
import { stylesFn } from "@/styles/NotificationCard.styles";
import { Notification } from "@/types/Notification";
import { useTheme } from "@react-navigation/native";
import { FlatList } from "react-native";
import { NotificationCard } from "../NotificationCard";
import { View } from "../theme/Themed";

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
        <AppLayout withWebPadding={false} safeAreaEdges={["left", "right", "bottom"]}>
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
                    <FlatList
                        style={styles.container}
                        contentContainerStyle={styles.contentContainer}
                        data={notifications}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) =>
                            <NotificationCard
                                // avatar="https://cdn.iconscout.com/icon/free/png-256/avatar-370-456322.png"
                                data={{
                                    collaborationId: item.data?.collaborationId,
                                    groupId: item.data?.groupId,
                                    userId: item.data?.userId,
                                }}
                                description={item.description}
                                isRead={item.isRead}
                                onMarkAsRead={() => onMarkAsRead(item.id)}
                                time={item.timeStamp}
                                title={item.title}
                                type={item.type}
                            />
                        }
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                    />
                )
            }
        </AppLayout>
    );
};

export default Notifications;
