import React from "react";
import { View } from "react-native";
import { Text, Button, Card, Avatar } from "react-native-paper";
import { stylesFn } from "@/styles/NotificationCard.styles";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";

interface NotificationCardProps {
  avatar: string;
  data: {
    collaborationId?: string;
    groupId?: string;
    userId?: string;
  };
  description: string;
  isRead: boolean;
  onMarkAsRead: () => void;
  time: number;
  title: string;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  avatar,
  data,
  description,
  isRead,
  onMarkAsRead,
  time,
  title,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const router = useRouter();

  let action: string | undefined;

  if (data.collaborationId) {
    action = `/collaboration-details/${data.collaborationId}`;
  } else if (data.groupId) {
    action = `/channel/${data.groupId}`; // TODO: Save the groupId or cid in the database
  }

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Avatar.Image size={50} source={{ uri: avatar }} />
        <View style={styles.content}>
          <Text style={styles.title}>
            {title}
          </Text>
          <Text style={styles.time}>
            {description}
          </Text>
          <Text style={styles.time}>
            {
              new Date(time).toLocaleTimeString(
                "en-US",
                {
                  hour: "numeric",
                  minute: "numeric",
                }
              )
            }
            {", "}
            {
              new Date(time).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              )
            }
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        {action && (
          <Button
            mode="contained"
            onPress={action ? () => {
              onMarkAsRead();
              router.push(action as string);
            } : undefined}
          >
            Open
          </Button>
        )}
        {!isRead && (
          <Button
            mode="outlined"
            onPress={onMarkAsRead}
          >
            Mark as Read
          </Button>
        )}
      </View>
    </Card>
  );
};
