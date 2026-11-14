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
    faArrowDown,
    faArrowUp,
    faChevronDown,
    faChevronRight,
    faClone,
    faTrash,
    faClosedCaptioning,
    faImages,
    faLayerGroup,
    faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { DesignPreviewFrame } from "./design-status";
import { formatClock, toLayerTree, type DesignScene } from "./studio-layout";
import { sceneHoldsSelection, selectionLabel, type Selection } from "./selection";
import { NO_REVISIONS, revisionRows, type DesignRevision } from "./revisions";
import { groupScript, lineBadge, worthSendingLine, type ScriptLine } from "./script-lines";
import StudioInspector from "./StudioInspector";
import type { ElementEdit } from "./inspector-edit";

type MainTab = "media" | "script" | "history";

/** For a caller with no write path — the panel still shows what is selected. */
const noEdit = () => {};

/** A file the project holds. */
export interface DesignAsset {
    path: string;
    kind: "image" | "audio" | "video";
    name: string;
}

/** Media to put into the film, as the backend's /media takes it. */
export interface MediaPlacement {
    sceneId?: string;
    elementId?: string;
    type?: "image" | "bgm";
    intent?: string;
    assetPath?: string;
}

/** One change to the film's shape, as the backend's /structure takes it. */
export interface SceneOperation {
    op: "retime" | "move" | "duplicate" | "delete" | "add";
    sceneId?: string;
    durationMs?: number;
    toIndex?: number;
}

/**
 * One line of the script.
 *
 * Committed on blur rather than as you type: a script is read and edited
 * in sentences, and a revision per keystroke would spend the history on
 * someone thinking. The draft is dropped if the line changes underneath —
 * a rewrite arriving while they type must not be silently overwritten by
 * a half-finished edit of the old words.
 */
const ScriptLineRow: React.FC<{
    line: ScriptLine;
    disabled: boolean;
    onCommit: (next: string) => void;
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof useStyles>;
}> = ({ line, disabled, onCommit, colors, styles }) => {
    const [draft, setDraft] = useState(line.text);
    useEffect(() => setDraft(line.text), [line.text]);
    const badge = lineBadge(line);
    return (
        <View style={styles.scriptLine}>
            {!!badge && <Text style={styles.scriptBadge}>{badge}</Text>}
            <TextInput
                value={draft}
                onChangeText={setDraft}
                onBlur={() => {
                    if (!worthSendingLine(line, draft)) {
                        setDraft(line.text);
                        return;
                    }
                    onCommit(draft);
                }}
                editable={!disabled}
                multiline
                style={[styles.scriptField, line.kind === "voice" && styles.scriptFieldVoice]}
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel={badge ? `${badge}: ${line.text}` : line.text}
            />
        </View>
    );
};

