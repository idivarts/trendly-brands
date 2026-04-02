import { useDiscovery } from "@/components/discover/discovery-context";
import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { Text, View } from "@/shared-uis/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Pressable,
    ScrollView,
    StyleProp,
    StyleSheet,
    ViewStyle,
} from "react-native";
import { Button, HelperText } from "react-native-paper";
import TrendlyAdvancedFilter from "./trendly/TrendlyAdvancedFilter";

// --------------------
// Component
// --------------------

interface IProps {
    style?: StyleProp<ViewStyle>;
    defaultAdvanceFilters?: IAdvanceFilters;
    onClearStoredFilters?: () => void;
    onFiltersApplied?: (filters: IAdvanceFilters) => void;
    disableCollapse?: boolean;
    /** When provided (e.g. in overlay mode), called instead of collapsePanel when Apply/Clear is used */
    onDismiss?: () => void;
}

import { useBreakpoints } from "@/hooks";

const RightPanelDiscover: React.FC<IProps> = ({
    style,
    defaultAdvanceFilters,
    onClearStoredFilters,
    onFiltersApplied,
    disableCollapse = false,
    onDismiss,
}) => {
    const {
        setRightPanel,
        showFilters,
        setShowFilters,
        isCollapsed,
        setIsCollapsed,
    } = useDiscovery();

    const { xl } = useBreakpoints();

    const theme = useTheme();
    const colors = Colors(theme);
    const filterApply = useRef<((action: "apply" | "clear") => void) | undefined>(
        undefined
    );
    const slideAnim = useRef(new Animated.Value(0)).current;

    const styles = useMemo(() => styleFn(colors), [colors]);

    const toggleCollapse = () => {
        if (disableCollapse) return;
        const nextCollapsed = !isCollapsed;
        const toValue = nextCollapsed ? 1 : 0;
        Animated.spring(slideAnim, {
            toValue,
            useNativeDriver: true,
            tension: 65,
            friction: 10,
        }).start();

        setIsCollapsed(nextCollapsed);
        setRightPanel(!nextCollapsed);
    };

    const collapsePanel = () => {
        if (disableCollapse) return;
        Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 65,
            friction: 10,
        }).start();
        setIsCollapsed(true);
        setRightPanel(false);
    };

    /** Close filter panel after Apply/Clear: use onDismiss in overlay mode, else collapse panel */
    const closeFilterAfterAction = () => {
        if (onDismiss) onDismiss();
        else collapsePanel();
    };

    const translateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 400],
    });

    // Sync animation state with isCollapsed prop from context
    useEffect(() => {
        if (disableCollapse) return;
        const toValue = isCollapsed ? 1 : 0;
        Animated.spring(slideAnim, {
            toValue,
            useNativeDriver: true,
            tension: 65,
            friction: 10,
        }).start();
    }, [disableCollapse, isCollapsed, slideAnim]);

    return (
        <Animated.View
            style={[
                styles.container,
                style,
                disableCollapse
                    ? { transform: [{ translateX: 0 }], maxWidth: "100%", width: "100%" }
                    : {
                        transform: [{ translateX: translateX }],
                        maxWidth: isCollapsed ? 0 : 400,
                        width: isCollapsed ? 0 : "100%",
                    },
            ]}
        >
            {xl && !disableCollapse && (
                <Pressable
                    style={[
                        styles.collapseButton,
                        isCollapsed
                            ? { right: 392, left: undefined }
                            : { left: -20, right: undefined },
                    ]}
                    onPress={toggleCollapse}
                >
                    <MaterialCommunityIcons
                        name={isCollapsed ? "chevron-left" : "chevron-right"}
                        size={24}
                        color={colors.onPrimary}
                    />
                </Pressable>
            )}
            <View style={styles.headerWrap}>
                <Text style={styles.headerTitle}>Trendly Advanced Filter</Text>
                <Text style={styles.headerSubtitle}>
                    Filters for discovery
                </Text>
            </View>

            <ScrollView>
                <TrendlyAdvancedFilter
                    FilterApplyRef={filterApply}
                    defaultAdvanceFilters={defaultAdvanceFilters}
                    onClearStoredFilters={onClearStoredFilters}
                    onFiltersApplied={onFiltersApplied}
                />
            </ScrollView>
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                <View style={styles.actions}>
                    <Button
                        mode="text"
                        style={styles.clearBtn}
                        onPress={async () => {
                            await filterApply.current?.("clear");
                            setTimeout(closeFilterAfterAction, 100);
                        }}
                    >
                        Clear all
                    </Button>
                    <Button
                        mode="contained"
                        style={styles.actionBtn}
                        icon="filter-variant"
                        onPress={async () => {
                            await filterApply.current?.("apply");
                            setTimeout(closeFilterAfterAction, 100);
                        }}
                    >
                        Apply
                    </Button>
                </View>

                <HelperText type="info" style={styles.helper}>
                    Tip: You can refine these later. Values are placeholders for now.
                </HelperText>
            </View>
        </Animated.View>
    );
};

// --------------------
// Styles
// --------------------
const styleFn = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        container: {
            maxWidth: 400,
            width: "100%",
            borderLeftWidth: 1,
            borderLeftColor: colors.border,
            position: "relative",
            transform: [{ translateX: 0 }],
        },
        collapseButton: {
            position: "absolute",
            top: "50%",
            transform: [{ translateY: -20 }],
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            zIndex: 2000,
        },
        actions: {
            gap: 6,
            paddingTop: 6,
            flexDirection: "row",
            justifyContent: "flex-end",
        },
        actionBtn: {
            borderRadius: 10,
        },
        clearBtn: {
            alignSelf: "center",
        },
        helper: {
            textAlign: "right",
            fontSize: 11,
            opacity: 0.6,
            marginTop: 4,
        },
        headerWrap: {
            padding: 16,
            gap: 10,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: "600",
        },
        headerSubtitle: {
            fontSize: 12,
            color: colors.textSecondary ?? colors.text,
            opacity: 0.9,
        },
    });

export default RightPanelDiscover;
