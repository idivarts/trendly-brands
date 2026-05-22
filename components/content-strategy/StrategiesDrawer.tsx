import Colors from "@/shared-uis/constants/Colors";
import { faChevronRight, faPenToSquare, faXmark } from "@fortawesome/free-solid-svg-icons";
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
import { ContentStrategy } from "./types";

interface StrategiesDrawerProps {
    visible: boolean;
    strategies: ContentStrategy[];
    activeId: string | null;
    onSelect: (strategy: ContentStrategy) => void;
    onClose: () => void;
}

const StrategiesDrawer: React.FC<StrategiesDrawerProps> = ({
    visible,
    strategies,
    activeId,
    onSelect,
    onClose,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const styles = useMemo(() => useStyles(colors), [colors]);

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: visible ? 1 : 0,
            duration: 260,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    const translateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [320, 0],
    });

    if (!visible) return null;

    return (
        <View style={styles.overlay} pointerEvents={visible ? "auto" : "none"}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
                <View style={styles.drawerHeader}>
                    <Text style={styles.drawerTitle}>Your Strategies</Text>
                    <Pressable onPress={onClose} style={styles.closeBtn}>
                        <FontAwesomeIcon icon={faXmark} size={18} color={colors.textSecondary} />
                    </Pressable>
                </View>
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
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
                                <View style={styles.strategyIcon}>
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
                                    <Text style={styles.strategyDate}>{strategy.createdAt}</Text>
                                </View>
                                <FontAwesomeIcon
                                    icon={faChevronRight}
                                    size={12}
                                    color={isActive ? colors.onPrimary : colors.textSecondary}
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
                    shadowColor: colors.panelShadow,
                    shadowOffset: { width: -4, height: 0 },
                    shadowRadius: 20,
                    shadowOpacity: 1,
                    elevation: 12,
                },
                drawerHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
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
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                },
                strategyItemActive: {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                },
                strategyIcon: {
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.aliceBlue,
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
            }),
        [colors]
    );
}

export default StrategiesDrawer;
