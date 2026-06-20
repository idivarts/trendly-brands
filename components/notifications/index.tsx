import EmptyState from "@/components/ui/empty-state";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { Notification } from "@/types/Notification";
import { useTheme, type Theme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    StyleSheet,
} from "react-native";
import { NotificationCard } from "../NotificationCard";
import { View as ThemedView } from "../theme/Themed";

/** Items revealed per batch as the user scrolls (~90% depth). */
const NOTIFICATION_PAGE_SIZE = 25;

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

    const [displayCount, setDisplayCount] = useState(() =>
        Math.min(NOTIFICATION_PAGE_SIZE, notifications.length)
    );
    const scrollLoadGateRef = useRef(false);

    useEffect(() => {
        if (notifications.length === 0) {
            setDisplayCount(0);
            return;
        }
        setDisplayCount((prev) => {
            const capped = Math.min(prev, notifications.length);
            if (prev === 0) {
                return Math.min(NOTIFICATION_PAGE_SIZE, notifications.length);
            }
            return capped;
        });
    }, [notifications.length]);

    const visibleNotifications = useMemo(
        () => notifications.slice(0, displayCount),
        [notifications, displayCount]
    );

    const hasMoreToShow = displayCount < notifications.length;

    const handleScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (!hasMoreToShow) return;
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            if (contentSize.height <= 0) return;

            const viewportBottom = contentOffset.y + layoutMeasurement.height;
            const scrolledRatio = viewportBottom / contentSize.height;

            if (scrolledRatio < 0.82) {
                scrollLoadGateRef.current = false;
                return;
            }

            if (scrolledRatio >= 0.9 && !scrollLoadGateRef.current) {
                scrollLoadGateRef.current = true;
                setDisplayCount((prev) => {
                    const next = Math.min(
                        prev + NOTIFICATION_PAGE_SIZE,
                        notifications.length
                    );
                    if (next > prev) {
                        setTimeout(() => {
                            scrollLoadGateRef.current = false;
                        }, 200);
                    } else {
                        scrollLoadGateRef.current = false;
                    }
                    return next;
                });
            }
        },
        [hasMoreToShow, notifications.length]
    );

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
                        data={visibleNotifications}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) =>
                            <NotificationCard
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
                        ListFooterComponent={
                            hasMoreToShow ? (
                                <ThemedView style={styles.footer}>
                                    <ActivityIndicator color={Colors(theme).primary} />
                                </ThemedView>
                            ) : null
                        }
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        initialNumToRender={12}
                        maxToRenderPerBatch={NOTIFICATION_PAGE_SIZE}
                        windowSize={5}
                        removeClippedSubviews={Platform.OS !== "web"}
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
        footer: {
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
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
