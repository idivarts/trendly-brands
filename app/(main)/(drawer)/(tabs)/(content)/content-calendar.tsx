import PageHeader from "@/components/ui/page-header";
import { View } from "@/components/theme/Themed";
import AppLayout from "@/layouts/app-layout";
import React from "react";
import { StyleSheet } from "react-native";

const ContentCalendarScreen = () => {
    return (
        <AppLayout>
            <PageHeader title="Content Calendar" showBackButton={false} />
            <View style={styles.flex1} />
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    flex1: { flex: 1 },
});

export default ContentCalendarScreen;
