import ApplicationsTabContent from "@/components/collaboration/collaboration-details/ApplicationsTabContent";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import Colors from "@/shared-uis/constants/Colors";
import AppLayout from "@/layouts/app-layout";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";

const useStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: Colors(theme).background,
            marginTop: 16,
        },
    });

const ApplicationsScreen = () => {
    const theme = useTheme();
    const styles = useStyles(theme);

    return (
        <AppLayout withWebPadding={false}>
            <PageHeader title="All Applications" />
            <View style={styles.container}>
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
