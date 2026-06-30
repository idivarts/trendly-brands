/**
 * VariationModal — "duplicate to platform variation" picker.
 *
 * Opened from the "+" tab. Lets the user multi-select platforms (limited to the
 * content's targeted, connectable platforms that don't already have a variation)
 * and creates a variation per selection. Each new variation starts inheriting
 * everything from Generic — the user diverges it on its tab afterwards.
 */
import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import { useBreakpoints } from "@/hooks";
import { Platform } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import Colors from "@/shared-uis/constants/Colors";
import { faCheck, faClone, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
    visible: boolean;
    /** Platforms the user may create a variation for (targeted ∩ connectable, minus existing). */
    available: Platform[];
    onClose: () => void;
    onCreate: (platforms: Platform[]) => void;
}

const VariationModal: React.FC<Props> = ({ visible, available, onClose, onCreate }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors, xl);

    const [selected, setSelected] = useState<Platform[]>([]);

    useEffect(() => {
        if (visible) setSelected([]);
    }, [visible]);

    const toggle = (p: Platform) =>
        setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

    const create = () => {
        if (selected.length === 0) return;
        onCreate(selected);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
                <View style={styles.sheet} accessibilityViewIsModal>
                    <View style={styles.header}>
                        <View style={styles.headIcon}>
                            <FontAwesomeIcon icon={faClone} size={15} color={colors.primary} />
                        </View>
                        <View style={styles.headText}>
                            <Text style={styles.title}>Add platform variations</Text>
                            <Text style={styles.subtitle}>
                                Pick the platforms that need their own caption or options. Each starts as a
                                copy of Generic and stays in sync until you edit it.
                            </Text>
                        </View>
                        <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
                            <FontAwesomeIcon icon={faXmark} size={16} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <View style={styles.body}>
                        {available.length === 0 ? (
                            <Text style={styles.empty}>
                                Every targeted platform already has a variation. Remove one, or add more
                                platforms in Content details.
                            </Text>
                        ) : (
                            <View style={styles.grid}>
                                {available.map((p) => {
                                    const meta = SOCIAL_PLATFORM_MAP[p];
                                    const on = selected.includes(p);
                                    return (
                                        <Pressable
                                            key={p}
                                            onPress={() => toggle(p)}
                                            style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && styles.pressed]}
                                            accessibilityRole="checkbox"
                                            accessibilityState={{ checked: on }}
                                        >
                                            <View style={[styles.dot, { backgroundColor: colors[meta?.colorKey] ?? colors.textSecondary }]} />
                                            <Text style={[styles.optionText, on && styles.optionTextOn]} numberOfLines={1}>
                                                {meta?.label ?? p}
                                            </Text>
                                            <View style={[styles.check, on && styles.checkOn]}>
                                                {on ? <FontAwesomeIcon icon={faCheck} size={9} color={colors.onPrimary} /> : null}
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Pressable style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.createBtn, selected.length === 0 && styles.createBtnDisabled, pressed && styles.btnPressed]}
                            onPress={create}
                            disabled={selected.length === 0}
                            accessibilityRole="button"
                            accessibilityLabel="Create variations"
                        >
                            <FontAwesomeIcon icon={faClone} size={13} color={colors.onPrimary} />
                            <Text style={styles.createBtnText}>
                                {selected.length > 0 ? `Create ${selected.length}` : "Create"}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: colors.backdrop,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                },
                sheet: {
                    width: "100%",
                    maxWidth: 460,
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 12 },
                    shadowRadius: 32,
                    shadowOpacity: 0.18,
                    elevation: 12,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                    paddingHorizontal: 20,
                    paddingTop: 18,
                    paddingBottom: 10,
                },
                headIcon: {
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                headText: {
                    flex: 1,
                    gap: 4,
                },
                title: {
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                },
                subtitle: {
                    fontSize: 13,
                    lineHeight: 19,
                    color: colors.textSecondary,
                },
                closeBtn: {
                    padding: 4,
                },
                body: {
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                },
                empty: {
                    fontSize: 13,
                    lineHeight: 19,
                    color: colors.textSecondary,
                    paddingVertical: 12,
                },
                grid: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 10,
                },
                option: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 9,
                    paddingLeft: 12,
                    paddingRight: 10,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: colors.tag,
                    minWidth: xl ? 190 : "100%",
                    flexGrow: 1,
                },
                optionOn: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                dot: {
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                },
                optionText: {
                    flex: 1,
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.text,
                },
                optionTextOn: {
                    color: colors.onPrimary,
                },
                check: {
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.card,
                },
                checkOn: {
                    backgroundColor: colors.onPrimary + "33",
                },
                footer: {
                    flexDirection: "row",
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingBottom: 16,
                    paddingTop: 12,
                },
                cancelBtn: {
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: colors.tag,
                },
                cancelBtnText: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                createBtn: {
                    flex: 2,
                    flexDirection: "row",
                    gap: 8,
                    paddingVertical: 13,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                createBtnDisabled: {
                    opacity: 0.45,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                createBtnText: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                btnPressed: {
                    opacity: 0.72,
                },
                pressed: {
                    opacity: 0.6,
                },
            }),
        [colors, xl]
    );
}

export default VariationModal;
