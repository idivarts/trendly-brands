import Menu from "@/components/menu";
import { Text } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import { OpenDrawerSubject } from "@/shared-uis/components/CustomDrawer";
import ImageComponent from "@/shared-uis/components/image-component";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

const MenuScreen = () => {
    const router = useRouter();
    const { selectedBrand, brands } = useBrandContext();
    const { manager } = useAuthContext();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

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
            style={styles.profileButton}
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

    const brandTitleContent = (
        <Pressable onPress={() => OpenDrawerSubject.next(true)} style={styles.brandTitleRow}>
            <Text style={styles.brandTitle}>{selectedBrand?.name ?? "My Brand"}</Text>
            {brands.length > 1 && (
                <FontAwesomeIcon
                    color={colors.text}
                    icon={faChevronDown}
                    size={14}
                    style={styles.chevronIcon}
                />)}
        </Pressable>
    );

    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["left", "right"]}>
            <PageHeader
                title="My Brand"
                showBackButton={false}
                mobileActions="all"
                customMainContent={brandTitleContent}
                actionButtons={[
                    <Button key="copy" mode="outlined" onPress={copyBrandId} size="small">
                        Copy ID
                    </Button>,
                ]}
                rightComponent={profileButton}
            />
            <AppLayout withWebPadding={true}>
                <Menu key={selectedBrand?.id} />
            </AppLayout>
        </AppLayout>
    );
};

export default MenuScreen;

const makeStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        brandTitleRow: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
        },
        brandTitle: {
            fontSize: 22,
            fontWeight: "700",
            color: colors.text,
        },
        chevronIcon: {
            marginLeft: 6,
        },
        profileButton: {
            padding: 8,
        },
    });
