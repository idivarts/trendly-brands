import Menu from "@/components/menu";
import AppLayout from "@/layouts/app-layout";
import { useBrandContext } from "@/contexts/brand-context.provider";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";
import React from "react";
import { Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import Toaster from "@/shared-uis/components/toaster/Toaster";

const MenuScreen = () => {
    const { selectedBrand } = useBrandContext();

    const copyBrandId = async () => {
        if (!selectedBrand?.id) return;
        try {
            if (Platform.OS === "web" && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(selectedBrand.id);
            } else {
                await Clipboard.setStringAsync(selectedBrand.id);
            }
            Toaster.success("Brand ID copied!", "Share this with customer support if asked for");
        } catch {
            Toaster.error("Failed to copy Brand ID");
        }
    };

    return (
        <AppLayout withWebPadding={true} safeAreaEdges={["left", "right"]}>
            <PageHeader
                title="My Brand"
                subtitle={selectedBrand?.name}
                actionButtons={[
                    <Button key="copy" mode="outlined" onPress={copyBrandId} size="small">
                        Copy Brand ID
                    </Button>,
                ]}
            />
            <Menu />
        </AppLayout>
    );
};

export default MenuScreen;
