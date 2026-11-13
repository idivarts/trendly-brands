import StudioBriefPanel from "@/components/designs/StudioBriefPanel";
import StudioSidePanel from "@/components/designs/StudioSidePanel";
import StudioStage from "@/components/designs/StudioStage";
import StudioTimeline from "@/components/designs/StudioTimeline";
import {
    designAspect,
    designStatus,
    hasBeenSeen,
    isAuthoring,
    isPreviewing,
    isRendering,
    resolveDesignGate,
    type DesignStatusFields,
} from "@/components/designs/design-status";
import {
    sceneAt,
    timelineDurationMs,
    type DesignScene,
} from "@/components/designs/studio-layout";
import { useSidebarCollapsed } from "@/components/drawer-layout/sidebar-collapsed-context";
import PageHeader from "@/components/ui/page-header";
import { fs, lh } from "@/constants/Typography";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { formatTokens, useEntitlements } from "@/hooks/use-entitlements";
import AppLayout from "@/layouts/app-layout";
import { HttpError, HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { useTheme } from "@react-navigation/native";
import type { Selection } from "@/components/designs/selection";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Design Studio — one design, as an editor.
 *
 * Three panes over a timeline, which is the shape of the Hyperframes editor
 * this studio renders through. Matching it is not imitation for its own sake:
 * a design here IS a Hyperframes project, and a user who has seen one should
 * recognise the other.
 *
 *   ┌──────────┬─────────────────────┬──────────┐
 *   │  brief   │        stage        │  layers  │
 *   │ + actions│     + transport     │ + media  │
 *   ├──────────┴─────────────────────┴──────────┤
 *   │                timeline                   │
 *   └───────────────────────────────────────────┘
 *
 * ── One clock ─────────────────────────────────────────────────────────────
 * The playhead is a single position over the whole film, and everything else
 * is derived from it: the frame on the stage, the clip highlighted on the
 * timeline, the scene named in the layer tree. When a render exists the VIDEO
 * owns that clock and reports back, because two clocks that can disagree is
 * how you get a picture showing one scene while the timeline points at
 * another.
 *
 * ── Why the stage is a frame, not a live player ───────────────────────────
 * Hyperframes' own player would scrub the real composition, but the project
 * in S3 is not self-contained (GSAP is vendored at render time), and the
 * player needs a native WebView nothing here has tested. So an unrendered
 * design scrubs its PREVIEW FRAMES, and a rendered one plays its file. Both
 * drive the same transport, because which artefact is behind the picture is
 * our problem rather than the user's.
 *
 * ── Why this polls ────────────────────────────────────────────────────────
 * Authoring, previewing and rendering all outlive the request that starts
 * them — that is why they are queued — so their state lives on the design
 * document and the app reads it back. That is what lets the work survive a
 * reload or a locked phone.
 */

/** A design as the detail endpoint returns it. */
interface Design extends DesignStatusFields {
    id: string;
    name: string;
    contentId?: string;
    posterUrl?: string;
    previewUrl?: string;
    brief?: string;
    scenes?: DesignScene[];
}

const POLL_MS = 5000;

/** Which pane a phone is showing, since three columns do not fit one. */
type MobilePane = "brief" | "stage" | "layers";

const DesignDetail = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;
    const { designId } = useLocalSearchParams<{ designId: string }>();

    const { tokens } = useEntitlements();

    const [design, setDesign] = useState<Design | null>(null);
    const [brief, setBrief] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [gate, setGate] = useState<string | null>(null);
    const [positionMs, setPositionMs] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [loop, setLoop] = useState(true);
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    // What the user clicked inside the player. Owned here because three
    // panels read it — the scene tree highlights its scene, the inspector
    // shows it, and from Phase 14 the AI panel scopes an edit to it.
    const [selection, setSelection] = useState<Selection | null>(null);
    const [pane, setPane] = useState<MobilePane>("stage");
    // Watching the live composition rather than the rendered file. Web only:
    // the player is 776 KB of JavaScript and a React Native WebView has never
    // been tried with it, so a phone keeps the stills.
    const [live, setLive] = useState(false);

    // The stored brief is seeded ONCE, and never over text the user has
    // already typed: re-seeding on a poll would clobber their edits
    // mid-render, and seeding at all would clobber them if the first GET
    // lands while they are typing into what rendered as an empty box.
    const briefSeeded = useRef(false);
    const briefRef = useRef("");

    // ── Give the editor the width ─────────────────────────────────────────
    // Three panes and a timeline need room, and the expanded rail costs 280px
    // of it. Collapsed on arrival, and the user's own setting is PUT BACK on
    // the way out — quietly keeping a sidebar closed because they once opened
    // a design would be us deciding something that is theirs to decide.
    //
    // Desktop only: on a phone the rail is an overlay, so there is nothing to
    // reclaim and collapsing it would just change state behind their back.
    const { isCollapsed, setCollapsed } = useSidebarCollapsed();
    const collapsedOnArrival = useRef(isCollapsed);
    useEffect(() => {
        if (!xl) return;
        collapsedOnArrival.current = isCollapsed;
        setCollapsed(true);
        return () => setCollapsed(collapsedOnArrival.current);
        // Deliberately once per visit: re-running when `isCollapsed` changes
        // would fight the user if they expanded the rail while reading, and
        // would overwrite the state we are holding for them.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [xl]);

    const load = useCallback(async () => {
        if (!brandId || !designId) return;
        try {
            const res = await HttpWrapper.fetch(`/api/design/brands/${brandId}/designs/${designId}`, {
                method: "GET",
            });
            const data = await res.json();
            if (data?.design) {
                const next = data.design as Design;
                setDesign(next);
                if (!briefSeeded.current && next.brief && !briefRef.current) {
                    briefSeeded.current = true;
                    briefRef.current = next.brief;
                    setBrief(next.brief);
                }
            }
        } catch {
            /* A failed poll is not worth a toast; the next one usually works. */
        }
    }, [brandId, designId]);

    useEffect(() => {
        load();
    }, [load]);

    // A token gate the backend set has to be able to lift, or one 402 hides
    // the buttons for as long as the screen is open.
    useEffect(() => {
        if (gate === "tokens_exhausted" && tokens.state !== "exhausted" && tokens.total > 0) {
            setGate(null);
        }
    }, [gate, tokens.state, tokens.total]);

    useEffect(() => {
        if (!isAuthoring(design) && !isRendering(design) && !isPreviewing(design)) return;
        const t = setInterval(load, POLL_MS);
        return () => clearInterval(t);
    }, [design, load]);

    const act = useCallback(
        async (
            path: string,
            body: Record<string, unknown> | undefined,
            onOk: (data: Record<string, unknown>) => void,
            failTitle: string
        ) => {
            if (!brandId || !designId || submitting) return;
            setSubmitting(true);
            try {
                const res = await HttpWrapper.fetch(
                    `/api/design/brands/${brandId}/designs/${designId}/${path}`,
                    {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify(body ?? {}),
                    }
                );
                onOk((await res.json()) ?? {});
                setGate(null);
                await load();
            } catch (err: unknown) {
                // 402 is a wall, not a failure: the design is fine, the
                // wallet is empty, and retrying unchanged would fail again.
                // So the buttons are replaced with the reason rather than a
                // toast the user can dismiss and press again.
                if (err instanceof HttpError && err.status === 402) {
                    setGate(err.data?.reason === "tokens_exhausted" ? "tokens_exhausted" : "plan_locked");
                } else {
                    Toaster.error(failTitle, "Please try again.");
                }
            } finally {
                setSubmitting(false);
            }
        },
        [brandId, designId, submitting, load]
    );

    const author = useCallback(() => {
        const text = brief.trim();
        if (!text) {
            Toaster.error("Tell it what to make", "Describe the film in a sentence or two.");
            return;
        }
        return act(
            "author",
            { brief: text },
            () => Toaster.success("Writing your design", "You can leave this page — we'll finish it."),
            "Couldn't start writing"
        );
    }, [brief, act]);

    const preview = useCallback(
        () => act("preview", undefined, () => undefined, "Couldn't start the preview"),
        [act]
    );

    const render = useCallback(
        () =>
            act(
                "render",
                { quality: "delivery" },
                (data) => {
                    if (data?.status === "done") {
                        Toaster.success("Already rendered", "This design is up to date.");
                    } else if (typeof data?.refunded === "number" && data.refunded > 0) {
                        // A balance that dropped for nothing and quietly
                        // recovered is indistinguishable from one never
                        // charged. The person who watched it drop is the one
                        // who needs telling it was put right.
                        Toaster.success(
                            `${formatTokens(data.refunded)} tokens returned`,
                            "The attempt that failed has been refunded. Rendering again now."
                        );
                    } else {
                        Toaster.success("Rendering your design", "You can leave this page — we'll finish it.");
                    }
                },
                "Couldn't start the render"
            ),
        [act]
    );

    const status = designStatus(design);
    const effectiveGate = resolveDesignGate(gate, tokens.state);
    const aspect = designAspect(design);
    const scenes = design?.scenes;
    const totalMs = timelineDurationMs(design?.durationMs, scenes);
    const written = !!design?.projectPrefix;
    const seen = hasBeenSeen(design);

    // The scene under the playhead, unless the user picked one explicitly.
    const activeSceneId = selectedSceneId ?? sceneAt(scenes, positionMs)?.id ?? null;

    // Choosing a scene by hand clears the element. They are two answers to
    // "what are we looking at", and leaving a stale element selected while
    // the user moves to another scene makes the inspector lie.
    const onSelectScene = useCallback((id: string | null) => {
        setSelectedSceneId(id);
        setSelection(null);
    }, []);

    const onSeek = useCallback((ms: number) => {
        setPositionMs(ms);
        setSelectedSceneId(null);
    }, []);

    const briefPanel = (
        <StudioBriefPanel
            brief={brief}
            renderUrl={design?.renderUrl}
            onBriefChange={(t) => {
                briefRef.current = t;
                setBrief(t);
            }}
            status={status}
            gate={effectiveGate}
            tokenState={tokens.state}
            written={written}
            seen={seen}
            authoring={isAuthoring(design)}
            rendering={isRendering(design)}
            previewing={isPreviewing(design)}
            submitting={submitting}
            linkedToContent={!!design?.contentId}
            onAuthor={author}
            onPreview={preview}
            onRender={render}
        />
    );

    // Default to the live player when nothing is rendered yet: a written
    // design with no film is exactly the case stills were a stand-in for.
    // Once a render exists the FILE leads, because that is what gets
    // published, and the toggle is there to check a rewrite before paying to
    // render it again.
    const canGoLive = Platform.OS === "web" && !!design?.previewUrl;
    const showLive = canGoLive && (live || !design?.renderUrl);

    const stage = (
        <StudioStage
            previewUrl={design?.previewUrl}
            live={showLive}
            selection={selection}
            onSelectElement={setSelection}
            renderUrl={design?.renderUrl}
            posterUrl={design?.posterUrl}
            frames={design?.previewFrames}
            aspect={aspect}
            positionMs={positionMs}
            totalMs={totalMs}
            playing={playing}
            busy={status.busy}
            busyLabel={status.busy ? status.text : undefined}
            loop={loop}
            onPlayPause={() => setPlaying((p) => !p)}
            onSeek={onSeek}
            onToggleLoop={() => setLoop((l) => !l)}
            onPositionFromVideo={setPositionMs}
        />
    );

    const sidePanel = (
        <StudioSidePanel
            scenes={scenes}
            frames={design?.previewFrames}
            brief={brief}
            selectedSceneId={activeSceneId}
            selection={selection}
            onSelectScene={onSelectScene}
            onSeek={setPositionMs}
        />
    );

    return (
        <AppLayout>
            <PageHeader
                title={design?.name || "Design"}
                subtitle={status.bad ? "Something went wrong" : status.detail}
                showBackButton
                mobileActions="all"
            />

            {status.bad && (
                <View style={styles.errorWrap}>
                    <View style={styles.errorAccent} />
                    {/* The real reason goes in the body, not the header: a
                        validator message is the one thing that tells the user
                        what to change, and a header subtitle truncates it —
                        and is hidden entirely on a phone. */}
                    <Text style={styles.errorText}>{status.detail}</Text>
                </View>
            )}

            {xl ? (
                <View style={styles.desktop}>
                    <View style={styles.columns}>
                        <View style={styles.leftPane}>{briefPanel}</View>
                        <View style={styles.centerPane}>
                            {canGoLive && !!design?.renderUrl && (
                                <View style={styles.sourceTabs}>
                                    {[
                                        { on: showLive, label: "Live", v: true },
                                        { on: !showLive, label: "Rendered film", v: false },
                                    ].map((t) => (
                                        <Pressable
                                            key={t.label}
                                            onPress={() => setLive(t.v)}
                                            style={[styles.sourceTab, t.on && styles.sourceTabOn]}
                                            accessibilityRole="tab"
                                            accessibilityState={{ selected: t.on }}
                                        >
                                            <Text style={[styles.sourceLabel, t.on && styles.sourceLabelOn]}>
                                                {t.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                            {stage}
                        </View>
                        <View style={styles.rightPane}>{sidePanel}</View>
                    </View>
                    <StudioTimeline
                        scenes={scenes}
                        totalMs={totalMs}
                        positionMs={positionMs}
                        selectedSceneId={activeSceneId}
                        onSeek={onSeek}
                        onSelectScene={onSelectScene}
                    />
                </View>
            ) : (
                <View style={styles.mobile}>
                    {/* Three columns do not fit a phone, and shrinking them
                        gives three unusable ones. The stage keeps the width
                        it needs and the other two take turns. */}
                    <View style={styles.paneTabs}>
                        {(["brief", "stage", "layers"] as MobilePane[]).map((p) => (
                            <Pressable
                                key={p}
                                onPress={() => setPane(p)}
                                style={[styles.paneTab, pane === p && styles.paneTabOn]}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: pane === p }}
                            >
                                <Text style={[styles.paneTabLabel, pane === p && styles.paneTabLabelOn]}>
                                    {p === "brief" ? "Brief" : p === "stage" ? "Film" : "Layers"}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    <View style={styles.mobileBody}>
                        {pane === "brief" ? briefPanel : pane === "layers" ? sidePanel : stage}
                    </View>
                    {pane === "stage" && (
                        <StudioTimeline
                            scenes={scenes}
                            totalMs={totalMs}
                            positionMs={positionMs}
                            selectedSceneId={activeSceneId}
                            onSeek={onSeek}
                            onSelectScene={onSelectScene}
                        />
                    )}
                </View>
            )}
        </AppLayout>
    );
};

export default DesignDetail;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                desktop: { flex: 1 },
                columns: { flex: 1, flexDirection: "row" },
                leftPane: {
                    width: 320,
                    shadowColor: "#000",
                    shadowOffset: { width: 4, height: 0 },
                    shadowRadius: 12,
                    shadowOpacity: 0.06,
                    elevation: 6,
                    zIndex: 2,
                },
                centerPane: { flex: 1 },
                sourceTabs: {
                    flexDirection: "row",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: colors.black,
                },
                sourceTab: {
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: withAlpha(colors.white, 0.1),
                },
                sourceTabOn: { backgroundColor: colors.primary },
                sourceLabel: {
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    fontWeight: "700",
                    color: withAlpha(colors.white, 0.75),
                },
                sourceLabelOn: { color: colors.onPrimary },
                rightPane: {
                    width: 290,
                    shadowColor: "#000",
                    shadowOffset: { width: -4, height: 0 },
                    shadowRadius: 12,
                    shadowOpacity: 0.06,
                    elevation: 6,
                    zIndex: 2,
                },
                mobile: { flex: 1 },
                mobileBody: { flex: 1 },
                paneTabs: {
                    flexDirection: "row",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: colors.card,
                },
                paneTab: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: colors.tag,
                },
                paneTabOn: { backgroundColor: colors.primary },
                paneTabLabel: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    fontWeight: "700",
                    color: colors.text,
                },
                paneTabLabelOn: { color: colors.onPrimary },
                errorWrap: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginHorizontal: 14,
                    marginTop: 10,
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: colors.tag,
                },
                errorAccent: { width: 4, alignSelf: "stretch", backgroundColor: colors.red },
                errorText: {
                    flex: 1,
                    paddingVertical: 10,
                    paddingRight: 12,
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    color: colors.text,
                },
            }),
        [colors]
    );
}
