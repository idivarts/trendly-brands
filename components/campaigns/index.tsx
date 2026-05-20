import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import TopTabNavigation from "@/components/ui/top-tab-navigation";
import { CollapseProvider } from "@/contexts/CollapseContext";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { Href, router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import CampaignsList from "./CampaignsList";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";

const tabs = (xl: boolean) => [
    ...(xl
        ? [
              {
                  id: "create",
                  title: "New Campaign ➕",
                  href: "/create-campaign" as Href,
              },
              { id: "d1", title: "---", href: "/" as Href },
          ]
        : []),
    {
        id: "active",
        title: "Active",
        component: <CampaignsList key="active" active={true} />,
    },
    {
        id: "past",
        title: "Past",
        component: <CampaignsList key="past" active={false} />,
    },
];

const Campaigns: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const { selectedBrand } = useBrandContext();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const newCampaignButton = xl ? (
        <Pressable
            onPress={() => router.push("/create-campaign")}
            style={({ pressed }) => [styles.newBtn, pressed && styles.newBtnPressed]}
        >
            <FontAwesomeIcon icon={faPlus} size={14} color={colors.white} />
            <Text style={styles.newBtnText}>New Campaign</Text>
        </Pressable>
    ) : null;

    return (
        <AppLayout safeAreaEdges={["left", "right"]}>
            <PageHeader
                title="Campaigns"
                subtitle={selectedBrand?.name}
                showBackButton={false}
                rightComponent={newCampaignButton}
                mobileActions="all"
            />
            <View style={styles.container}>
                <CollapseProvider>
                    <TopTabNavigation
                        tabs={tabs(xl)}
                        splitTwoColumns
                        defaultSelection={xl ? 2 : 0}
                    />
                </CollapseProvider>
            </View>
        </AppLayout>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            paddingVertical: 16,
            backgroundColor: "transparent",
        },
        newBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.primary,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
        },
        newBtnPressed: { opacity: 0.85 },
        newBtnText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.white,
        },
    });

export default Campaigns;
