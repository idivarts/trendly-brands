/**
 * DesignStage — the HTML-design MediaStage. The AI authors the post as HTML/CSS;
 * this renders it in a WebView/iframe (WYSIWYG), lets the user tap an element to
 * edit its text (deterministic, via the frame's DOM) or pin a comment / AI
 * directive, captures the frame to a PNG on "Save render" (preview == export),
 * and hands off to Canva. Falls back to the legacy upload/generate gallery when
 * there is no design yet. Video contents also get the audio panel.
 */
import { ContentType } from "@/components/content-calendar/types";
import { useContentComments } from "@/hooks/use-content-comments";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { IContentAudio, IContentDesignRef } from "@/shared-libs/firestore/trendly-pro/models/design";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import MediaStage from "../MediaStage";
import AudioPanel from "../media-stage/AudioPanel";
import { DesignFrameHandle, FrameOutMsg } from "./bridge";
import DesignFrame from "./DesignFrame";
import { useContentDesign } from "./use-content-design";

interface DesignStageProps {
    contentId: string;
    brandId: string;
    contentType: ContentType;
    isVideo: boolean;
    designRef?: IContentDesignRef;
    voiceoverSource: string;
    audio?: IContentAudio;
    onAudioChange: (audio: IContentAudio) => void;
    onSendToChat: (text: string) => void;
    readOnly?: boolean;

    // Legacy gallery pass-through (no design yet).
    attachments: Attachment[];
    onAttachmentsChange: (next: Attachment[]) => void;
    imagePrompt: string;
    onImagePromptChange: (v: string) => void;
    onGenerateImage: (prompt?: string, focusedSlideIndex?: number, model?: string) => void;
    isGeneratingImage: boolean;
    generationError?: string | null;
}

type Selected = { id: string; text: string } | null;

const fmtTime = (ms: number) => `${(Math.max(ms, 0) / 1000).toFixed(1)}s`;

