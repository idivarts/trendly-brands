import Colors from "@/shared-uis/constants/Colors";
import { faPenToSquare, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StrategyActionsMenu from "./StrategyActionsMenu";
import { ContentStrategy } from "./types";

interface StrategiesDrawerProps {
    visible: boolean;
    strategies: ContentStrategy[];
    activeId: string | null;
    onSelect: (strategy: ContentStrategy) => void;
    onClose: () => void;
    onDuplicate: (strategy: ContentStrategy) => void;
    onDelete: (strategy: ContentStrategy) => void;
    onShare?: (strategy: ContentStrategy) => void;
}

const StrategiesDrawer: React.FC<StrategiesDrawerProps> = ({
    visible,
    strategies,
    activeId,
    onSelect,
    onClose,
    onDuplicate,
    onDelete,
    onShare,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(0)).current;
    const styles = useMemo(() => useStyles(colors), [colors]);

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: visible ? 1 : 0,
            duration: 260,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    if (!visible) return null;

    const translateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [320, 0],
    });

    return (
        <View style={styles.overlay} pointerEvents={visible ? "auto" : "none"}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
                <View style={[styles.drawerHeader, { paddingTop: 18 + insets.top }]}>
                    <Text style={styles.drawerTitle}>Your Strategies</Text>
                    <Pressable onPress={onClose} style={styles.closeBtn}>
                        <FontAwesomeIcon icon={faXmark} size={18} color={colors.textSecondary} />
                    </Pressable>
                </View>
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 12 + insets.bottom }]}
                    showsVerticalScrollIndicator={false}
                >
                    {strategies.map((strategy) => {
                        const isActive = strategy.id === activeId;
                        return (
                            <Pressable
                                key={strategy.id}
                                style={[styles.strategyItem, isActive && styles.strategyItemActive]}
                                onPress={() => {
                                    onSelect(strategy);
                                    onClose();
                                }}
                            >
                                <View style={[styles.strategyIcon, isActive && styles.strategyIconActive]}>
                                    <FontAwesomeIcon
                                        icon={faPenToSquare}
                                        size={14}
                                        color={isActive ? colors.onPrimary : colors.primary}
                                    />
                                </View>
                                <View style={styles.strategyInfo}>
                                    <Text
                                        style={[styles.strategyTitle, isActive && styles.strategyTitleActive]}
                                        numberOfLines={2}
                                    >
                                        {strategy.title}
                                    </Text>
                                    <Text style={[styles.strategyDate, isActive && styles.strategyDateActive]}>
                                        {strategy.createdAt}
                                    </Text>
                                </View>
                                <StrategyActionsMenu
                                    iconColor={isActive ? colors.onPrimary : colors.textSecondary}
                                    onDuplicate={() => onDuplicate(strategy)}
                                    onDelete={() => onDelete(strategy)}
                                    onShare={onShare ? () => onShare(strategy) : undefined}
                                />
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </Animated.View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                overlay: {
                    ...StyleSheet.absoluteFillObject,
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    zIndex: 100,
                },
                backdrop: {
                    flex: 1,
                    backgroundColor: colors.backdrop,
                },
                drawer: {
                    width: 300,
                    backgroundColor: colors.modalBackground,
                    // Shadow on the left edge of the drawer
                    shadowColor: "#000",
                    shadowOffset: { width: -8, height: 0 },
                    shadowRadius: 24,
                    shadowOpacity: 0.18,
                    elevation: 16,
                },
                drawerHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingVertical: 18,
                    // Shadow below header to separate from list
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.06,
                    elevation: 2,
                    backgroundColor: colors.modalBackground,
                },
                drawerTitle: {
                    fontSize: 17,
                    fontWeight: "700",
                    color: colors.text,
                },
                closeBtn: {
                    padding: 4,
                },
                list: {
                    flex: 1,
                },
                listContent: {
                    padding: 12,
                    gap: 8,
                },
                strategyItem: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.06,
                    elevation: 2,
                },
                strategyItemActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.3,
                    elevation: 4,
                },
                strategyIcon: {
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.aliceBlue,
                },
                strategyIconActive: {
                    backgroundColor: "rgba(255,255,255,0.2)",
                },
                strategyInfo: {
                    flex: 1,
                },
                strategyTitle: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: 2,
                },
                strategyTitleActive: {
                    color: colors.onPrimary,
                },
                strategyDate: {
                    fontSize: 12,
                    color: colors.textSecondary,
                },
                strategyDateActive: {
                    color: colors.onPrimary,
                    opacity: 0.75,
                },
            }),
        [colors]
    );
}

export default StrategiesDrawer;
