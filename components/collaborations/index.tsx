import CollaborationList from "@/components/collaborations/Collaborations";
import { View } from "@/components/theme/Themed";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { Href } from "expo-router";
import PageHeader from "../ui/page-header";
import TopTabNavigation from "../ui/top-tab-navigation";

const tabs = (xl: boolean) => [
    ...(xl ? [
        {
            id: "create",
            title: "Create New ➕",
            href: "/create-collaboration" as Href
        }, {
            id: "d1",
            title: "---",
            href: "/" as Href
        }
    ] : []),
    {
        id: "Active",
        title: "Active",
        component: <CollaborationList key={"active"} active={true} />,
    },
    {
        id: "Past",
        title: "Past",
        component: <CollaborationList key={"inactive"} active={false} />,
    },

];

const Collaborations = () => {
    const { xl } = useBreakpoints();
    const { selectedBrand } = useBrandContext();
    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            paddingVertical: 16,
        },
    }), []);
    return (
        <AppLayout safeAreaEdges={["left", "right"]}>
            <PageHeader
                title="Campaigns"
                subtitle={selectedBrand?.name}
                showBackButton={false}
            />
            <View style={styles.container}>
                <TopTabNavigation
                    tabs={tabs(xl)}
                    splitTwoColumns={true}
                    defaultSelection={xl ? 2 : 0}
                />
            </View>
        </AppLayout>
    );
};

export default Collaborations;
