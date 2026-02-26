import { OpenFilterRightPanel, useDiscovery } from "@/components/discover/discovery-context";
import { View } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { faFilter, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Menu } from "react-native-paper";

const SORT_OPTIONS = [
    { label: "Followers", value: "followers", sublabel: "High to Low" },
    { label: "Engagements", value: "engagement", sublabel: "High to Low" },
    { label: "ER %", value: "engagement_rate", sublabel: "High to Low" },
    { label: "Views", value: "views", sublabel: "High to Low" },
];

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
    StyleSheet.create({
        container: {
            backgroundColor: colors.background,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginHorizontal: 16,
            marginVertical: 8,
        },
        topRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        title: {
            fontSize: 22,
            fontWeight: "600",
            color: colors.text,
        },
        filterButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        filterButtonText: {
            color: colors.onPrimary,
            fontSize: 14,
            fontWeight: "600",
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 12,
        },
        bottomRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        totalWrap: {
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
        },
        totalLabel: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
            marginRight: 4,
        },
        totalCount: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.primary,
            marginRight: 4,
        },
        resultsFound: {
            fontSize: 14,
            color: colors.textSecondary,
            fontWeight: "400",
        },
        sortByLabel: {
            fontSize: 14,
            color: colors.textSecondary,
            marginRight: 8,
        },
        sortChip: {
            backgroundColor: colors.tag,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        sortChipText: {
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
            maxWidth: xl ? 220 : 160,
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

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <Text style={styles.title}>Discover Influencers</Text>
                <Pressable
                    onPress={() => OpenFilterRightPanel.next()}
                    style={styles.filterButton}
                >
                    <FontAwesomeIcon
                        color={colors.onPrimary}
                        icon={faFilter}
                        size={16}
                    />
                    <Text style={styles.filterButtonText}>Filters</Text>
                </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.bottomRow}>
                <View style={styles.totalWrap}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalCount}>{totalCount}</Text>
                    <Text style={styles.resultsFound}>Results found</Text>
                </View>

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
            </View>
        </View>
    );
};

export default DiscoverScreenHeader;
