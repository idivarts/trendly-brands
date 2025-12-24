import Colors from "@/constants/Colors";
import { NotficationTypesToHandle } from "@/contexts/notification-context.provider";
import { Theme, useTheme } from "@react-navigation/native";
import { Href, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ActivityIndicator, Card, Text } from "react-native-paper";

interface NotificationCardProps {
    // avatar: string;
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
    type: string
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
    // avatar,
    data,
    description,
    isRead,
    onMarkAsRead,
    time,
    title,
    type
}) => {
    const theme = useTheme();
    const styles = stylesFn(theme);
    const router = useRouter();
    const [loading, setLoading] = useState(false)

    const action = async () => {
        try {
            setLoading(true);
            if (NotficationTypesToHandle.includes(type)) {
                let redirectUrl: Href;

                // "application", "new-quotation", "contract-start-request", "contract-end-request", "feedback-given"
                if (type === "application") {
                    redirectUrl = `/collaboration-details/${data.collaborationId}`;
                } else if (type === "new-quotation") {
                    redirectUrl = `/contract-details/${data.groupId}`; // TODO: Save the groupId or cid in the database
                } else if (type === "contract-start-request") {
                    redirectUrl = `/contract-details/${data.groupId}`;
                } else if (type === "contract-end-request") {
                    redirectUrl = `/contract-details/${data.groupId}`;
                } else if (type === "feedback-given") {
                    redirectUrl = `/contract-details/${data.collaborationId}`;
                } else
                    return;
                router.push(redirectUrl);
            }
        } finally {
            setLoading(false);
        }
    }
    return (
        <Card style={[styles.card, isRead && styles.cardRead]}>
            <Pressable style={styles.row} onPress={() => {
                onMarkAsRead();
                action();
            }}>
                {/* <Avatar.Image size={50} source={{ uri: avatar }} /> */}
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
                {loading && <ActivityIndicator size="small" color={Colors(theme).primary} style={{ paddingHorizontal: 8 }} />}
            </Pressable>
        </Card>
    );
};

export const stylesFn = (theme: Theme) => StyleSheet.create({
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
    cardRead: {
        backgroundColor: Colors(theme).background,
        borderWidth: 0,
        borderColor: Colors(theme).border,
        opacity: 0.6,
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

