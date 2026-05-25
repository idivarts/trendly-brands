import AddContentModal from "@/components/content-calendar/AddContentModal";
import { CalendarItem } from "@/components/content-calendar/types";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import CollaborationsV2 from "./Collaborations";

const Collaborations = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const { selectedBrand } = useBrandContext();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const [showAddModal, setShowAddModal] = useState(false);

    const handleAddContent = (item: Omit<CalendarItem, "id">) => {
        const newId = `content-${Date.now()}`;
        router.push({
            pathname: "/(main)/(drawer)/(secondary)/create-content" as any,
            params: { contentId: newId, title: item.title, idea: item.idea, type: item.type, date: item.date },
        });
    };

    const createButton = (
        <Pressable
            key="create"
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            onPress={() => setShowAddModal(true)}
        >
            <FontAwesomeIcon icon={faPlus} size={14} color={colors.onPrimary} />
            <Text style={styles.addBtnText}>Create Collaboration</Text>
        </Pressable>
    );

    return (
        <AppLayout safeAreaEdges={["left", "right"]}>
            <AddContentModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddContent}
            />
            <PageHeader
                title="Campaigns"
                subtitle={selectedBrand?.name}
                showBackButton={false}
                actionButtons={[createButton]}
                mobileActions="all"
            />
            <View style={styles.container}>
                <CollaborationsV2 />
            </View>
        </AppLayout>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    const maxWidth = xl ? 860 : undefined;
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    paddingTop: 16,
                    paddingBottom: 40,
                    ...(maxWidth ? { maxWidth, alignSelf: "center" as const, width: "100%" } : {}),
                },
                addBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                addBtnPressed: {
                    opacity: 0.75,
                },
                addBtnText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.onPrimary,
                },
            }),
        [colors, xl]
    );
}

export default Collaborations;
