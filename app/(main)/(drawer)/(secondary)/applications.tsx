import ApplicationsTabContent from "@/components/collaboration/collaboration-details/ApplicationsTabContent";
import { View } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import Colors from "@/constants/Colors";
import {
    useAuthContext,
    useNotificationContext
} from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import { useTheme } from "@react-navigation/native";
import React from "react";

const ApplicationsScreen = () => {
    const theme = useTheme();

    const {
        manager,
    } = useAuthContext();
    const {
        markAllNotificationsAsRead,
        managerNotifications,
        updateManagerNotification,
    } = useNotificationContext();

    const onMarkAsRead = (notificationId: string) => {
        updateManagerNotification(
            manager?.id as string,
            notificationId,
            {
                isRead: true,
            },
        );
    };

    return (
        <AppLayout withWebPadding={false}>
            <ScreenHeader
                title="All Applications"
            />
            <View style={{
                flex: 1,
                backgroundColor: Colors(theme).background,
                marginTop: 16,
            }}>
                <ApplicationsTabContent
                    isApplicationConcised={true}
                    pageID={"6M5M35RrgaDstPwz7I3G"}
                    collaboration={{
                        id: "6M5M35RrgaDstPwz7I3G",
                        name: "Collaboration Name",
                        questionsToInfluencers: [],
                    }}
                />
            </View>
        </AppLayout>
    );
};

export default ApplicationsScreen;
