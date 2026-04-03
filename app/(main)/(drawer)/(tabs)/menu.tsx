import Menu from "@/components/menu";
import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import ImageComponent from "@/shared-uis/components/image-component";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable } from "react-native";

const MenuScreen = () => {
    const router = useRouter();
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

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

    const profileButton = (
        <Pressable
            onPress={() => router.push("/profile")}
            style={{ padding: 8 }}
            accessibilityLabel="Open profile"
        >
            <ImageComponent
                url={manager?.profileImage || ""}
                initials={manager?.name}
                shape="circle"
                size="small"
                altText="Profile"
                style={{ width: 32, height: 32 }}
            />
        </Pressable>
    );

    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["left", "right"]}>
            <PageHeader
                title="My Brand"
                subtitle={selectedBrand?.name}
                showBackButton={false}
                mobileActions="all"
                actionButtons={[
                    <Button key="copy" mode="outlined" onPress={copyBrandId} size="small">
                        Copy Brand ID
                    </Button>,
                ]}
                rightComponent={profileButton}
            />
            <AppLayout withWebPadding={true}>
                <Menu />
            </AppLayout>
        </AppLayout>
    );
};

export default MenuScreen;
