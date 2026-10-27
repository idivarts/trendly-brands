/**
 * VariationTabs — the tab bar at the top of the content editor.
 *
 * Two groups, separated by a rule:
 *
 *   Overview │ Content · Instagram · Facebook · ＋
 *
 * "Overview" is the content ABOUT the post — its brief, the production handoff,
 * the script. Everything right of the rule is the post ITSELF: "Content" is the
 * shared base, then one tab per platform variation, then "+" to add one. The
 * separator is doing real work — without it Overview reads as a peer of the
 * platforms, which it is not, and the editor's one job (the post) competes with
 * the planning material around it.
 *
 * "Content" opens by default, not Overview: the post is what people come here
 * to work on, and the brief is a reference they go to deliberately.
 */
import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import { Platform } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import Colors from "@/shared-uis/constants/Colors";
import { faCircleInfo, faLayerGroup, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fs } from "@/constants/Typography";

/** A tab that EDITS the post: the shared base, or one platform's variation. */
export type EditableTab = "generic" | Platform;

/** Every tab, including Overview — which edits the brief, not the post. */
export type VariationTab = "overview" | EditableTab;

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
        // A border, where this codebase normally reaches for a shadow: on a tab
        // strip the line IS the affordance, the same exception the dashed
        // upload outline gets. A shadow here would read as another card.
        <View style={styles.strip}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.row}
            >
                <Pressable
                    onPress={() => onSelect("overview")}
                    style={({ pressed }) => [styles.tab, active === "overview" && styles.tabOn, pressed && styles.pressed]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active === "overview" }}
                >
                    <FontAwesomeIcon
                        icon={faCircleInfo}
                        size={12}
                        color={active === "overview" ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.tabText, active === "overview" && styles.tabTextOn]}>Overview</Text>
                </Pressable>

                <View style={styles.divider} />

                <Pressable
                    onPress={() => onSelect("generic")}
                    style={({ pressed }) => [styles.tab, active === "generic" && styles.tabOn, pressed && styles.pressed]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active === "generic" }}
                >
                    <FontAwesomeIcon
                        icon={faLayerGroup}
                        size={12}
                        color={active === "generic" ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.tabText, active === "generic" && styles.tabTextOn]}>Content</Text>
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
                                    { backgroundColor: colors[meta?.colorKey] ?? colors.textSecondary },
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
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        strip: {
            borderBottomWidth: 1,
            borderBottomColor: colors.border ?? colors.tag,
        },
        row: {
            flexDirection: "row",
            alignItems: "stretch",
            gap: 2,
            paddingTop: 2,
        },
        divider: {
            width: 1,
            alignSelf: "center",
            height: 16,
            marginHorizontal: 8,
            backgroundColor: colors.border ?? colors.tag,
        },
        tab: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 12,
            paddingBottom: 9,
            paddingTop: 7,
            borderBottomWidth: 2,
            borderBottomColor: "transparent",
        },
        tabOn: {
            borderBottomColor: colors.primary,
        },
        dot: {
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        tabText: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.textSecondary,
        },
        tabTextOn: {
            color: colors.primary,
            fontWeight: "700",
        },
        addTab: {
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
            paddingBottom: 9,
            paddingTop: 7,
        },
        addTabLabeled: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 12,
            paddingBottom: 9,
            paddingTop: 7,
        },
        addLabel: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.primary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default VariationTabs;
