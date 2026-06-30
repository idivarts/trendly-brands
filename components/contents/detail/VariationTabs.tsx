/**
 * VariationTabs — the tab bar at the top of the content editor.
 *
 * "Generic" is always first (the shared base content), followed by one tab per
 * existing platform variation, then a "+" tab that opens the create-variation
 * modal. Selecting a tab switches what the editor below is editing.
 */
import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import { Platform } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import Colors from "@/shared-uis/constants/Colors";
import { faLayerGroup, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

/** "generic" or a platform key. */
export type VariationTab = "generic" | Platform;

interface Props {
    active: VariationTab;
    /** Platforms that already have a variation (in display order). */
    variationPlatforms: Platform[];
    onSelect: (tab: VariationTab) => void;
    onAddPress: () => void;
    /** Hide the "+" tab (e.g. nothing left to add, or locked content). */
    canAdd?: boolean;
}

const VariationTabs: React.FC<Props> = ({ active, variationPlatforms, onSelect, onAddPress, canAdd = true }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
        >
            <Pressable
                onPress={() => onSelect("generic")}
                style={({ pressed }) => [styles.tab, active === "generic" && styles.tabOn, pressed && styles.pressed]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active === "generic" }}
            >
                <FontAwesomeIcon
                    icon={faLayerGroup}
                    size={12}
                    color={active === "generic" ? colors.onPrimary : colors.textSecondary}
                />
                <Text style={[styles.tabText, active === "generic" && styles.tabTextOn]}>Generic</Text>
            </Pressable>

            {variationPlatforms.map((p) => {
                const meta = SOCIAL_PLATFORM_MAP[p];
                const on = active === p;
                return (
                    <Pressable
                        key={p}
                        onPress={() => onSelect(p)}
                        style={({ pressed }) => [styles.tab, on && styles.tabOn, pressed && styles.pressed]}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: on }}
                    >
                        <View
                            style={[
                                styles.dot,
                                { backgroundColor: on ? colors.onPrimary : colors[meta?.colorKey] ?? colors.textSecondary },
                            ]}
                        />
                        <Text style={[styles.tabText, on && styles.tabTextOn]}>{meta?.label ?? p}</Text>
                    </Pressable>
                );
            })}

            {canAdd ? (
                <Pressable
                    onPress={onAddPress}
                    style={({ pressed }) => [
                        variationPlatforms.length === 0 ? styles.addTabLabeled : styles.addTab,
                        pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Add a platform variation"
                    hitSlop={6}
                >
                    <FontAwesomeIcon icon={faPlus} size={12} color={colors.primary} />
                    {variationPlatforms.length === 0 ? (
                        <Text style={styles.addLabel}>Add platform</Text>
                    ) : null}
                </Pressable>
            ) : null}
        </ScrollView>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 2,
        },
        tab: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 20,
            backgroundColor: colors.tag,
        },
        tabOn: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        dot: {
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        tabText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.textSecondary,
        },
        tabTextOn: {
            color: colors.onPrimary,
        },
        addTab: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        addTabLabeled: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            height: 36,
            paddingHorizontal: 14,
            borderRadius: 18,
            backgroundColor: colors.tag,
        },
        addLabel: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.primary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default VariationTabs;
