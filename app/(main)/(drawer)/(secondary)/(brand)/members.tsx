import MembersTab from "@/components/access/MembersTab";
import TeamsTab from "@/components/access/TeamsTab";
import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

type AccessTab = "members" | "teams";

const AccessScreen = () => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { selectedBrand, hasCapability } = useBrandContext();
    const canManageMembers = hasCapability("manage_members");

    const [activeTab, setActiveTab] = useState<AccessTab>("members");
    const [showMemberModal, setShowMemberModal] = useState(false);

    const tabs: { id: AccessTab; label: string }[] = [
        { id: "members", label: "Members" },
        { id: "teams", label: "Teams" },
    ];

    return (
        <AppLayout withWebPadding={false}>
            <PageHeader
                title="User Management"
                subtitle={selectedBrand?.name}
                actionButtons={
                    activeTab === "members" && canManageMembers
                        ? [
                            <Button key="add-member" onPress={() => setShowMemberModal(true)}>
                                Add Member
                            </Button>,
                        ]
                        : []
                }
            />
            <AppLayout safeAreaEdges={["bottom", "left", "right"]}>
                <View style={styles.segmentWrap}>
                    <View style={styles.segment}>
                        {tabs.map((tab) => {
                            const active = tab.id === activeTab;
                            return (
                                <Pressable
                                    key={tab.id}
                                    onPress={() => setActiveTab(tab.id)}
                                    style={[styles.segmentItem, active ? styles.segmentItemActive : undefined]}
                                >
                                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                                        {tab.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {activeTab === "members" ? (
                    <MembersTab
                        showInviteModal={showMemberModal}
                        onCloseInvite={() => setShowMemberModal(false)}
                    />
                ) : (
                    <TeamsTab />
                )}
            </AppLayout>
        </AppLayout>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        segmentWrap: {
            alignItems: "center",
            paddingHorizontal: 12,
            paddingTop: 12,
        },
        segment: {
            flexDirection: "row",
            backgroundColor: colors.tag,
            borderRadius: 12,
            padding: 4,
            gap: 4,
        },
        segmentItem: {
            paddingVertical: 8,
            paddingHorizontal: 24,
            borderRadius: 9,
        },
        segmentItemActive: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        segmentText: {
            fontSize: 14,
            fontWeight: "600",
        },
        segmentTextActive: {
            color: colors.onPrimary,
        },
    });
}

export default AccessScreen;
