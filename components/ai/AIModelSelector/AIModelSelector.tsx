import { AIModel } from "@/hooks/use-ai-models";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface Props {
    models: AIModel[];
    selectedModel: string;
    onSelect: (modelId: string) => void;
    compact?: boolean;
}

interface AnchorRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const DROPDOWN_WIDTH = 240;
const DROPDOWN_MAX_HEIGHT = 320;
const ANCHOR_GAP = 6;

const AIModelSelector: React.FC<Props> = ({ models, selectedModel, onSelect, compact }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState<AnchorRect | null>(null);
    const chipRef = useRef<View>(null);
    const styles = useMemo(() => makeStyles(colors, !!compact), [colors, compact]);

    const current = models.find((m) => m.id === selectedModel) ?? models[0];

    const openMenu = () => {
        chipRef.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x, y, width, height });
            setOpen(true);
        });
    };

    const handlePick = (m: AIModel) => {
        if (!m.unlocked) {
            setOpen(false);
            router.push("/billing");
            return;
        }
        onSelect(m.id);
        setOpen(false);
    };

    // Anchor the dropdown to the chip. Flip above when there isn't room below
    // and clamp horizontally so it never spills off-screen.
    const dropdownPosition = useMemo(() => {
        if (!anchor) return null;
        const screen = Dimensions.get("window");
        const spaceBelow = screen.height - (anchor.y + anchor.height);
        const showAbove = spaceBelow < DROPDOWN_MAX_HEIGHT + ANCHOR_GAP + 16;
        let left = anchor.x;
        if (left + DROPDOWN_WIDTH > screen.width - 8) {
            left = Math.max(8, screen.width - DROPDOWN_WIDTH - 8);
        }
        const top = showAbove
            ? Math.max(8, anchor.y - ANCHOR_GAP - DROPDOWN_MAX_HEIGHT)
            : anchor.y + anchor.height + ANCHOR_GAP;
        return { top, left };
    }, [anchor]);

    return (
        <>
            <Pressable ref={chipRef} style={styles.chip} onPress={openMenu}>
                <Text style={styles.chipText} numberOfLines={1}>
                    {current?.displayName ?? "Model"}
                </Text>
                <Text style={styles.chipCaret}>▾</Text>
            </Pressable>

            <Modal
                transparent
                visible={open}
                animationType="fade"
                onRequestClose={() => setOpen(false)}
            >
                <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
                    {dropdownPosition && (
                        <Pressable
                            style={[styles.dropdown, dropdownPosition]}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <ScrollView
                                style={styles.dropdownScroll}
                                contentContainerStyle={styles.dropdownContent}
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                            >
                                {models.map((m) => {
                                    const isSelected = m.id === selectedModel;
                                    return (
                                        <Pressable
                                            key={m.id}
                                            style={({ pressed }) => [
                                                styles.row,
                                                isSelected && styles.rowSelected,
                                                pressed && styles.rowPressed,
                                            ]}
                                            onPress={() => handlePick(m)}
                                        >
                                            <View style={styles.rowText}>
                                                <Text style={styles.rowTitle} numberOfLines={1}>
                                                    {m.displayName}
                                                </Text>
                                                <Text style={styles.rowSubtitle} numberOfLines={1}>
                                                    {m.provider}
                                                </Text>
                                            </View>
                                            {!m.unlocked ? (
                                                <View style={styles.lockBadge}>
                                                    <Text style={styles.lockText}>🔒 Pro</Text>
                                                </View>
                                            ) : isSelected ? (
                                                <Text style={styles.check}>✓</Text>
                                            ) : null}
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        </Pressable>
                    )}
                </Pressable>
            </Modal>
        </>
    );
};

export default AIModelSelector;

const makeStyles = (colors: any, compact: boolean) =>
    StyleSheet.create({
        chip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: compact ? 8 : 10,
            paddingVertical: compact ? 4 : 6,
            backgroundColor: colors.tag,
            borderRadius: 14,
            maxWidth: 180,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        chipText: {
            color: colors.tagForeground ?? colors.text,
            fontSize: 12,
            fontWeight: "600",
        },
        chipCaret: { color: colors.tagForeground ?? colors.text, fontSize: 10 },
        backdrop: {
            flex: 1,
            backgroundColor: "transparent",
        },
        dropdown: {
            position: "absolute",
            width: DROPDOWN_WIDTH,
            maxHeight: DROPDOWN_MAX_HEIGHT,
            backgroundColor: colors.card,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 20,
            shadowOpacity: 0.18,
            elevation: 12,
            overflow: "hidden",
        },
        dropdownScroll: { maxHeight: DROPDOWN_MAX_HEIGHT },
        dropdownContent: { padding: 6 },
        row: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderRadius: 8,
            gap: 8,
        },
        rowSelected: { backgroundColor: colors.tag },
        rowPressed: { opacity: 0.7 },
        rowText: { flex: 1 },
        rowTitle: { color: colors.text, fontSize: 13, fontWeight: "600" },
        rowSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
        lockBadge: {
            paddingHorizontal: 6,
            paddingVertical: 2,
            backgroundColor: colors.primaryLight ?? colors.tag,
            borderRadius: 8,
        },
        lockText: { fontSize: 10, fontWeight: "700", color: colors.primary },
        check: { color: colors.primary, fontSize: 16, fontWeight: "700" },
    });
