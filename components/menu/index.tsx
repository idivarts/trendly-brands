import CreditDisplayCard from "@/components/drawer-layout/CreditDisplayCard";
import { useAuthContext, useLocationContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { truncateText } from "@/utils/text";
import { imageUrl } from "@/utils/url";
import {
    faAddressCard,
    faArrowTrendUp,
    faBullseye,
    faChartLine,
    faComment,
    faCreditCard,
    faDiagramProject,
    faEye,
    faFileLines,
    faGears,
    faGem,
    faShareNodes,
    faStar,
    faTriangleExclamation,
    faUsers,
    faUserShield
} from "@fortawesome/free-solid-svg-icons";
import { useTheme, type Theme } from "@react-navigation/native";
import { Href, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Image, Platform, ScrollView, StyleSheet } from "react-native";
import ProfileItemCard from "../ProfileItemCard";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";

interface MenuItem {
    id: string;
    icon: any;
    title: string;
    href: Href;
}

interface MenuSection {
    title: string;
    items: MenuItem[];
}

/**
 * Mobile "My Brand" menu. The bottom tab bar can hold at most five tabs, so
 * every page that lives on the web sidebar (DrawerMenuContentWeb) is surfaced
 * here instead — mirroring its sections and the same visibility conditionals
 * (India-based campaigns, chat-connected execution, admin portal).
 */
const Menu = () => {
    const theme = useTheme();
    const styles = useMemo(() => useMenuItemStyles(theme), [theme]);
    const router = useRouter();
    const { xl } = useBreakpoints();
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();
    const { isIndiaBased } = useLocationContext();

    const sections = useMemo<MenuSection[]>(() => {

        // India-based brands get a dedicated Campaign section.
        const campaign: MenuItem[] = isIndiaBased
            ? [
                { id: "discover", icon: faGem, title: "Discover Influencers", href: "/discover" },
                { id: "collaborations", icon: faStar, title: "Collaboration Requests", href: "/collaborations" },
            ]
            : [];

        // Execution surfaces only once chat is connected.
        const manage: MenuItem[] = manager?.isChatConnected
            ? [
                { id: "messages", icon: faComment, title: "Messages", href: "/messages" },
                { id: "contracts", icon: faFileLines, title: "Influencer Contracts", href: "/contracts" },
                { id: "analytics", icon: faChartLine, title: "Reporting & Analytics", href: "/analytics" },
            ]
            : [];

        const brand: MenuItem[] = [
            { id: "brand-profile", icon: faAddressCard, title: "Brand Profile", href: "/brand-profile" },
            { id: "connected-accounts", icon: faShareNodes, title: "Connected Accounts", href: "/connected-accounts" },
            { id: "members", icon: faUsers, title: "Members", href: "/members" },
            // Billing is web-only; native uses the Settings screen instead.
            ...(Platform.OS === "web"
                ? [{ id: "billing", icon: faCreditCard, title: "Billing", href: "/billing" as Href }]
                : [{ id: "settings", icon: faGears, title: "Settings", href: "/settings" as Href }]),
        ];

        const growth: MenuItem[] = [
            { id: "organic-growth", icon: faArrowTrendUp, title: "Organic Conversions", href: "/organic-growth" },
            { id: "paid-growth", icon: faBullseye, title: "Paid Mediums", href: "/paid-growth" },
            { id: "performance-marketing", icon: faChartLine, title: "Performance Marketing", href: "/performance-marketing" },
        ];

        // Admin portal only for admins.
        const admin: MenuItem[] = manager?.isAdmin
            ? [
                { id: "admin-invites", icon: faUserShield, title: "Invites Management", href: "/admin-invites" },
                { id: "brand-crm", icon: faAddressCard, title: "Brands CRM", href: "/brand-crm" },
                { id: "collaboration-cms", icon: faDiagramProject, title: "Collaboration CMS", href: "/collaboration-cms" },
                { id: "applications", icon: faEye, title: "All Applications", href: "/applications" },
                { id: "admin-escalations", icon: faTriangleExclamation, title: "Escalations", href: "/admin-escalations" },
            ]
            : [];

        return [
            { title: "Campaign", items: campaign },
            { title: "Manage", items: manage },
            { title: "Brand", items: brand },
            { title: "Growth", items: growth },
            { title: "Admin Portal", items: admin },
        ].filter((s) => s.items.length > 0);
    }, [isIndiaBased, manager?.isChatConnected, manager?.isAdmin]);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.topRow}>
                <Image
                    source={imageUrl(selectedBrand?.image)}
                    style={styles.avatarBrandImage}
                />
                <Text style={styles.brandName}>{selectedBrand?.name}</Text>
                {selectedBrand?.profile?.about && (
                    <Text style={styles.brandAbout}>
                        {truncateText(selectedBrand?.profile?.about, 120)}
                    </Text>
                )}
                <Button
                    mode="contained"
                    style={styles.menuButton}
                    onPress={() => {
                        router.push("/brand-profile");
                    }}
                >
                    Edit Brand
                </Button>
            </View>

            {!xl && selectedBrand && !selectedBrand.isBillingDisabled && (
                <CreditDisplayCard />
            )}

            {sections.map((section) => (
                <View key={section.title} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <View style={styles.sectionItems}>
                        {section.items.map((item) => (
                            <ProfileItemCard
                                key={item.id}
                                item={item}
                                onPress={() => {
                                    // @ts-ignore — Href union is wider than the typed routes
                                    router.push(item.href);
                                }}
                            />
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

function useMenuItemStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
        },
        scrollContent: {
            paddingHorizontal: 20,
            paddingVertical: 10,
            gap: 20,
        },
        brandName: {
            fontSize: 24,
            textAlign: "center",
            color: Colors(theme).text,
        },
        brandAbout: {
            fontSize: 16,
            textAlign: "center",
            color: Colors(theme).gray100,
        },
        topRow: {
            gap: 16,
            alignItems: "center",
            paddingTop: 20,
        },
        avatarBrandImage: {
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors(theme).primary,
            width: 160,
            height: 160,
            borderRadius: 20,
        },
        menuButton: {
            backgroundColor: Colors(theme).primary,
        },
        section: {
            gap: 4,
        },
        sectionTitle: {
            fontSize: 12,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: Colors(theme).textSecondary,
            paddingHorizontal: 4,
            paddingBottom: 2,
        },
        sectionItems: {
            gap: 0,
        },
    });
}

export default Menu;
