import { UpgradeInline } from "@/components/billing/EntitlementGate";
import VideoSurface from "@/components/shared/VideoSurface";
import PageHeader from "@/components/ui/page-header";
import { fs, lh } from "@/constants/Typography";
import { useBrandContext } from "@/contexts/brand-context.provider";
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
import { formatTokens, useEntitlements } from "@/hooks/use-entitlements";
import AppLayout from "@/layouts/app-layout";
import { HttpError, HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { ResizeMode } from "expo-av";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

/**
 * One Design Studio v3 design: write it, render it, watch it.
 *
 * ── Why the preview is the rendered file, not a live player ────────────────
 * Hyperframes ships a 117 KB player that runs in any WebView, and a live,
 * scrubbable preview is where this screen should end up. It is not here yet
 * for an honest reason: the project's scenes are mounted by the Hyperframes
 * runtime from `data-composition-src`, so pointing a WebView at index.html
 * shows a root composition with nothing in it. Serving the runtime alongside
 * the project is its own piece of work.
 *
 * Until then the preview is the rendered MP4, which is the artefact the user
 * actually publishes. The honest trade: slower to iterate, but what you watch
 * is exactly what you get, with no second renderer to disagree with the first.
 *
 * ── Why this polls ─────────────────────────────────────────────────────────
 * Authoring and rendering both outlive the request that starts them — that is
 * the whole reason they are queued — so their state lives on the design
 * document. The app reads it back rather than holding a connection open,
 * which is what lets the work survive a reload or a locked phone.
 */

/** A design as the detail endpoint returns it. */
interface Design extends DesignStatusFields {
    id: string;
    name: string;
    contentId?: string;
    posterUrl?: string;
    /** What the user asked for last time, so a rewrite starts from it. */
    brief?: string;
}

const POLL_MS = 5000;

const DesignDetail = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;
    const { designId } = useLocalSearchParams<{ designId: string }>();

    const { tokens } = useEntitlements();

    const [design, setDesign] = useState<Design | null>(null);
    const [brief, setBrief] = useState("");
    const [submitting, setSubmitting] = useState(false);
    // What the BACKEND said when it refused, which outranks the local read:
    // the wallet may have emptied since this screen hydrated.
    const [gate, setGate] = useState<string | null>(null);
    // The stored brief is seeded into the box ONCE, and never over text the
    // user has already typed. Two separate hazards: re-seeding on every poll
    // would clobber their edits mid-render, and seeding at all would clobber
    // them if the first GET lands while they are already typing into what
    // rendered as an empty box.
    const briefSeeded = useRef(false);
    const briefRef = useRef("");

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
                // briefRef, not the `brief` state: this closure captures the
                // value from the render that created it, which is "" for the
                // first load even after the user has typed. The ref is read
                // at the moment the response lands, so their text wins.
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

    // A token gate the backend set has to be able to lift. Without this, one
    // 402 hides the Render button for as long as the screen is open — the user
    // tops up, the wallet says so, and the button they paid for never returns.
    useEffect(() => {
        if (gate === "tokens_exhausted" && tokens.state !== "exhausted" && tokens.total > 0) {
            setGate(null);
        }
    }, [gate, tokens.state, tokens.total]);

    // Poll only while something is actually in flight. A design sitting at
    // "ready" does not need a request every five seconds for as long as the
    // screen is open.
    useEffect(() => {
        if (!isAuthoring(design) && !isRendering(design) && !isPreviewing(design)) return;
        const t = setInterval(load, POLL_MS);
        return () => clearInterval(t);
    }, [design, load]);

    const author = useCallback(async () => {
        if (!brandId || !designId || submitting) return;
        const text = brief.trim();
        if (!text) {
            Toaster.error("Tell it what to make", "Describe the film in a sentence or two.");
            return;
        }
        setSubmitting(true);
        try {
            await HttpWrapper.fetch(`/api/design/brands/${brandId}/designs/${designId}/author`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ brief: text }),
            });
            Toaster.success("Writing your design", "You can leave this page — we'll finish it.");
            setGate(null);
            await load();
        } catch (err: unknown) {
            // Authoring is metered too: it is a frontier-model call the org
            // pays for, so it answers 402 with the same two reasons a render
            // does, and is shown the same wall rather than a dismissible toast.
            if (err instanceof HttpError && err.status === 402) {
                setGate(err.data?.reason === "tokens_exhausted" ? "tokens_exhausted" : "plan_locked");
            } else {
                Toaster.error("Couldn't start writing", "Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    }, [brandId, designId, brief, submitting, load]);

    const preview = useCallback(async () => {
        if (!brandId || !designId || submitting) return;
        setSubmitting(true);
        try {
            await HttpWrapper.fetch(`/api/design/brands/${brandId}/designs/${designId}/preview`, {
                method: "POST",
            });
            await load();
        } catch {
            // No 402 branch: a preview is deliberately free, so the only way
            // this fails is a real fault.
            Toaster.error("Couldn't start the preview", "Please try again.");
        } finally {
            setSubmitting(false);
        }
    }, [brandId, designId, submitting, load]);

    const render = useCallback(async () => {
        if (!brandId || !designId || submitting) return;
        setSubmitting(true);
        try {
            const res = await HttpWrapper.fetch(`/api/design/brands/${brandId}/designs/${designId}/render`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ quality: "delivery" }),
            });
            const data = await res.json();
            if (data?.status === "done") {
                Toaster.success("Already rendered", "This design is up to date.");
            } else if (typeof data?.refunded === "number" && data.refunded > 0) {
                // The last attempt failed after taking tokens, and this retry
                // gave them back. Said out loud, because a balance that
                // dropped for nothing and quietly recovered is indistinguishable
                // from one that was never charged — and the user who watched
                // it drop deserves to know it was put right.
                Toaster.success(
                    `${formatTokens(data.refunded)} tokens returned`,
                    "The attempt that failed has been refunded. Rendering again now."
                );
            } else {
                Toaster.success("Rendering your design", "You can leave this page — we'll finish it.");
            }
            setGate(null);
            await load();
        } catch (err: unknown) {
            // 402 is a wall, not a failure: the design is fine, the wallet is
            // empty, and retrying it unchanged would only fail again. So the
            // button is replaced with the reason rather than a toast the user
            // can dismiss and press again.
            if (err instanceof HttpError && err.status === 402) {
                setGate(err.data?.reason === "tokens_exhausted" ? "tokens_exhausted" : "plan_locked");
            } else {
                Toaster.error("Couldn't start the render", "Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    }, [brandId, designId, submitting, load]);

    const status = designStatus(design);
    const effectiveGate = resolveDesignGate(gate, tokens.state);
    const aspect = designAspect(design);
    const frames = design?.previewFrames ?? [];
    const written = !!design?.projectPrefix;
    // Approving something you have not looked at is not approval. So until
    // there is something to have looked at, the second button offers the free
    // look rather than the paid render.
    const seen = hasBeenSeen(design);

    return (
        <AppLayout>
            <PageHeader
                title={design?.name || "Design"}
                subtitle={status.bad ? "Something went wrong" : status.detail}
                showBackButton
                mobileActions="all"
            />
            <ScrollView contentContainerStyle={styles.body}>
                <View style={[styles.stage, { aspectRatio: aspect }]}>
                    {design?.renderUrl ? (
                        <VideoSurface
                            source={{ uri: design.renderUrl }}
                            useNativeControls
                            isLooping
                            resizeMode={ResizeMode.CONTAIN}
                            usePoster={!!design.posterUrl}
                            posterSource={design.posterUrl ? { uri: design.posterUrl } : undefined}
                            style={styles.video}
                        />
                    ) : (
                        <View style={styles.stageEmpty}>
                            {isAuthoring(design) || isRendering(design) ? (
                                <ActivityIndicator color={colors.primary} />
                            ) : null}
                            <Text style={styles.stageEmptyText}>
                                {isAuthoring(design)
                                    ? "Writing…"
                                    : isRendering(design)
                                      ? "Rendering…"
                                      : "Nothing to show yet"}
                            </Text>
                        </View>
                    )}
                </View>

                {/* The filmstrip: what this design looks like, captured
                    without charging for it. It is shown even once a render
                    exists, because it is the cheap way to check a REWRITE
                    before paying to render it again. */}
                {frames.length > 0 && (
                    <>
                        <Text style={styles.label}>
                            {design?.renderUrl ? "Frames from the last preview" : "How it looks"}
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.strip}
                        >
                            {frames.map((f) => (
                                <View key={`${f.url}-${f.timeMs}`} style={styles.frameWrap}>
                                    <Image
                                        source={{ uri: f.url }}
                                        style={[styles.frame, { aspectRatio: aspect }]}
                                        resizeMode="cover"
                                        accessibilityLabel={`Frame at ${(f.timeMs / 1000).toFixed(1)} seconds`}
                                    />
                                    <Text style={styles.frameTime}>{(f.timeMs / 1000).toFixed(1)}s</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </>
                )}

                {/* The real reason goes in the body, not the header. A
                    validator message ("index.html has no root composition")
                    is the one thing that tells the user what to change, and a
                    one-line header subtitle truncates exactly that. */}
                {status.bad && (
                    <View style={styles.errorWrap}>
                        <View style={styles.errorAccent} />
                        <Text style={styles.errorText}>{status.detail}</Text>
                    </View>
                )}

                <Text style={styles.label}>What should this film be?</Text>
                <TextInput
                    value={brief}
                    onChangeText={(t) => {
                        briefRef.current = t;
                        setBrief(t);
                    }}
                    placeholder="A 10-second vertical reel for our cold brew: a hook, three benefits, a sign-off."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    style={styles.input}
                    editable={!isAuthoring(design)}
                />

                {/* Both actions spend from the same wallet — writing is a
                    frontier-model call, rendering is worker time — so the wall
                    replaces the whole row. Leaving either button up would
                    invite a press that can only come back 402. */}
                {effectiveGate === "tokens_exhausted" ? (
                    <UpgradeInline
                        message="You're out of AI tokens this month. Add a top-up to keep making designs."
                        ctaLabel="Add tokens"
                        feature="design_studio"
                        reason="tokens_exhausted"
                    />
                ) : effectiveGate === "plan_locked" ? (
                    <UpgradeInline
                        message="Design Studio is on the paid plans."
                        feature="design_studio"
                        reason="plan_locked"
                    />
                ) : (
                    <>
                        <View style={styles.actions}>
                            <Pressable
                                onPress={author}
                                disabled={submitting || isAuthoring(design)}
                                style={({ pressed }) => [
                                    styles.primaryBtn,
                                    (pressed || submitting || isAuthoring(design)) && styles.btnDim,
                                ]}
                                accessibilityRole="button"
                            >
                                <Text style={styles.primaryLabel}>
                                    {isAuthoring(design)
                                        ? "Writing…"
                                        : design?.projectPrefix
                                          ? "Rewrite with AI"
                                          : "Write with AI"}
                                </Text>
                            </Pressable>

                            {/* The second button is the free look until there
                                has been one. Rendering is the step that costs,
                                and approving a film you have not seen is not
                                approval — so the cheap step leads, and Render
                                appears once there is something to judge. */}
                            {!seen ? (
                                <Pressable
                                    onPress={preview}
                                    disabled={submitting || isPreviewing(design) || !written}
                                    style={({ pressed }) => [
                                        styles.secondaryBtn,
                                        (pressed || submitting || isPreviewing(design) || !written) &&
                                            styles.btnDim,
                                    ]}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.secondaryLabel}>
                                        {isPreviewing(design) ? "Looking…" : "Preview — free"}
                                    </Text>
                                </Pressable>
                            ) : (
                                <Pressable
                                    onPress={render}
                                    disabled={submitting || isRendering(design) || !written}
                                    style={({ pressed }) => [
                                        styles.secondaryBtn,
                                        (pressed || submitting || isRendering(design) || !written) &&
                                            styles.btnDim,
                                    ]}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.secondaryLabel}>
                                        {isRendering(design) ? "Rendering…" : "Render"}
                                    </Text>
                                </Pressable>
                            )}
                        </View>

                        {/* Once seen, the preview stays reachable: it is the
                            cheap way to check a REWRITE before paying to
                            render it again. */}
                        {seen && written && (
                            <Pressable
                                onPress={preview}
                                disabled={submitting || isPreviewing(design)}
                                style={({ pressed }) => [pressed && styles.btnDim]}
                                accessibilityRole="button"
                            >
                                <Text style={styles.linkAction}>
                                    {isPreviewing(design) ? "Taking frames…" : "Preview again — free"}
                                </Text>
                            </Pressable>
                        )}

                        {(tokens.state === "critical" || tokens.state === "low") && (
                            <Text style={styles.linkNote}>
                                Running low on AI tokens — writing and rendering spend from the
                                same wallet. Previewing does not.
                            </Text>
                        )}
                    </>
                )}

                {!!design?.contentId && (
                    <Text style={styles.linkNote}>
                        Linked to a post — the export lands on it.
                    </Text>
                )}
            </ScrollView>
        </AppLayout>
    );
};

export default DesignDetail;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                body: { padding: 16, gap: 14 },
                stage: {
                    width: "100%",
                    maxWidth: 420,
                    alignSelf: "center",
                    borderRadius: 16,
                    overflow: "hidden",
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 10,
                    shadowOpacity: 0.08,
                    elevation: 3,
                },
                video: { width: "100%", height: "100%" },
                stageEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
                stageEmptyText: { fontSize: fs(12), lineHeight: lh(18), color: colors.textSecondary },
                label: { fontSize: fs(13), lineHeight: lh(19), fontWeight: "600", color: colors.text },
                input: {
                    minHeight: 96,
                    borderRadius: 12,
                    padding: 12,
                    textAlignVertical: "top",
                    color: colors.text,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                errorWrap: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
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
                actions: { flexDirection: "row", gap: 10 },
                primaryBtn: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 13,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                primaryLabel: { fontSize: fs(14), lineHeight: lh(20), fontWeight: "700", color: colors.onPrimary },
                secondaryBtn: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 13,
                    borderRadius: 999,
                    backgroundColor: colors.tag,
                },
                secondaryLabel: { fontSize: fs(14), lineHeight: lh(20), fontWeight: "700", color: colors.text },
                btnDim: { opacity: 0.6 },
                strip: { gap: 8, paddingVertical: 2 },
                frameWrap: { alignItems: "center", gap: 4 },
                frame: {
                    width: 92,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                },
                frameTime: { fontSize: fs(10), lineHeight: lh(14), color: colors.textSecondary },
                linkAction: {
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    fontWeight: "600",
                    color: colors.primary,
                    textAlign: "center",
                },
                linkNote: { fontSize: fs(11), lineHeight: lh(16), color: colors.textSecondary, textAlign: "center" },
            }),
        [colors]
    );
}