/** One small button on a scene row. */
const SceneOp: React.FC<{
    icon: typeof faArrowUp;
    label: string;
    disabled: boolean;
    onPress: () => void;
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof useStyles>;
}> = ({ icon, label, disabled, onPress, colors, styles }) => (
    <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={6}
        style={[styles.sceneOp, disabled && styles.dimRow]}
        accessibilityRole="button"
        accessibilityLabel={label}
    >
        <FontAwesomeIcon icon={icon} size={9} color={colors.textSecondary} />
    </Pressable>
);
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
    /** What the project directory holds. */
    assets?: DesignAsset[];
    /** Adds media to a scene, or puts a file on the selected element. */
    onAddMedia?: (place: MediaPlacement) => void;
    /** The film as words, for the Script tab. */
    script?: ScriptLine[];
    /** Writes one rewritten line. */
    onEditLine?: (line: ScriptLine, next: string) => void;
    /** Changes the film's shape: retime, move, duplicate, add, delete. */
    onScene?: (op: SceneOperation) => void;
    busyScenes?: boolean;
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
    assets,
    onAddMedia,
    script,
    onEditLine,
    onScene,
    busyScenes,
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
    const [mediaWanted, setMediaWanted] = useState("");

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
    const scriptScenes = useMemo(() => groupScript(script), [script]);
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
                    {/* ── The film as words ────────────────────────────────
                        For the people who think in copy rather than in
                        elements: read it top to bottom, fix the second
                        line. Editing one goes through the same endpoint
                        the inspector uses — one write path, not two. */}
                    {scriptScenes.length === 0 ? (
                        <>
                            <Text style={styles.sectionLabel}>The brief</Text>
                            <Text style={styles.script}>
                                {brief || "Nothing written yet — describe the film on the left."}
                            </Text>
                        </>
                    ) : (
                        scriptScenes.map((sc, i) => (
                            <View key={`${sc.sceneId}-${i}`} style={styles.scriptScene}>
                                <Text style={styles.sectionLabel}>{sc.title}</Text>
                                {sc.lines.map((l) => (
                                    <ScriptLineRow
                                        key={l.elementId}
                                        line={l}
                                        disabled={!onEditLine || !!editing}
                                        onCommit={(next) => onEditLine?.(l, next)}
                                        colors={colors}
                                        styles={styles}
                                    />
                                ))}
                            </View>
                        ))
                    )}
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
                                        // Which scene this is, counting only
                                        // scenes — the tree also holds their
                                        // children.
                                        const index = isScene
                                            ? tree.filter((n) => n.depth === 0).findIndex((n) => n.id === node.id)
                                            : -1;
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
                                                {/* ── Shape, on the row it belongs to ──────
                                                    Up, down, duplicate and delete sit on
                                                    the scene itself rather than in a menu
                                                    somewhere: the thing being moved is
                                                    the thing you are pointing at. */}
                                                {isScene && !!onScene && (
                                                    <View style={styles.sceneOps}>
                                                        <SceneOp
                                                            icon={faArrowUp}
                                                            label={`Move ${node.label} earlier`}
                                                            disabled={!!busyScenes || index === 0}
                                                            onPress={() => onScene({ op: "move", sceneId: node.id, toIndex: index - 1 })}
                                                            colors={colors}
                                                            styles={styles}
                                                        />
                                                        <SceneOp
                                                            icon={faArrowDown}
                                                            label={`Move ${node.label} later`}
                                                            disabled={!!busyScenes || index === sceneCount - 1}
                                                            onPress={() => onScene({ op: "move", sceneId: node.id, toIndex: index + 1 })}
                                                            colors={colors}
                                                            styles={styles}
                                                        />
                                                        <SceneOp
                                                            icon={faClone}
                                                            label={`Duplicate ${node.label}`}
                                                            disabled={!!busyScenes}
                                                            onPress={() => onScene({ op: "duplicate", sceneId: node.id })}
                                                            colors={colors}
                                                            styles={styles}
                                                        />
                                                        <SceneOp
                                                            icon={faTrash}
                                                            label={`Delete ${node.label}`}
                                                            disabled={!!busyScenes || sceneCount <= 1}
                                                            onPress={() => onScene({ op: "delete", sceneId: node.id })}
                                                            colors={colors}
                                                            styles={styles}
                                                        />
                                                    </View>
                                                )}
                                            </Pressable>
                                        );
                                    })
                                )}

                                {!!onScene && sceneCount > 0 && (
                                    <Pressable
                                        onPress={() => onScene({ op: "add" })}
                                        disabled={!!busyScenes}
                                        style={[styles.addScene, !!busyScenes && styles.dimRow]}
                                        accessibilityRole="button"
                                        accessibilityLabel="Add a scene"
                                    >
                                        <Text style={styles.addSceneLabel}>+ Add a scene</Text>
                                    </Pressable>
                                )}

                                {/* The rule, where the user can see it. An
                                    editor that reflows differently from what
                                    you expected is an editor you stop
                                    trusting. */}
                                {!!onScene && sceneCount > 1 && (
                                    <Text style={styles.sceneRule}>
                                        Scenes play one after another — moving or retiming one moves the rest.
                                    </Text>
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
                            {/* ── Asking for media ─────────────────────────
                                What is typed here becomes a declaration in
                                the film, which the next preview or render
                                fetches. The panel says that, because the
                                film does not have the photograph yet and a
                                panel that implied otherwise would have
                                someone render expecting it. */}
                            {!!onAddMedia && (
                                <View style={styles.askMedia}>
                                    <Text style={styles.sectionLabel}>
                                        {selectedSceneId ? `Add to ${selectedSceneId}` : "Add to the first scene"}
                                    </Text>
                                    <TextInput
                                        value={mediaWanted}
                                        onChangeText={setMediaWanted}
                                        placeholder="A photograph of cold brew poured over ice"
                                        placeholderTextColor={colors.textSecondary}
                                        multiline
                                        style={styles.scriptField}
                                        editable={!busyScenes}
                                        accessibilityLabel="What media to add"
                                    />
                                    <View style={styles.row}>
                                        {(["image", "bgm"] as const).map((kind) => (
                                            <Pressable
                                                key={kind}
                                                onPress={() => {
                                                    const text = mediaWanted.trim();
                                                    if (!text) return;
                                                    setMediaWanted("");
                                                    onAddMedia({
                                                        sceneId: selectedSceneId ?? undefined,
                                                        type: kind,
                                                        intent: text,
                                                    });
                                                }}
                                                disabled={!!busyScenes || mediaWanted.trim() === ""}
                                                style={[
                                                    styles.askBtn,
                                                    (!!busyScenes || mediaWanted.trim() === "") && styles.dimRow,
                                                ]}
                                                accessibilityRole="button"
                                            >
                                                <Text style={styles.askLabel}>
                                                    {kind === "image" ? "Add a picture" : "Add music"}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                    <Text style={styles.sceneRule}>
                                        It is fetched the next time this film is previewed or rendered.
                                    </Text>
                                </View>
                            )}

                            {/* What the film already holds. */}
                            {(assets?.length ?? 0) > 0 && (
                                <View style={styles.askMedia}>
                                    <Text style={styles.sectionLabel}>In this film</Text>
                                    {assets!.map((a) => (
                                        <View key={a.path} style={styles.assetRow}>
                                            <Text style={styles.assetName} numberOfLines={1}>
                                                {a.name}
                                            </Text>
                                            <Text style={styles.rowDetail}>{a.kind}</Text>
                                            {!!onAddMedia && !!selection && (
                                                <Pressable
                                                    onPress={() =>
                                                        onAddMedia({ elementId: selection.elementId, assetPath: a.path })
                                                    }
                                                    disabled={!!busyScenes}
                                                    style={[styles.useBtn, !!busyScenes && styles.dimRow]}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Put ${a.name} on the selected element`}
                                                >
                                                    <Text style={styles.useLabel}>Use</Text>
                                                </Pressable>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

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

                askMedia: { gap: 6, marginBottom: 14 },
                askBtn: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.28,
                    elevation: 2,
                },
                askLabel: { fontSize: fs(10), lineHeight: lh(14), fontWeight: "700", color: colors.white },
                assetRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 5,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                assetName: { flex: 1, fontSize: fs(10), lineHeight: lh(15), color: colors.text },
                useBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.primary },
                useLabel: { fontSize: fs(9), lineHeight: lh(13), fontWeight: "700", color: colors.white },

                scriptScene: { gap: 6, marginBottom: 14 },
                scriptLine: { gap: 3 },
                scriptBadge: {
                    fontSize: fs(9),
                    lineHeight: lh(13),
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: withAlpha(colors.text, 0.45),
                },
                scriptField: {
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    color: colors.text,
                    backgroundColor: colors.tag,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                },
                scriptFieldVoice: { fontStyle: "italic" },

                sceneOps: { flexDirection: "row", alignItems: "center", gap: 2 },
                sceneOp: { paddingHorizontal: 4, paddingVertical: 3, borderRadius: 5 },
                dimRow: { opacity: 0.35 },
                addScene: {
                    marginTop: 6,
                    alignItems: "center",
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                addSceneLabel: { fontSize: fs(10), lineHeight: lh(14), color: colors.text },
                sceneRule: {
                    marginTop: 8,
                    fontSize: fs(9),
                    lineHeight: lh(13),
                    color: withAlpha(colors.text, 0.45),
                    textAlign: "center",
                    paddingHorizontal: 8,
                },

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
