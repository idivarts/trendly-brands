/**
 * StudioStage — one scene, drawn at the canvas's real proportions.
 *
 * ── What it is responsible for ──────────────────────────────────────────────
 * Laying out a scene's LAYER STACK and nothing else. It holds no timeline
 * arithmetic, no ordering, no editing: slot geometry comes from
 * `shared-libs/design/studio-runtime`, which the render worker imports too, so
 * a split screen cannot look one way here and another in the export.
 *
 * ── Why layers are drawn bottom-up ─────────────────────────────────────────
 * `layers[0]` is the base and later layers sit on top, which matches how the
 * renderer composites. The common mistake it prevents: a full-frame media layer
 * placed ABOVE type covers the type completely, and the preview is the only
 * place anyone would notice before paying for a render.
 *
 * ── Text editing: this file RELAYS, it does not edit ────────────────────────
 * An html layer renders inside a frame that already knows how to be edited —
 * it reports what was tapped and rewrites its own document on `setText`. So
 * tapping a headline here raises `onTapText` and the editor itself lives in the
 * screen above, which is the only level that can show a sheet and save.
 *
 * The frame hands back the WHOLE rewritten document rather than the new string,
 * which is the important part: the html is the truth, and reconstructing it on
 * this side from a text diff would eventually disagree with what the render
 * worker loads. So `onLayerHtml` carries the document the frame produced,
 * verbatim.
 */
