/**
 * The right-hand panel: Media and Script, with the layer tree under Media.
 *
 * Mirrors the Hyperframes editor's own panel — the same two tabs, the same
 * sub-tabs, the same tree of clips with a count against each row.
 *
 * ── What is NOT here, and why it still appears ────────────────────────────
 * Captions and Inspirations are real tabs in Hyperframes and will be real
 * here in Phase 4, which is where media and captions land. They are shown
 * disabled with a word about what they will hold, rather than hidden,
 * because a panel that grows new tabs later is harder to learn than one
 * whose shape is stable and whose empty parts say so.
 */
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import {
    faChevronDown,
    faChevronRight,
    faClosedCaptioning,
    faImages,
    faLayerGroup,
    faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { DesignPreviewFrame } from "./design-status";
import { formatClock, toLayerTree, type DesignScene } from "./studio-layout";

type MainTab = "media" | "script";
type MediaTab = "files" | "captions" | "inspirations" | "layers";

export interface StudioSidePanelProps {
    scenes: DesignScene[] | undefined;
    frames: DesignPreviewFrame[] | undefined;
    brief: string;
    selectedSceneId?: string | null;
    onSelectScene: (sceneId: string) => void;
    onSeek: (ms: number) => void;
}

const StudioSidePanel: React.FC<StudioSidePanelProps> = ({
    scenes,
    frames,
    brief,
    selectedSceneId,
    onSelectScene,
    onSeek,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const [main, setMain] = useState<MainTab>("media");
    const [media, setMedia] = useState<MediaTab>("layers");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggle = useCallback((id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const tree = useMemo(() => toLayerTree(scenes, expanded), [scenes, expanded]);
    const sceneCount = scenes?.length ?? 0;

    return (
        <View style={styles.root}>
            <View style={styles.mainTabs}>
                {(["media", "script"] as MainTab[]).map((t) => (
                    <Pressable
                        key={t}
                        onPress={() => setMain(t)}
                        style={[styles.mainTab, main === t && styles.mainTabOn]}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: main === t }}
                    >
                        <Text style={[styles.mainTabLabel, main === t && styles.mainTabLabelOn]}>
                            {t === "media" ? "Media" : "Script"}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {main === "script" ? (
                <ScrollView contentContainerStyle={styles.scriptBody}>
                    <Text style={styles.sectionLabel}>The brief</Text>
                    <Text style={styles.script}>
                        {brief || "Nothing written yet — describe the film on the left."}
                    </Text>
                </ScrollView>
            ) : (
                <>
                    <View style={styles.subTabs}>
                        <SubTab icon={faImages} label="All files" on={media === "files"} onPress={() => setMedia("files")} colors={colors} />
                        <SubTab icon={faClosedCaptioning} label="Captions" on={media === "captions"} onPress={() => setMedia("captions")} colors={colors} />
                        <SubTab icon={faLightbulb} label="Ideas" on={media === "inspirations"} onPress={() => setMedia("inspirations")} colors={colors} />
                        <SubTab icon={faLayerGroup} label="Layers" on={media === "layers"} onPress={() => setMedia("layers")} colors={colors} />
                    </View>

                    {media === "layers" && (
                        <>
                            <Text style={styles.count}>
                                {sceneCount === 1 ? "1 scene" : `${sceneCount} scenes`}
                            </Text>
                            <ScrollView contentContainerStyle={styles.treeBody}>
                                {tree.length === 0 ? (
                                    <Text style={styles.empty}>
                                        Nothing yet. Write the design and its scenes appear here.
                                    </Text>
                                ) : (
                                    tree.map((node) => {
                                        const isScene = node.depth === 0;
                                        const scene = isScene
                                            ? scenes?.find((s) => s.id === node.id)
                                            : undefined;
                                        const open = expanded.has(node.id);
                                        return (
                                            <Pressable
                                                key={node.id}
                                                onPress={() => {
                                                    if (!isScene) return;
                                                    onSelectScene(node.id);
                                                    if (scene) onSeek(scene.startMs);
                                                }}
                                                style={[
                                                    styles.row,
                                                    { paddingLeft: 10 + node.depth * 18 },
                                                    isScene && node.id === selectedSceneId && styles.rowOn,
                                                ]}
                                                accessibilityRole="button"
                                                accessibilityLabel={node.label}
                                            >
                                                {isScene ? (
                                                    <Pressable
                                                        onPress={() => toggle(node.id)}
                                                        hitSlop={8}
                                                        accessibilityRole="button"
                                                        accessibilityLabel={open ? "Collapse" : "Expand"}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={open ? faChevronDown : faChevronRight}
                                                            size={10}
                                                            color={colors.textSecondary}
                                                        />
                                                    </Pressable>
                                                ) : (
                                                    <View style={styles.leafDot} />
                                                )}
                                                <Text style={styles.rowLabel} numberOfLines={1}>
                                                    {node.label}
                                                </Text>
                                                <Text style={styles.rowDetail} numberOfLines={1}>
                                                    {node.detail}
                                                </Text>
                                            </Pressable>
                                        );
                                    })
                                )}
                            </ScrollView>
                        </>
                    )}

                    {media === "files" && (
                        <ScrollView contentContainerStyle={styles.filesBody}>
                            {(frames?.length ?? 0) === 0 ? (
                                <Text style={styles.empty}>
                                    Preview the design and its frames appear here.
                                </Text>
                            ) : (
                                <View style={styles.grid}>
                                    {frames!.map((f) => (
                                        <Pressable
                                            key={`${f.url}-${f.timeMs}`}
                                            onPress={() => onSeek(f.timeMs)}
                                            style={styles.gridCell}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Frame at ${formatClock(f.timeMs)}`}
                                        >
                                            <Image source={{ uri: f.url }} style={styles.gridImage} resizeMode="cover" />
                                            <Text style={styles.gridTime}>{formatClock(f.timeMs)}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                    )}

                    {(media === "captions" || media === "inspirations") && (
                        <View style={styles.soon}>
                            <Text style={styles.empty}>
                                {media === "captions"
                                    ? "Captions arrive with the media phase."
                                    : "Reference material arrives with the media phase."}
                            </Text>
                        </View>
                    )}
                </>
            )}
        </View>
    );
};

const SubTab: React.FC<{
    icon: typeof faImages;
    label: string;
    on: boolean;
    onPress: () => void;
    colors: ReturnType<typeof Colors>;
}> = ({ icon, label, on, onPress, colors }) => {
    const styles = useStyles(colors);
    return (
        <Pressable
            onPress={onPress}
            style={styles.subTab}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
        >
            <FontAwesomeIcon icon={icon} size={13} color={on ? colors.primary : colors.textSecondary} />
            <Text style={[styles.subTabLabel, on && styles.subTabLabelOn]} numberOfLines={1}>
                {label}
            </Text>
        </Pressable>
    );
};

export default StudioSidePanel;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                root: { flex: 1, backgroundColor: colors.card },
                mainTabs: {
                    flexDirection: "row",
                    gap: 6,
                    padding: 10,
                },
                mainTab: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: colors.tag,
                },
                mainTabOn: { backgroundColor: colors.primary },
                mainTabLabel: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    fontWeight: "700",
                    color: colors.text,
                },
                mainTabLabelOn: { color: colors.onPrimary },
                subTabs: {
                    flexDirection: "row",
                    paddingHorizontal: 8,
                    paddingBottom: 8,
                    gap: 2,
                },
                subTab: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 6 },
                subTabLabel: { fontSize: fs(9), lineHeight: lh(13), color: colors.textSecondary },
                subTabLabelOn: { color: colors.primary, fontWeight: "700" },
                count: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    color: colors.textSecondary,
                    paddingHorizontal: 14,
                    paddingBottom: 4,
                },
                treeBody: { paddingBottom: 16 },
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingRight: 12,
                    paddingVertical: 7,
                },
                rowOn: { backgroundColor: withAlpha(colors.primary, 0.14) },
                leafDot: {
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: withAlpha(colors.text, 0.3),
                },
                rowLabel: { flex: 1, fontSize: fs(11), lineHeight: lh(16), color: colors.text },
                rowDetail: { fontSize: fs(10), lineHeight: lh(14), color: colors.textSecondary },
                empty: {
                    fontSize: fs(11),
                    lineHeight: lh(17),
                    color: colors.textSecondary,
                    textAlign: "center",
                    paddingHorizontal: 20,
                    paddingVertical: 24,
                },
                soon: { flex: 1, justifyContent: "center" },
                scriptBody: { padding: 14, gap: 8 },
                sectionLabel: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    fontWeight: "700",
                    color: colors.textSecondary,
                    textTransform: "uppercase",
                },
                script: { fontSize: fs(12), lineHeight: lh(19), color: colors.text },
                filesBody: { padding: 10 },
                grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
                gridCell: { width: 76, gap: 3 },
                gridImage: {
                    width: 76,
                    height: 112,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                gridTime: { fontSize: fs(9), lineHeight: lh(13), color: colors.textSecondary, textAlign: "center" },
            }),
        [colors]
    );
}
