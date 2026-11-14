/**
 * The right-hand panel: Media, Script and History, with the layer tree under
 * Media.
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
import { sceneHoldsSelection, selectionLabel, type Selection } from "./selection";
import { NO_REVISIONS, revisionRows, type DesignRevision } from "./revisions";
import StudioInspector from "./StudioInspector";
import type { ElementEdit } from "./inspector-edit";

type MainTab = "media" | "script" | "history";

/** For a caller with no write path — the panel still shows what is selected. */
const noEdit = () => {};
type MediaTab = "files" | "captions" | "inspirations" | "layers";

export interface StudioSidePanelProps {
    scenes: DesignScene[] | undefined;
    frames: DesignPreviewFrame[] | undefined;
    brief: string;
    selectedSceneId?: string | null;
    /** The element picked inside the player, shown under the scene tree. */
    selection?: Selection | null;
    /** Every version this film has been, newest last. */
    revisions?: DesignRevision[];
    /** The one the design points at, so the list can say which is playing. */
    currentPrefix?: string;
    /** Puts the film back to a revision. Absent while one is in flight. */
    onRestore?: (n: number) => void;
    restoring?: boolean;
    /** Applies a settled inspector change to the selected element. */
    onEditElement?: (edit: ElementEdit) => void;
    editing?: boolean;
    editError?: string | null;
    onSelectScene: (sceneId: string) => void;
    onSeek: (ms: number) => void;
}

const StudioSidePanel: React.FC<StudioSidePanelProps> = ({
    scenes,
    frames,
    brief,
    selectedSceneId,
    selection,
    revisions,
    currentPrefix,
    onRestore,
    restoring,
    onEditElement,
    editing,
    editError,
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
    // Recomputed whenever the poll brings a new document, which is also what
    // keeps "14 minutes ago" from going stale while the screen is open.
    const rows = useMemo(() => revisionRows(revisions, currentPrefix), [revisions, currentPrefix]);
    const sceneCount = scenes?.length ?? 0;

    return (
        <View style={styles.root}>
            <View style={styles.mainTabs}>
                {(["media", "script", "history"] as MainTab[]).map((t) => (
                    <Pressable
                        key={t}
                        onPress={() => setMain(t)}
                        style={[styles.mainTab, main === t && styles.mainTabOn]}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: main === t }}
                    >
                        <Text style={[styles.mainTabLabel, main === t && styles.mainTabLabelOn]}>
                            {t === "media" ? "Media" : t === "script" ? "Script" : "History"}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {main === "history" ? (
                <ScrollView contentContainerStyle={styles.historyBody}>
                    {rows.length === 0 ? (
                        <Text style={styles.empty}>{NO_REVISIONS}</Text>
                    ) : (
                        rows.map((r) => (
                            <View key={r.n} style={styles.revision}>
                                <View style={styles.revisionText}>
                                    <Text style={styles.revisionTitle}>
                                        {r.title}
                                        {r.current ? " · playing" : ""}
                                    </Text>
                                    {!!r.note && (
                                        <Text style={styles.revisionNote} numberOfLines={2}>
                                            {r.note}
                                        </Text>
                                    )}
                                    <Text style={styles.revisionWhen}>{r.when}</Text>
                                </View>
                                {/* No button on the one already playing: it is
                                    the answer to "restore this", not a thing
                                    to ask for. */}
                                {!r.current && !!onRestore && (
                                    <Pressable
                                        onPress={() => onRestore(r.n)}
                                        disabled={restoring}
                                        style={[styles.restore, restoring && styles.restoreOff]}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Restore the version from ${r.when}`}
                                    >
                                        <Text style={styles.restoreLabel}>Restore</Text>
                                    </Pressable>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            ) : main === "script" ? (
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
                                                    isScene &&
                                                        (node.id === selectedSceneId ||
                                                            sceneHoldsSelection(node.id, selection ?? null)) &&
                                                        styles.rowOn,
                                                ]}
                                                accessibilityRole="button"
                                                accessibilityLabel={node.label}
                                            >
                                                {isScene && node.hasChildren ? (
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
                                                ) : isScene ? (
                                                    // A scene with nothing to fold out keeps the
                                                    // indent, so the names still line up, but
                                                    // offers no triangle to open.
                                                    <View style={styles.chevronSpacer} />
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

                            {/* ── The inspector ────────────────────────────
                                Phase 11 shipped this read-only, so selection
                                could be proved without a write path that
                                could damage a design. Phase 13 is the write
                                path: the edits that should never cost a
                                model call. */}
                            <View style={styles.inspector}>
                                <StudioInspector
                                    selection={selection ?? null}
                                    onEdit={onEditElement ?? noEdit}
                                    saving={editing}
                                    error={editError}
                                />
                            </View>
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
                // Matches the chevron's 10px glyph so a scene without one does
                // not shift its name left of the scenes that have it.
                chevronSpacer: { width: 10 },

                inspector: {
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    gap: 3,
                    backgroundColor: withAlpha(colors.text, 0.03),
                },
                inspectorHead: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: withAlpha(colors.text, 0.5),
                },
                inspectorLabel: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.text,
                },
                inspectorMeta: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    color: withAlpha(colors.text, 0.45),
                },

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

                historyBody: { padding: 10, gap: 8 },
                revision: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                revisionText: { flex: 1, gap: 2 },
                revisionTitle: {
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    fontWeight: "600",
                    color: colors.text,
                },
                revisionNote: {
                    fontSize: fs(10),
                    lineHeight: lh(15),
                    color: colors.textSecondary,
                },
                revisionWhen: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    color: withAlpha(colors.text, 0.45),
                },
                restore: {
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.3,
                    elevation: 2,
                },
                restoreOff: { opacity: 0.5 },
                restoreLabel: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    fontWeight: "700",
                    color: colors.white,
                },
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
