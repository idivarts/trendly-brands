import { OpenFilterRightPanel, useDiscovery } from "@/components/discover/discovery-context";
import { OpenDrawerSubject } from "@/shared-uis/components/CustomDrawer";
import { Text } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { faChevronDown, faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Menu } from "react-native-paper";

const SORT_OPTIONS = [
    { label: "Followers", value: "followers", sublabel: "High to Low" },
    { label: "Engagements", value: "engagement", sublabel: "High to Low" },
    { label: "ER %", value: "engagement_rate", sublabel: "High to Low" },
    { label: "Views", value: "views", sublabel: "High to Low" },
];

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
    StyleSheet.create({
        sortByLabel: {
            fontSize: xl ? 14 : 12,
            color: colors.textSecondary,
            marginRight: xl ? 8 : 4,
        },
        sortChip: {
            backgroundColor: colors.tag,
            paddingHorizontal: xl ? 12 : 8,
            paddingVertical: xl ? 8 : 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            flex: xl ? undefined : 1,
            minWidth: 0,
        },
        sortChipText: {
            fontSize: xl ? 14 : 12,
            fontWeight: "500",
            color: colors.text,
            maxWidth: xl ? 220 : 100,
        },
        filterButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: xl ? 16 : 10,
            paddingVertical: xl ? 10 : 6,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: xl ? 8 : 4,
        },
        filterButtonText: {
            color: colors.onPrimary,
            fontSize: xl ? 14 : 12,
            fontWeight: "600",
        },
        mobileStackedContainer: {
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
        },
        mobileTitleRow: {
            marginBottom: 12,
        },
        mobileTitle: {
            fontSize: 22,
            fontWeight: "700",
            color: colors.text,
        },
        mobileSubtitle: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
            marginTop: 2,
            letterSpacing: 1,
        },
        mobileActionsRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        mobileFilterButton: {
            flexShrink: 0,
        },
        mobileSortWrap: {
            flex: 1,
            minWidth: 0,
            flexDirection: "row",
            alignItems: "center",
        },
    });

const DiscoverScreenHeader: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const {
        totalCount,
        currentSort,
        setCurrentSort,
        pageSortCommunication,
        setRightPanel,
    } = useDiscovery();

    const [sortMenuVisible, setSortMenuVisible] = useState(false);
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const currentOption = SORT_OPTIONS.find((o) => o.value === currentSort);
    const sortDisplayLabel = currentOption
        ? `${currentOption.label} (${currentOption.sublabel})`
        : "Followers (High to Low)";

    const onSelectSort = (value: string) => {
        setCurrentSort(value);
        setSortMenuVisible(false);
        if (!xl) setRightPanel(false);
        pageSortCommunication.current?.({
            page: 1,
            sort: value,
        });
    };

    const sortComponent = (
        <View style={[!xl && styles.mobileSortWrap, { flexDirection: "row", alignItems: "center" }]}>
            <Text style={styles.sortByLabel}>Sort by:</Text>
            <Menu
                visible={sortMenuVisible}
                onDismiss={() => setSortMenuVisible(false)}
                anchor={
                    <Pressable
                        onPress={() => setSortMenuVisible(true)}
                        style={styles.sortChip}
                    >
                        <Text
                            numberOfLines={1}
                            style={styles.sortChipText}
                        >
                            {sortDisplayLabel}
                        </Text>
                        <FontAwesomeIcon
                            color={colors.text}
                            icon={faChevronDown}
                            size={12}
                        />
                    </Pressable>
                }
                contentStyle={{ backgroundColor: colors.background }}
            >
                {SORT_OPTIONS.map((opt) => (
                    <Menu.Item
                        key={opt.value}
                        onPress={() => onSelectSort(opt.value)}
                        title={`${opt.label} (${opt.sublabel})`}
                    />
                ))}
            </Menu>
        </View>
    );

    const filterButton = (
        <Pressable
            onPress={() => OpenFilterRightPanel.next()}
            style={[styles.filterButton, !xl && styles.mobileFilterButton]}
        >
            <FontAwesomeIcon
                color={colors.onPrimary}
                icon={faFilter}
                size={xl ? 16 : 14}
            />
            <Text style={styles.filterButtonText}>Filters</Text>
        </Pressable>
    );

    if (!xl) {
        return (
            <View style={styles.mobileStackedContainer}>
                <Pressable
                    style={styles.mobileTitleRow}
                    onPress={() => OpenDrawerSubject.next(true)}
                >
                    <Text style={styles.mobileTitle}>Discover Influencer</Text>
                    <Text style={styles.mobileSubtitle}>
                        Total {totalCount}+ found
                    </Text>
                </Pressable>
                <View style={styles.mobileActionsRow}>
                    {filterButton}
                    <View style={styles.mobileSortWrap}>
                        {sortComponent}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <PageHeader
            title="Discover Influencer"
            subtitle={`Total ${totalCount}+ found`}
            actionButtons={[filterButton]}
            rightComponent={sortComponent}
        />
    );
};

export default DiscoverScreenHeader;
