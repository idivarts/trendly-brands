import { useColorScheme } from "@/components/theme/useColorScheme";
import { Text } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { useAuthContext, useChatContext, useThemeOverride } from "@/contexts";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import SelectGroup from "@/shared-uis/components/select/select-group";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import {
    faBell,
    faChevronRight,
    faCircleInfo,
    faHeadset,
    faMoon,
    faShieldHalved,
    faSignOut,
    faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Theme, useTheme } from "@react-navigation/native";
import Constants from "expo-constants";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import PageHeader from "../ui/page-header";

type ThemeMode = "light" | "dark";

const WEBSITE_URL = "https://www.trendly.now";
const PRIVACY_URL = `${WEBSITE_URL}/privacy`;
const TERMS_URL = `${WEBSITE_URL}/terms`;
const CONTACT_URL = `${WEBSITE_URL}/contact`;

const Settings = () => {
    const { manager, updateManager, signOutManager } = useAuthContext();
    const { deregisterTokens } = useChatContext();
    const { setThemeOverride } = useThemeOverride();
    const { openModal } = useConfirmationModel();
    const router = useMyNavigation();
    const colorScheme = useColorScheme();
    const theme = useTheme();
    const colors = Colors(theme);
    const { width } = useBreakpoints();
    const styles = useStyles(colors, width);

    const persistedTheme = (manager?.settings?.theme ?? colorScheme) as ThemeMode;
    const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(persistedTheme);

    // Auto-save: changing the toggle previews instantly and persists immediately —
    // no separate Save button (the old disconnected Save was a UX dead end).
    const persistTheme = async (next: ThemeMode) => {
        if (!manager || next === selectedTheme) {
            return;
        }
        setSelectedTheme(next);
        setThemeOverride(next);
        try {
            await updateManager(manager.id, {
                settings: { ...manager.settings, theme: next },
            });
            setThemeOverride(null); // persisted value now drives the theme
        } catch {
            setSelectedTheme(persistedTheme);
            setThemeOverride(null);
            Toaster.error("Couldn't save theme", "Please try again.");
        }
    };

    const handleSignOut = async () => {
        await deregisterTokens?.();
        await signOutManager();
    };

    const confirmSignOut = () => {
        openModal({
            title: "Log out",
            description: "Are you sure you want to log out?",
            confirmAction: handleSignOut,
            confirmText: "Log out",
        });
    };

    // Permanently deletes the brand/manager account. The backend blocks this
    // (block-&-instruct) while the user still solely owns a brand/org or a paid
    // subscription — we surface that reason verbatim.
    const handleDeleteAccount = async () => {
        try {
            await HttpWrapper.fetch("/api/v2/managers/delete", { method: "DELETE" });
            Toaster.success("Account deleted", "Your account has been permanently removed.");
            await signOutManager();
            router.resetAndNavigate("/pre-signin");
        } catch (error) {
            const message = await HttpWrapper.extractErrorMessage(error);
            Toaster.error("Couldn't delete account", message || "Please try again later.");
        }
    };

    const confirmDeleteAccount = () => {
        openModal({
            title: "Delete account",
            description:
                "This permanently deletes your account and removes you from every brand and organization. This action cannot be undone.",
            confirmAction: handleDeleteAccount,
            confirmText: "Delete",
        });
    };

    const appVersion = Constants.expoConfig?.version ?? "";

    return (
        <>
            <PageHeader title="Settings" subtitle="Manage your preferences and account" />
            <AppLayout safeAreaEdges={["bottom", "left", "right"]}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.content}>
                        {/* ── Preferences ─────────────────────────────────────── */}
                        <Text style={styles.sectionLabel}>PREFERENCES</Text>
                        <View style={styles.card}>
                            <View style={styles.themeBlock}>
                                <View style={styles.rowLead}>
                                    <View style={styles.iconBadge}>
                                        <FontAwesomeIcon icon={faMoon} size={16} color={colors.primary} />
                                    </View>
                                    <View style={styles.rowText}>
                                        <Text style={styles.rowTitle}>Appearance</Text>
                                        <Text style={styles.rowSubtitle}>Choose a light or dark theme</Text>
                                    </View>
                                </View>
                                <View style={styles.themeSelect}>
                                    <SelectGroup
                                        items={[
                                            { label: "Light", value: "light" },
                                            { label: "Dark", value: "dark" },
                                        ]}
                                        selectedItem={{
                                            label: selectedTheme === "light" ? "Light" : "Dark",
                                            value: selectedTheme,
                                        }}
                                        onValueChange={(item) => persistTheme(item.value as ThemeMode)}
                                        theme={theme}
                                    />
                                </View>
                            </View>
                            <Row
                                colors={colors}
                                styles={styles}
                                icon={faBell}
                                title="Notifications"
                                subtitle="Manage push and email alerts"
                                onPress={() => router.push("/notifications")}
                            />
                        </View>

                        {/* ── Support & about ─────────────────────────────────── */}
                        <Text style={styles.sectionLabel}>SUPPORT & ABOUT</Text>
                        <View style={styles.card}>
                            <Row
                                colors={colors}
                                styles={styles}
                                icon={faHeadset}
                                title="Help & contact"
                                onPress={() => Linking.openURL(CONTACT_URL)}
                            />
                            <Row
                                colors={colors}
                                styles={styles}
                                icon={faShieldHalved}
                                title="Privacy policy"
                                onPress={() => Linking.openURL(PRIVACY_URL)}
                            />
                            <Row
                                colors={colors}
                                styles={styles}
                                icon={faCircleInfo}
                                title="Terms of service"
                                onPress={() => Linking.openURL(TERMS_URL)}
                            />
                            <Row
                                colors={colors}
                                styles={styles}
                                icon={faCircleInfo}
                                title="App version"
                                rightText={appVersion}
                            />
                        </View>

                        {/* ── Account actions ─────────────────────────────────── */}
                        <View style={[styles.card, styles.dangerCard]}>
                            <Row
                                colors={colors}
                                styles={styles}
                                icon={faSignOut}
                                title="Log out"
                                onPress={confirmSignOut}
                            />
                            <Row
                                colors={colors}
                                styles={styles}
                                icon={faTrashCan}
                                title="Delete account"
                                subtitle="Permanently remove your account"
                                destructive
                                onPress={confirmDeleteAccount}
                            />
                        </View>
                    </View>
                </ScrollView>
            </AppLayout>
        </>
    );
};

