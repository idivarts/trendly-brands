import type { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { IconButton, Text } from "react-native-paper";
import RightPanelDiscover from "./RightPanelDiscover";

const CORNER_RADIUS = 24;
const MODAL_INSET = 8;
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
    const { width } = useWindowDimensions();
    const isMobile = width < MOBILE_BREAKPOINT;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
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
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
            ]).start();
        }
    }, [visible, scaleAnim, backdropOpacity]);

    const handleClose = () => {
        if (!visible) return;
        Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: ANIM_DURATION,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    return (
        <View style={styles.overlay} pointerEvents={visible ? "auto" : "none"}>
            <View style={styles.wrapper}>
                <Animated.View
                    style={[
                        styles.backdrop,
                        {
                            opacity: backdropOpacity,
                        },
                    ]}
                >
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={handleClose}
                        accessibilityLabel="Close filter"
                        accessibilityRole="button"
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.modal,
                        {
                            opacity: backdropOpacity,
                            transform: [{ scale: scaleAnim }],
                        },
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
        wrapper: {
            flex: 1,
            justifyContent: "center",
            alignItems: isMobile ? "stretch" : "center",
            padding: isMobile ? 0 : MODAL_INSET,
        },
        backdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors.backdrop,
        },
        modal: {
            flex: 1,
            width: "100%",
            alignSelf: "stretch",
            backgroundColor: colors.background,
            borderRadius: CORNER_RADIUS,
            overflow: "hidden",
            ...Platform.select({
                web: {},
                default: {
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.2,
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
