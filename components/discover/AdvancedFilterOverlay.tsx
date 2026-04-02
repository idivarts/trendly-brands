import type { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { IconButton, Text } from "react-native-paper";
import RightPanelDiscover from "./RightPanelDiscover";

const CORNER_RADIUS = 16;
const PANEL_WIDTH = 420;
const MOBILE_BREAKPOINT = 480;

interface AdvancedFilterOverlayProps {
    visible: boolean;
    onClose: () => void;
    defaultAdvanceFilters?: IAdvanceFilters;
    onClearStoredFilters?: () => void;
    onFiltersApplied?: (filters: IAdvanceFilters) => void;
}

const ANIM_DURATION = 220;

const AdvancedFilterOverlay: React.FC<AdvancedFilterOverlayProps> = ({
    visible,
    onClose,
    defaultAdvanceFilters,
    onClearStoredFilters,
    onFiltersApplied,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { width } = useBreakpoints();
    const isMobile = width < MOBILE_BREAKPOINT;
    const panelOffset = isMobile ? width : PANEL_WIDTH;
    const translateXAnim = useRef(new Animated.Value(panelOffset)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    const styles = useMemo(
        () => createStyles(colors, isMobile),
        [colors, isMobile]
    );

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(translateXAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
            ]).start();
        }
    }, [visible, translateXAnim, backdropOpacity]);

    const handleClose = () => {
        if (!visible) return;
        Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(translateXAnim, {
                toValue: panelOffset,
                duration: ANIM_DURATION,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    const handleBackdropPress = () => {
        if (!visible) return;
        backdropOpacity.setValue(0);
        translateXAnim.setValue(panelOffset);
        onClose();
    };

    return (
        <View style={styles.overlay} pointerEvents={visible ? "auto" : "none"}>
            <Animated.View
                style={[styles.backdrop, { opacity: backdropOpacity }]}
            >
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={handleBackdropPress}
                    accessibilityLabel="Close filter"
                    accessibilityRole="button"
                />
            </Animated.View>

            <Animated.View
                style={[
                    styles.panel,
                    { transform: [{ translateX: translateXAnim }] },
                ]}
            >
                <View style={styles.header}>
                    <View style={styles.headerTitleRow}>
                        <IconButton
                            icon="close"
                            size={24}
                            onPress={handleClose}
                            iconColor={colors.text}
                            style={styles.closeBtn}
                            accessibilityLabel="Close"
                        />
                        <Text style={[styles.title, { color: colors.text }]}>
                            Advanced Filters
                        </Text>
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                >
                    <RightPanelDiscover
                        defaultAdvanceFilters={defaultAdvanceFilters}
                        onClearStoredFilters={onClearStoredFilters}
                        onFiltersApplied={onFiltersApplied}
                        onDismiss={handleClose}
                        disableCollapse
                        style={styles.rightPanel}
                    />
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const createStyles = (
    colors: ReturnType<typeof Colors>,
    isMobile: boolean
) =>
    StyleSheet.create({
        overlay: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
        },
        backdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors.backdrop,
        },
        panel: {
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: isMobile ? "100%" : PANEL_WIDTH,
            backgroundColor: colors.background,
            borderTopLeftRadius: isMobile ? 0 : CORNER_RADIUS,
            borderBottomLeftRadius: isMobile ? 0 : CORNER_RADIUS,
            overflow: "hidden",
            ...Platform.select({
                web: {
                    boxShadow: `-8px 0 24px ${colors.panelShadow}`,
                } as any,
                default: {
                    shadowColor: colors.black,
                    shadowOffset: { width: -4, height: 0 },
                    shadowOpacity: 0.18,
                    shadowRadius: 24,
                    elevation: 24,
                },
            }),
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 8,
            paddingVertical: 8,
            paddingTop: Platform.OS === "ios" ? 48 : 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.outline,
            backgroundColor: colors.card,
        },
        headerTitleRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        closeBtn: {
            margin: 0,
        },
        title: {
            fontSize: 18,
            fontWeight: "600",
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: 32,
            flexGrow: 1,
            minWidth: 0,
            alignSelf: "stretch",
        },
        rightPanel: {
            flex: 1,
            maxWidth: "100%",
            width: "100%",
            borderLeftWidth: 0,
        },
    });

export default AdvancedFilterOverlay;
