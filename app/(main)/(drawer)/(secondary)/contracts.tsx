import ActiveContracts from "@/components/contracts/active";
import PastContracts from "@/components/contracts/past";
import { View } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import TopTabNavigation from "@/components/ui/top-tab-navigation";
import AppLayout from "@/layouts/app-layout";
import React from "react";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    flex1: { flex: 1 },
});

const tabs = [
    {
        id: "Active",
        title: "Active",
        component: <ActiveContracts />,
    },
    {
        id: "Past",
        title: "Past",
        component: <PastContracts />,
    },
];

const Contracts = () => {
    return (
        <AppLayout>
            <ScreenHeader title="Contracts" />
            <View style={styles.flex1}>
                <TopTabNavigation tabs={tabs} />
            </View>
        </AppLayout>
    );
};

export default Contracts;