interface RowProps {
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof useStyles>;
    icon: IconDefinition;
    title: string;
    subtitle?: string;
    rightText?: string;
    destructive?: boolean;
    onPress?: () => void;
}

const Row: React.FC<RowProps> = ({ colors, styles, icon, title, subtitle, rightText, destructive, onPress }) => {
    const tint = destructive ? colors.red : colors.primary;
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel={title}
        >
            <View style={styles.rowLead}>
                <View style={[styles.iconBadge, destructive && styles.iconBadgeDanger]}>
                    <FontAwesomeIcon icon={icon} size={16} color={tint} />
                </View>
                <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, destructive && { color: colors.red }]}>{title}</Text>
                    {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
                </View>
            </View>
            {rightText ? (
                <Text style={styles.rowRightText}>{rightText}</Text>
            ) : onPress ? (
                <FontAwesomeIcon icon={faChevronRight} size={14} color={colors.textSecondary} />
            ) : null}
        </Pressable>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, width: number) =>
    StyleSheet.create({
        scroll: {
            flexGrow: 1,
            padding: 16,
            alignItems: "center",
            backgroundColor: colors.background,
        },
        content: {
            width: "100%",
            maxWidth: 640,
            gap: 8,
        },
        sectionLabel: {
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 0.6,
            color: colors.textSecondary,
            marginTop: 16,
            marginBottom: 4,
            marginLeft: 4,
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 16,
            paddingHorizontal: 8,
            paddingVertical: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        dangerCard: {
            marginTop: 16,
        },
        themeBlock: {
            paddingHorizontal: 6,
            paddingVertical: 12,
            gap: 12,
        },
        themeSelect: {
            paddingLeft: 46,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingHorizontal: 6,
            paddingVertical: 14,
            borderRadius: 12,
        },
        rowPressed: {
            backgroundColor: colors.tag,
        },
        rowLead: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            flex: 1,
        },
        iconBadge: {
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        iconBadgeDanger: {
            backgroundColor: colors.transparent,
        },
        rowText: {
            flex: 1,
        },
        rowTitle: {
            fontSize: 15,
            fontWeight: "500",
            color: colors.text,
        },
        rowSubtitle: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
        },
        rowRightText: {
            fontSize: 14,
            color: colors.textSecondary,
        },
    });

export default Settings;
