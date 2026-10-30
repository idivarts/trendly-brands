import { AIModel } from "@/hooks/use-ai-models";
import type { AiSurface } from "@/shared-constants/analytics-events";
import { track } from "@/shared-libs/utils/analytics";
import Colors from "@/shared-uis/constants/Colors";
import { goToBilling } from "@/utils/billing-navigation";
import { useTheme } from "@react-navigation/native";
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
import { fs } from "@/constants/Typography";
import {
    ANCHOR_GAP,
    AnchorRect,
    DROPDOWN_MAX_HEIGHT,
    DROPDOWN_WIDTH,
    dropdownPositionFor,
} from "./dropdown-position";

interface Props {
    models: AIModel[];
    selectedModel: string;
    onSelect: (modelId: string) => void;
    compact?: boolean;
    /**
     * Which chat surface this picker belongs to, and the task its models were
     * resolved against.
     *
     * Required rather than optional: all five surfaces mount this same
     * component, so without them every model action in the app reports
     * identically — and the task matters because one stored preference is
     * resolved per task, so the same pick means different models in different
     * places.
     */
    surface: AiSurface;
    task: string;
}

const AIModelSelector: React.FC<Props> = ({
    models,
    selectedModel,
    onSelect,
    compact,
    surface,
    task,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState<AnchorRect | null>(null);
    const chipRef = useRef<View>(null);
    const styles = useMemo(() => makeStyles(colors, !!compact), [colors, compact]);

    const current = models.find((m) => m.id === selectedModel) ?? models[0];

    const openMenu = () => {
        // The denominator for a switch: without it, "nobody changes model"
        // and "nobody finds the picker" look the same. `locked_count` says how
        // much of the list this plan cannot use, which is the shape of the
        // upsell the user is looking at.
        track("ai_model_picker_opened", {
            surface,
            task,
            locked_count: models.filter((m) => !m.unlocked).length,
        });
        chipRef.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x, y, width, height });
            setOpen(true);
        });
    };

    const handlePick = (m: AIModel) => {
        if (!m.unlocked) {
            setOpen(false);
            // ⭐ The highest-intent moment in the product: someone asked for a
            // better model and was told no. `min_plan` is which tier they were
            // reaching for — the number that should decide what sits in Pro
            // versus Team. goToBilling then reports the upgrade tap itself.
            track("ai_model_locked_tapped", {
                model: m.id,
                min_plan: m.minPlan ?? "free",
                surface,
                task,
            });
            goToBilling("ai_model_locked", {
                feature: `ai_model:${m.id}`,
                reason: "plan_locked",
            });
            return;
        }
        // Re-picking the current model is not a switch; reporting it would
        // inflate the one number this event exists to give.
        if (m.id !== selectedModel) {
            track("ai_model_switched", {
                from_model: selectedModel || "default",
                to_model: m.id,
                surface,
                task,
            });
        }
        onSelect(m.id);
        setOpen(false);
    };

    const dropdownPosition = useMemo(
        () => (anchor ? dropdownPositionFor(anchor, Dimensions.get("window")) : null),
        [anchor]
    );

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
            paddingHorizontal: compact ? 10 : 12,
            paddingVertical: compact ? 7 : 8,
            minHeight: compact ? 34 : 38,
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
            fontSize: fs(12),
            fontWeight: "600",
        },
        chipCaret: { color: colors.tagForeground ?? colors.text, fontSize: fs(10) },
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
        // No maxHeight here on purpose — the container's is computed from the
        // real space available, and a second, larger cap on the scroll view
        // would quietly win back the height the container just gave up.
        dropdownScroll: {},
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
        rowTitle: { color: colors.text, fontSize: fs(13), fontWeight: "600" },
        rowSubtitle: { color: colors.textSecondary, fontSize: fs(11), marginTop: 2 },
        lockBadge: {
            paddingHorizontal: 6,
            paddingVertical: 2,
            backgroundColor: colors.primaryLight ?? colors.tag,
            borderRadius: 8,
        },
        lockText: { fontSize: fs(10), fontWeight: "700", color: colors.primary },
        check: { color: colors.primary, fontSize: fs(16), fontWeight: "700" },
    });
