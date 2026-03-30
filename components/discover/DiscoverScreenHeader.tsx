import { OpenFilterRightPanel, useDiscovery } from "@/components/discover/discovery-context";
import { Text } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { OpenDrawerSubject } from "@/shared-uis/components/CustomDrawer";
import Colors from "@/shared-uis/constants/Colors";
import { CoachmarkAnchor } from "@edwardloopez/react-native-coachmark";
import {
    faChevronDown,
    faFilter,
    faSort,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Menu } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SORT_OPTIONS = [
    { label: "Followers", value: "followers", sublabel: "High to Low" },
    { label: "Engagements", value: "engagement", sublabel: "High to Low" },
    { label: "ER %", value: "engagement_rate", sublabel: "High to Low" },
    { label: "Views", value: "views", sublabel: "High to Low" },
];

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean, topInset: number) =>
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
            paddingTop: 12 + topInset,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
        },
        mobileTitleRow: {
            flexDirection: "row",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
            minWidth: 0,
        },
        mobileIconButton: {
            padding: 8,
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
    });

const DiscoverScreenHeader: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const insets = useSafeAreaInsets();
    const { selectedBrand, updateBrand } = useBrandContext();
    const {
        totalCount,
        currentSort,
        setCurrentSort,
        pageSortCommunication,
        setRightPanel,
    } = useDiscovery();

    const [sortMenuVisible, setSortMenuVisible] = useState(false);
    const styles = useMemo(() => useStyles(colors, xl, insets.top), [colors, xl, insets.top]);

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
        if (selectedBrand?.id) {
            updateBrand(selectedBrand.id, {
                discoverPreferences: {
                    ...selectedBrand.discoverPreferences,
                    sort: value,
                },
            });
        }
    };

    const sortComponent = xl ? (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
    ) : (
        <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
                <Pressable
                    onPress={() => setSortMenuVisible(true)}
                    style={styles.mobileIconButton}
                >
                    <FontAwesomeIcon
                        color={colors.text}
                        icon={faSort}
                        size={18}
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
    );

    const filterButton = xl ? (
        <CoachmarkAnchor id="guide-tour-filter" shape="rect">
            <Pressable onPress={() => OpenFilterRightPanel.next()} style={styles.filterButton}>
                <FontAwesomeIcon color={colors.onPrimary} icon={faFilter} size={16} />
                <Text style={styles.filterButtonText}>Filters</Text>
            </Pressable>
        </CoachmarkAnchor>
    ) : (
        <CoachmarkAnchor id="guide-tour-filter" shape="rect">
            <Pressable
                onPress={() => OpenFilterRightPanel.next()}
                style={styles.mobileIconButton}
            >
                <FontAwesomeIcon color={colors.text} icon={faFilter} size={18} />
            </Pressable>
        </CoachmarkAnchor>
    );

    if (!xl) {
        return (
            <PageHeader
                title="Discover Influencer"
                showBackButton={false}
                customMainContent={<View style={styles.mobileTitleRow}>
                    <CoachmarkAnchor id="guide-tour-header" shape="rect">
                        <Pressable
                            onPress={() => OpenDrawerSubject.next(true)}
                            style={{ flex: 1, minWidth: 0 }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <Text style={styles.mobileTitle}>Discover Influencer</Text>
                                <FontAwesomeIcon
                                    color={colors.text}
                                    icon={faChevronDown}
                                    size={16}
                                    style={{
                                        marginLeft: 6,
                                        marginBottom: -2,
                                    }}
                                />
                            </View>
                            <Text style={styles.mobileSubtitle}>
                                {`Total ${String(totalCount ?? "0").trim()}+ found`}
                            </Text>
                        </Pressable>
                    </CoachmarkAnchor>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        {filterButton}
                        {sortComponent}
                    </View>
                </View>}
            // actionButtons={[filterButton]}
            // rightComponent={sortComponent}
            />
        );
    }

    return (
        <PageHeader
            title="Discover Influencer"
            subtitle={`Total ${String(totalCount ?? "0").trim()}+ found`}
            actionButtons={[filterButton]}
            rightComponent={sortComponent}
        />
    );
};

export default DiscoverScreenHeader;