const DesignStage: React.FC<DesignStageProps> = (props) => {
    const { contentId, brandId, designRef, isVideo, readOnly } = props;
    const theme = useTheme();
    const colors = Colors(theme);
    const { width } = useBreakpoints();
    const styles = useStyles(colors);

    const { revision, history, addRevision, setRenders, setVideoRender, revertTo } = useContentDesign(contentId, designRef);
    const { addComment } = useContentComments(contentId);

    const frameRef = useRef<DesignFrameHandle>(null);
    const [selected, setSelected] = useState<Selected>(null);
    const [modalOpen, setModalOpen] = useState<null | "edit" | "comment">(null);
    const [modalText, setModalText] = useState("");
    const [capturing, setCapturing] = useState(false);
    const [slide, setSlide] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [curMs, setCurMs] = useState(0);
    const [durMs, setDurMs] = useState(0);
    const [trackW, setTrackW] = useState(1);
    const [videoNote, setVideoNote] = useState<string | null>(null);

    const html = revision?.html ?? "";
    const w = revision?.width ?? designRef?.width ?? 1080;
    const h = revision?.height ?? designRef?.height ?? 1350;
    const docType = revision?.docType ?? designRef?.docType ?? "image";
    const isVideoDesign = docType === "video";
    const slideCount = Math.max(revision?.slideCount ?? designRef?.slideCount ?? 1, 1);
    const hasDesign = !!html;
    const displayWidth = Math.min(width - 32, 340);
    const progress = durMs > 0 ? Math.min(curMs / durMs, 1) : 0;

    const goToSlide = (i: number) => {
        const clamped = Math.max(0, Math.min(i, slideCount - 1));
        setSlide(clamped);
        frameRef.current?.showSlide(clamped, w);
    };

    const onMessage = (msg: FrameOutMsg) => {
        if (msg.type === "ready") {
            // Video: pause at frame 0 so the user controls playback via the scrubber.
            if (isVideoDesign) frameRef.current?.seek(0);
        } else if (msg.type === "time") {
            setCurMs(msg.ms);
            setDurMs(msg.duration);
        } else if (msg.type === "ended") {
            setPlaying(false);
        } else if (msg.type === "renderProgress") {
            setVideoNote(`Rendering video… ${msg.frame}/${msg.total}`);
        } else if (msg.type === "renderVideo") {
            uploadVideo(msg.blob)
                .then((url) => revision && setVideoRender(revision.id, url))
                .then(() => setVideoNote("Video saved."))
                .catch(() => setVideoNote("Couldn't save the video. Try again."))
                .finally(() => setCapturing(false));
        } else if (msg.type === "tap") {
            setSelected({ id: msg.id, text: msg.text });
        } else if (msg.type === "html") {
            // A deterministic text edit returned the new full HTML → new revision.
            addRevision(msg.html, w, h, slideCount, docType, "text", revision?.id);
        } else if (msg.type === "renderSlides") {
            // Upload each slide with a UNIQUE filename. These run concurrently, so
            // deriving the name from Date.now() alone collides (same ms → same S3
            // key → slides overwrite each other) — include the slide index + a
            // random suffix so every slide lands on its own object.
            Promise.all(msg.dataUrls.map((d, i) => uploadPng(d, i)))
                .then((urls) => revision && setRenders(revision.id, urls))
                .finally(() => setCapturing(false));
        } else if (msg.type === "render") {
            uploadPng(msg.dataUrl, 0)
                .then((url) => revision && setRenders(revision.id, [url]))
                .finally(() => setCapturing(false));
        } else if (msg.type === "error") {
            setCapturing(false);
            if (isVideoDesign) setVideoNote("Video render failed — this browser may not support WebCodecs.");
        }
    };

    const uploadPng = async (dataUrl: string, index: number): Promise<string> => {
        const rand = Math.random().toString(36).slice(2, 8);
        const filename = `design_${Date.now()}_s${index}_${rand}.png`;
        const res = await HttpWrapper.fetch(`/s3/v1/attachments?filename=${encodeURIComponent(filename)}`, {
            method: "POST",
        });
        const { uploadUrl, attachmentUrl } = await res.json();
        const blob = await (await fetch(dataUrl)).blob();
        await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body: blob });
        return attachmentUrl as string;
    };

    const uploadVideo = async (blob: Blob): Promise<string> => {
        const rand = Math.random().toString(36).slice(2, 8);
        const filename = `design_${Date.now()}_${rand}.mp4`;
        const res = await HttpWrapper.fetch(`/s3/v1/attachments?filename=${encodeURIComponent(filename)}`, {
            method: "POST",
        });
        const { uploadUrl, attachmentUrl } = await res.json();
        await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: blob });
        return attachmentUrl as string;
    };

    const togglePlay = () => {
        if (playing) {
            frameRef.current?.pause();
            setPlaying(false);
        } else {
            if (progress >= 1) frameRef.current?.seek(0);
            frameRef.current?.play();
            setPlaying(true);
        }
    };

    // Tap-to-seek on the scrubber track (track is `displayWidth` wide).
    const seekToFraction = (frac: number) => {
        if (durMs <= 0) return;
        const clamped = Math.max(0, Math.min(frac, 1));
        setPlaying(false);
        frameRef.current?.seek(Math.round(clamped * durMs));
    };

    const saveRender = () => {
        if (!hasDesign) return;
        if (isVideoDesign) {
            if (Platform.OS !== "web") {
                setVideoNote("Video render is available on web for now.");
                return;
            }
            // Client-side MP4 encode (WebCodecs). Pause playback first so the
            // capture loop controls the animation timeline.
            frameRef.current?.pause();
            setPlaying(false);
            setCapturing(true);
            setVideoNote("Rendering video…");
            frameRef.current?.captureVideo(24, durMs || designRef?.durationMs || 6000);
            return;
        }
        setCapturing(true);
        frameRef.current?.captureAll(slideCount);
    };

    const openEdit = () => {
        setModalText(selected?.text ?? "");
        setModalOpen("edit");
    };
    const openComment = () => {
        setModalText("");
        setModalOpen("comment");
    };
    const close = () => {
        setModalOpen(null);
        setModalText("");
    };

    const saveTextEdit = () => {
        if (selected) frameRef.current?.setText(selected.id, modalText);
        close();
    };

    const addPlainComment = async () => {
        if (!modalText.trim() || !selected) return;
        await addComment(modalText, { mediaAnchor: { elementId: selected.id, label: "element" } });
        close();
    };
    const askAI = async () => {
        if (!modalText.trim() || !selected) return;
        await addComment(modalText, { mediaAnchor: { elementId: selected.id, label: "element" }, isDirective: true });
        props.onSendToChat(`On the element "${selected.id}": ${modalText}`);
        close();
    };

    const designInCanva = async () => {
        try {
            const res = await HttpWrapper.fetch(
                `/api/integrations/canva/brands/${brandId}/contents/${contentId}/design`,
                { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }
            );
            const data = await res.json();
            if (data.editUrl) props.onSendToChat(`Opening this design in Canva: ${data.editUrl}`);
        } catch {
            props.onSendToChat("Connect Canva in Settings → Connected accounts to deep-edit this design.");
        }
    };

    return (
        <View style={styles.container}>
            {hasDesign ? (
                <>
                    <View style={styles.header}>
                        <Text style={styles.title}>Studio</Text>
                        <View style={styles.headerActions}>
                            {history.length > 1 && !readOnly ? (
                                <Pressable onPress={() => revertTo(history[1].id)} style={styles.headerBtn}>
                                    <Text style={styles.headerBtnText}>Revert</Text>
                                </Pressable>
                            ) : null}
                            {!readOnly ? (
                                <Pressable onPress={saveRender} style={styles.headerBtn} disabled={capturing}>
                                    {capturing ? (
                                        <ActivityIndicator size="small" color={colors.text} />
                                    ) : (
                                        <Text style={styles.headerBtnText}>Save render</Text>
                                    )}
                                </Pressable>
                            ) : null}
                        </View>
                    </View>

                    <View style={styles.canvasWrap}>
                        <DesignFrame
                            ref={frameRef}
                            html={html}
                            width={w}
                            height={h}
                            displayWidth={displayWidth}
                            onMessage={onMessage}
                        />
                        {isVideoDesign ? (
                            <View style={[styles.videoBar, { width: displayWidth }]}>
                                <Pressable style={styles.playBtn} onPress={togglePlay}>
                                    <Text style={styles.playIcon}>{playing ? "❚❚" : "▶"}</Text>
                                </Pressable>
                                <Pressable
                                    style={styles.track}
                                    onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
                                    onPress={(e) => seekToFraction(e.nativeEvent.locationX / Math.max(trackW, 1))}
                                >
                                    <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
                                </Pressable>
                                <Text style={styles.time}>
                                    {fmtTime(curMs)} / {fmtTime(durMs)}
                                </Text>
                            </View>
                        ) : slideCount > 1 ? (
                            <View style={styles.slideNav}>
                                <Pressable style={styles.slideArrow} onPress={() => goToSlide(slide - 1)}>
                                    <Text style={styles.slideArrowText}>‹</Text>
                                </Pressable>
                                <View style={styles.dots}>
                                    {Array.from({ length: slideCount }).map((_, i) => (
                                        <Pressable key={i} onPress={() => goToSlide(i)} hitSlop={8}>
                                            <View style={[styles.dot, i === slide && styles.dotActive]} />
                                        </Pressable>
                                    ))}
                                </View>
                                <Pressable style={styles.slideArrow} onPress={() => goToSlide(slide + 1)}>
                                    <Text style={styles.slideArrowText}>›</Text>
                                </Pressable>
                            </View>
                        ) : null}
                        {videoNote ? <Text style={styles.videoNote}>{videoNote}</Text> : null}
                    </View>

                    {selected && !readOnly ? (
                        <View style={styles.actionBar}>
                            <Text style={styles.actionLabel}>Selected: {selected.id}</Text>
                            <View style={styles.actionBtns}>
                                <Pressable style={styles.action} onPress={openEdit}>
                                    <Text style={styles.actionText}>Edit text</Text>
                                </Pressable>
                                <Pressable style={styles.action} onPress={openComment}>
                                    <Text style={styles.actionText}>Comment / Ask AI</Text>
                                </Pressable>
                            </View>
                            <Text style={styles.hint}>Tap text to edit. Pin a comment on anything and the AI applies it.</Text>
                        </View>
                    ) : null}
                </>
            ) : (
                <>
                    <MediaStage
                        contentType={props.contentType}
                        attachments={props.attachments}
                        onAttachmentsChange={props.onAttachmentsChange}
                        imagePrompt={props.imagePrompt}
                        onImagePromptChange={props.onImagePromptChange}
                        onGenerateImage={props.onGenerateImage}
                        isGeneratingImage={props.isGeneratingImage}
                        generationError={props.generationError}
                        readOnly={readOnly}
                    />
                    {!readOnly ? (
                        <Pressable
                            style={styles.designCta}
                            onPress={() =>
                                props.onSendToChat(
                                    "Design an on-brand post for this content (headline + visual + logo) as HTML that I can edit."
                                )
                            }
                        >
                            <Text style={styles.designCtaText}>Design with AI</Text>
                        </Pressable>
                    ) : null}
                </>
            )}

            {isVideo ? (
                <AudioPanel
                    brandId={brandId}
                    voiceoverSource={props.voiceoverSource}
                    audio={props.audio}
                    onAudioChange={props.onAudioChange}
                    readOnly={readOnly}
                />
            ) : null}

            {hasDesign && !readOnly ? (
                <Pressable style={styles.canvaBtn} onPress={designInCanva}>
                    <Text style={styles.canvaBtnText}>Deep-edit in Canva</Text>
                </Pressable>
            ) : null}

            <Modal visible={modalOpen !== null} transparent animationType="fade" onRequestClose={close}>
                <Pressable style={styles.backdrop} onPress={close}>
                    <Pressable style={styles.sheet} onPress={() => {}}>
                        <Text style={styles.sheetTitle}>
                            {modalOpen === "edit" ? "Edit text" : "Comment"}
                        </Text>
                        <TextInput
                            style={styles.sheetInput}
                            value={modalText}
                            onChangeText={setModalText}
                            placeholder={
                                modalOpen === "edit"
                                    ? "Type the new text"
                                    : "e.g. move this to the bottom and make it bigger"
                            }
                            placeholderTextColor={colors.textSecondary}
                            multiline={modalOpen === "comment"}
                            autoFocus
                        />
                        <View style={styles.sheetBtns}>
                            {modalOpen === "edit" ? (
                                <Pressable style={styles.primaryBtn} onPress={saveTextEdit}>
                                    <Text style={styles.primaryBtnText}>Save</Text>
                                </Pressable>
                            ) : (
                                <>
                                    <Pressable style={styles.secondaryBtn} onPress={addPlainComment}>
                                        <Text style={styles.secondaryBtnText}>Comment</Text>
                                    </Pressable>
                                    <Pressable style={styles.primaryBtn} onPress={askAI}>
                                        <Text style={styles.primaryBtnText}>Ask AI to apply</Text>
                                    </Pressable>
                                </>
                            )}
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const useStyles = (colors: any) =>
    useMemo(
        () =>
            StyleSheet.create({
                container: { gap: 12 },
                header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
                title: { fontSize: 16, fontWeight: "600", color: colors.text },
                headerActions: { flexDirection: "row", gap: 8 },
                headerBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.tag },
                headerBtnText: { fontSize: 13, color: colors.text },
                canvasWrap: { alignItems: "center", gap: 10 },
                slideNav: { flexDirection: "row", alignItems: "center", gap: 12 },
                slideArrow: {
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                slideArrowText: { fontSize: 18, color: colors.text, lineHeight: 20 },
                dots: { flexDirection: "row", alignItems: "center", gap: 6 },
                dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.tag },
                dotActive: { backgroundColor: colors.primary, width: 20 },
                videoBar: { flexDirection: "row", alignItems: "center", gap: 10 },
                playBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                playIcon: { color: "#fff", fontSize: 13 },
                track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.tag, overflow: "hidden" },
                trackFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
                time: { fontSize: 12, color: colors.textSecondary, minWidth: 64, textAlign: "right" },
                videoNote: { fontSize: 12, color: colors.textSecondary },
                actionBar: {
                    borderRadius: 12,
                    backgroundColor: colors.card,
                    padding: 12,
                    gap: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                actionLabel: { fontSize: 13, color: colors.textSecondary },
                actionBtns: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
                action: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.tag },
                actionText: { fontSize: 14, color: colors.text },
                hint: { fontSize: 12, color: colors.textSecondary },
                designCta: {
                    alignSelf: "flex-start",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                designCtaText: { color: "#fff", fontSize: 14, fontWeight: "600" },
                canvaBtn: {
                    alignSelf: "flex-start",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                },
                canvaBtnText: { color: colors.text, fontSize: 14 },
                backdrop: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                },
                sheet: { width: "100%", maxWidth: 420, borderRadius: 16, backgroundColor: colors.card, padding: 16, gap: 12 },
                sheetTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
                sheetInput: {
                    minHeight: 44,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.text,
                    backgroundColor: colors.tag,
                },
                sheetBtns: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
                secondaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.tag },
                secondaryBtnText: { color: colors.text, fontSize: 14 },
                primaryBtn: {
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
            }),
        [colors]
    );

export default DesignStage;
