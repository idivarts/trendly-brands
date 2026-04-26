import EmptyState from "@/components/ui/empty-state";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { Notification } from "@/types/Notification";
import { useTheme, type Theme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { FlatList, StyleSheet } from "react-native";
import { NotificationCard } from "../NotificationCard";
import { View as ThemedView } from "../theme/Themed";

interface NotificationsProps {
    notifications: Notification[];
    onMarkAsRead: (notificationId: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({
    notifications,
    onMarkAsRead,
}) => {
    const theme = useTheme();
    const styles = useMemo(() => useNotificationStyles(theme), [theme]);

    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["left", "right", "bottom"]}>
            {
                notifications.length === 0 ? (
                    <ThemedView style={styles.container}>
                        <EmptyState
                            hideAction
                            image={require("@/assets/images/illustration2.png")}
                            subtitle="We have no notifications for you today!"
                            title="You are all caught up! "
                        />
                    </ThemedView >
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

function useNotificationStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            padding: 16,
            backgroundColor: Colors(theme).background,
        },
        contentContainer: {
            gap: 16,
            paddingBottom: 24,
        },
        card: {
            padding: 16,
            borderRadius: 10,
            backgroundColor: Colors(theme).card,
            shadowColor: Colors(theme).transparent,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
        },
        content: {
            marginLeft: 16,
            flex: 1,
            color: Colors(theme).text,
        },
        title: {
            fontWeight: "bold",
            color: Colors(theme).text,
        },
        time: {
            color: Colors(theme).text,
            marginTop: 5,
        },
        actions: {
            flexDirection: "row",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            rowGap: 10,
            columnGap: 10,
            marginTop: 10,
        },
    });
}

export default Notifications;