import { fs, lh } from "@/constants/Typography";
import {
    IStudioScene,
    IStudioLayer,
} from "@/shared-libs/firestore/trendly-pro/models/studio";
import { IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";
import { slotRect } from "@/shared-libs/design/studio-runtime";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import VideoSurface from "@/components/shared/VideoSurface";
import DesignFrame from "@/components/contents/detail/design-stage/DesignFrame";
import { ResizeMode } from "expo-av";
import { faFilm, faImage, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { DesignFrameHandle } from "@/components/contents/detail/design-stage/bridge";
import { useTheme } from "@react-navigation/native";
import React, {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useMemo,
    useRef,
} from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

/** A text element the frame reported, in the frame's own coordinates. */
export interface TappedText {
    layerId: string;
    /** The frame's `data-el` id, which is what `setText` addresses. */
    elementId: string;
    text: string;
}

export interface StudioStageHandle {
    /**
     * Rewrite one text element of one html layer.
     *
     * The frame answers with its whole new document on `onLayerHtml`, so there
     * is nothing to await. Returns whether a frame actually TOOK the call: a
     * caller that arms itself to receive the answer must not stay armed when
     * nothing was asked, or it claims an unrelated save later.
     */
    setLayerText: (layerId: string, elementId: string, text: string) => boolean;
}

export interface StudioStageProps {
    scene: IStudioScene | null;
    /** The canvas's authored size, which fixes the preview's proportions. */
    canvasWidth: number;
    canvasHeight: number;
    /** How wide to draw it. Height follows from the canvas ratio. */
    displayWidth: number;

    /** Media rows for the layers' `mediaId`s. */
    media: Record<string, IAsset>;

    /** Whether video layers should be playing. */
    playing?: boolean;
    /** Scene-relative position, for seeking video layers. */
    positionMs?: number;

    selectedLayerId?: string | null;
    onSelectLayer?: (layerId: string | null) => void;
    /** Shown on an empty scene, so the gap is actionable rather than a void. */
    onFillEmpty?: () => void;

    /** A text element inside an html layer was tapped and can be edited. */
    onTapText?: (tapped: TappedText) => void;
    /** An html layer's document after an edit. Persist it verbatim. */
    onLayerHtml?: (layerId: string, html: string) => void;
}

const StudioStage = forwardRef<StudioStageHandle, StudioStageProps>(({
    scene,
    canvasWidth,
    canvasHeight,
    displayWidth,
    media,
    playing = false,
    positionMs = 0,
    selectedLayerId,
    onSelectLayer,
    onFillEmpty,
    onTapText,
    onLayerHtml,
}, ref) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const ratio = canvasWidth > 0 ? canvasHeight / canvasWidth : 16 / 9;
    const displayHeight = Math.round(displayWidth * ratio);
    const styles = useStyles(colors, displayWidth, displayHeight);

    const layers = useMemo(() => scene?.layers ?? [], [scene]);

    // One frame handle per html layer. A plain object rather than state: these
    // are imperative handles, and re-rendering when one attaches would be a
    // render loop for no gain.
    const frames = useRef<Record<string, DesignFrameHandle | null>>({});
    const registerFrame = useCallback((layerId: string, handle: DesignFrameHandle | null) => {
        frames.current[layerId] = handle;
    }, []);

    useImperativeHandle(ref, () => ({
        setLayerText: (layerId, elementId, text) => {
            const frame = frames.current[layerId];
            if (!frame) return false;
            frame.setText(elementId, text);
            return true;
        },
    }), []);

    if (!scene) {
        return (
            <View style={styles.canvas}>
                <View style={styles.placeholder}>
                    <FontAwesomeIcon icon={faFilm} size={28} color={colors.textSecondary} />
                    <Text style={styles.placeholderText}>No scene selected</Text>
                </View>
            </View>
        );
    }

    return (
        <Pressable style={styles.canvas} onPress={() => onSelectLayer?.(null)}>
            {layers.length === 0 ? (
                <Pressable style={styles.empty} onPress={onFillEmpty}>
                    <View style={styles.emptyBadge}>
                        <FontAwesomeIcon icon={faPlus} size={16} color={colors.primary} />
                    </View>
                    {/* An empty scene is a DELIBERATE placeholder, not a
                        broken one — so the copy offers rather than warns. */}
                    <Text style={styles.emptyTitle}>Empty scene</Text>
                    <Text style={styles.emptyHint}>
                        A gap you left on purpose. Tap to put something in it.
                    </Text>
                </Pressable>
            ) : (
                layers.map((layer, index) => (
                    <LayerView
                        key={layer.id}
                        layer={layer}
                        index={index}
                        asset={layer.mediaId ? media[layer.mediaId] : undefined}
                        canvasWidth={canvasWidth}
                        canvasHeight={canvasHeight}
                        displayWidth={displayWidth}
                        displayHeight={displayHeight}
                        playing={playing}
                        positionMs={positionMs}
                        selected={selectedLayerId === layer.id}
                        onSelect={() => onSelectLayer?.(layer.id)}
                        colors={colors}
                        registerFrame={registerFrame}
                        onTapText={onTapText}
                        onLayerHtml={onLayerHtml}
                    />
                ))
            )}
        </Pressable>
    );
});

StudioStage.displayName = "StudioStage";

interface LayerViewProps {
    layer: IStudioLayer;
    index: number;
    asset?: IAsset;
    canvasWidth: number;
    canvasHeight: number;
    displayWidth: number;
    displayHeight: number;
    playing: boolean;
    positionMs: number;
    selected: boolean;
    onSelect: () => void;
    colors: ReturnType<typeof Colors>;
    registerFrame: (layerId: string, handle: DesignFrameHandle | null) => void;
    onTapText?: (tapped: TappedText) => void;
    onLayerHtml?: (layerId: string, html: string) => void;
}

const LayerView: React.FC<LayerViewProps> = ({
    layer,
    asset,
    canvasWidth,
    canvasHeight,
    displayWidth,
    displayHeight,
    playing,
    positionMs,
    selected,
    onSelect,
    colors,
    registerFrame,
    onTapText,
    onLayerHtml,
}) => {
    const rect = slotRect(layer.slot, layer.rect);
    const box = {
        position: "absolute" as const,
        left: rect.x * displayWidth,
        top: rect.y * displayHeight,
        width: rect.w * displayWidth,
        height: rect.h * displayHeight,
        opacity: layer.opacity ?? 1,
    };
    const resize = layer.fit === "contain" ? ResizeMode.CONTAIN : ResizeMode.COVER;

    const body = () => {
        if (layer.kind === "html") {
            return (
                <DesignFrame
                    ref={(h) => registerFrame(layer.id, h)}
                    html={layer.html ?? ""}
                    width={canvasWidth}
                    height={canvasHeight}
                    // The frame scales itself from the canvas size, so a
                    // half-width slot gets half the display width and the
                    // document inside it stays correctly proportioned.
                    displayWidth={Math.round(rect.w * displayWidth)}
                    onMessage={(msg) => {
                        // `editable: false` is a block with children — editing
                        // it would flatten its structure, so the frame says so
                        // and the tap only selects the layer.
                        if (msg.type === "tap" && msg.editable) {
                            onTapText?.({ layerId: layer.id, elementId: msg.id, text: msg.text });
                            return;
                        }
                        if (msg.type === "html") {
                            onLayerHtml?.(layer.id, msg.html);
                        }
                    }}
                />
            );
        }
        if (!asset) {
            // Media that has gone missing, or a generation still in flight.
            // Drawn as a labelled hole rather than silently blank, because a
            // blank layer is indistinguishable from a layout bug.
            return (
                <View style={[stageStatics.missing, { backgroundColor: withAlpha(colors.text, 0.06) }]}>
                    <FontAwesomeIcon icon={faImage} size={18} color={colors.textSecondary} />
                </View>
            );
        }
        if (asset.kind === "video") {
            return (
                <VideoSurface
                    source={{ uri: asset.url }}
                    resizeMode={resize}
                    shouldPlay={playing}
                    isMuted={(layer.volume ?? 1) === 0}
                    volume={layer.volume ?? 1}
                    isLooping={false}
                    positionMillis={Math.max(0, (layer.trimInMs ?? 0) + positionMs)}
                    style={stageStatics.fill}
                />
            );
        }
        return (
            <Image
                source={{ uri: asset.url }}
                resizeMode={layer.fit === "contain" ? "contain" : "cover"}
                style={stageStatics.fill}
            />
        );
    };

    return (
        <Pressable
            style={[box, selected && { shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 }]}
            onPress={onSelect}
        >
            <View style={stageStatics.clip}>{body()}</View>
        </Pressable>
    );
};

const stageStatics = StyleSheet.create({
    fill: { width: "100%", height: "100%" },
    clip: { width: "100%", height: "100%", overflow: "hidden", borderRadius: 2 },
    missing: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
});

const useStyles = (
    colors: ReturnType<typeof Colors>,
    displayWidth: number,
    displayHeight: number
) =>
    useMemo(
        () =>
            StyleSheet.create({
                canvas: {
                    width: displayWidth,
                    height: displayHeight,
                    backgroundColor: colors.black,
                    borderRadius: 12,
                    overflow: "hidden",
                    // Depth from a shadow, never a border: the canvas has to
                    // read as a surface lifted off the page.
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: 20,
                    shadowOpacity: 0.18,
                    elevation: 8,
                },
                placeholder: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                },
                placeholderText: {
                    color: colors.textSecondary,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                },
                empty: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingHorizontal: 28,
                },
                emptyBadge: {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: withAlpha(colors.primary, 0.14),
                },
                emptyTitle: {
                    color: colors.white,
                    fontSize: fs(15),
                    lineHeight: lh(21),
                    fontWeight: "600",
                },
                emptyHint: {
                    color: withAlpha(colors.white, 0.65),
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    textAlign: "center",
                },
            }),
        [colors, displayWidth, displayHeight]
    );

export default StudioStage;
