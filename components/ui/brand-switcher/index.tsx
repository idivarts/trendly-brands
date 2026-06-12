import { useBrandContext } from "@/contexts/brand-context.provider";
import { useOrganizationContext } from "@/contexts/organization-context.provider";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Menu } from "react-native-paper";
import { Subject } from "rxjs";

export const OpenBrandSwitcher = new Subject();

type Group = { key: string; name: string; brands: Brand[] };

const BrandSwitcher = () => {
    const [visible, setVisible] = useState(false);
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    // Use allBrands (incl. drafts) so the switcher matches the Organizations page.
    const { allBrands: brands, selectedBrand, setSelectedBrand } = useBrandContext();
    const { organizations } = useOrganizationContext();

    const openMenu = () => setVisible(true);

    const handleBrandChange = (brand: Brand) => {
        setSelectedBrand(brand);
        setVisible(false);
    };

    useEffect(() => {
        const subs = OpenBrandSwitcher.subscribe(() => {
            setVisible(true);
        });
        return () => {
            subs.unsubscribe();
        };
    }, []);

    // Group brands by their organization for the grouped switcher. Brands with no
    // org (legacy, not yet migrated) fall under an "Other" group.
    const groups = useMemo<Group[]>(() => {
        const byOrg = new Map<string, Group>();
        const other: Brand[] = [];
        for (const b of brands) {
            const oid = b.organizationId;
            if (oid) {
                if (!byOrg.has(oid)) {
                    const org = organizations.find((o) => o.id === oid);
                    byOrg.set(oid, { key: oid, name: org?.name || "Organization", brands: [] });
                }
                byOrg.get(oid)!.brands.push(b);
            } else {
                other.push(b);
            }
        }
        const result = Array.from(byOrg.values());
        if (other.length) result.push({ key: "__other__", name: "Other", brands: other });
        return result;
    }, [brands, organizations]);

    const showHeaders = groups.length > 1;

    const renderItem = (brand: Brand) => {
        const isSelected = brand.id === selectedBrand?.id;
        return (
            <Menu.Item
                key={brand.id}
                style={[styles.item, isSelected && styles.itemSelected]}
                titleStyle={[styles.itemText, isSelected && styles.itemTextSelected]}
                onPress={() => handleBrandChange(brand)}
                title={brand.name?.trim() || "Untitled brand"}
            />
        );
    };

    return (
        <Menu
            visible={visible}
            anchorPosition="top"
            onDismiss={() => setVisible(false)}
            contentStyle={styles.menuContent}
            anchor={
                <Pressable onPress={openMenu} style={styles.anchor} hitSlop={10}>
                    <FontAwesomeIcon color={colors.text} icon={faChevronDown} size={16} />
                </Pressable>
            }
        >
            {groups.map((group) => (
                <View key={group.key}>
                    {showHeaders && <Text style={styles.groupHeader}>{group.name.toUpperCase()}</Text>}
                    {group.brands.map(renderItem)}
                </View>
            ))}
        </Menu>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        anchor: {
            minWidth: 32,
            minHeight: 32,
            marginLeft: 14,
            alignItems: "center",
            justifyContent: "center",
        },
        menuContent: {
            paddingVertical: 0,
            borderRadius: 4,
            overflow: "hidden",
        },
        groupHeader: {
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 4,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 0.6,
            color: colors.textSecondary,
        },
        item: {
            backgroundColor: colors.background,
            margin: 0,
        },
        itemSelected: {
            backgroundColor: colors.primary,
        },
        itemText: {
            color: colors.text,
            fontSize: 16,
        },
        itemTextSelected: {
            color: colors.white,
        },
    });

export default BrandSwitcher;
