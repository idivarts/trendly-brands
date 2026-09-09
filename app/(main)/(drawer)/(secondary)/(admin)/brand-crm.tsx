import BrandCRMBoard from "@/components/kanban/BrandCRMBoard";
import PageHeader from "@/components/ui/page-header";
import { useAuthContext } from "@/contexts/auth-context.provider";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const BrandCRM = () => {
    const { manager } = useAuthContext();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    // The board reads every brand's usage across all tenants, so it is gated the
    // same way as Escalations. The backend enforces this too (the endpoints
    // check Manager.IsAdmin) — this only avoids rendering a screen that would
    // fail every request.
    if (!manager?.isAdmin) {
        return (
            <AppLayout>
                <PageHeader title="Brands CRM" />
                <View style={styles.center}>
                    <Text style={styles.restrictedText}>
                        Access restricted to admin managers only.
                    </Text>
                </View>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <PageHeader title="Brands CRM" />
            <BrandCRMBoard />
        </AppLayout>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        center: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
        },
        restrictedText: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: "center",
        },
    });

export default BrandCRM;
