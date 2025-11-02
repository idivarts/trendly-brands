import ApplicationsTabContent from "@/components/collaboration/collaboration-details/ApplicationsTabContent";
import { View } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import Colors from "@/constants/Colors";
import AppLayout from "@/layouts/app-layout";
import { useTheme } from "@react-navigation/native";
import React from "react";

const ApplicationsScreen = () => {
    const theme = useTheme();

    return (
        <AppLayout withWebPadding={false}>
            <ScreenHeader
                title="All Applications Jerry"
            />
            <View style={{
                flex: 1,
                backgroundColor: Colors(theme).background,
                marginTop: 16,
            }}>
                <ApplicationsTabContent
                    isApplicationConcised={true}
                    pageID={""}
                    collaboration={{
                        id: "",
                        name: "",
                        questionsToInfluencers: [],
                    }}
                />
            </View>
        </AppLayout>
    );
};

export default ApplicationsScreen;
