/**
 * DesignStage — the full-screen design canvas that takes over the content
 * detail's centre column. The AI authors the post as HTML/CSS; this renders it
 * in a WebView/iframe (WYSIWYG), lets the user tap an element to edit its text
 * (deterministic, via the frame's DOM) or pin a comment / AI directive, captures
 * the frame to a PNG/MP4 on "Render" (preview == export), and hands off to Canva.
 *
 * It is opened explicitly from the MediaStage (or auto-opened when the AI writes
 * a new design), and closed with the ✕ in its header — which returns the user to
 * the MediaStage where the caption, script and everything else lives. When there
 * is no design yet it shows a clean empty state pointing at the AI chat. Video
 * contents get a collapsible Soundtrack panel that slides up from the bottom.
 */
import { ContentType } from "@/components/content-calendar/types";
import { useBreakpoints } from "@/hooks";
import { useContentComments } from "@/hooks/use-content-comments";
import { IContentAudio, IContentDesignRef } from "@/shared-libs/firestore/trendly-pro/models/design";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Colors from "@/shared-uis/constants/Colors";
import {
    faChevronUp,
    faMusic,
    faWandMagicSparkles,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { DesignFrameHandle, FrameOutMsg } from "./bridge";
import DesignFrame from "./DesignFrame";
import SoundtrackPanel from "./SoundtrackPanel";
import { useSoundtrackPlayer } from "./use-audio-player";
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
    /** Close the Design Stage and return to the MediaStage view. */
    onClose: () => void;
    /** Open the AI chat (used by the empty state on mobile, where it's an overlay). */
    onOpenChat: () => void;
    readOnly?: boolean;
}

type Selected = { id: string; text: string } | null;

const fmtTime = (ms: number) => `${(Math.max(ms, 0) / 1000).toFixed(1)}s`;

const DesignStage: React.FC<DesignStageProps> = (props) => {
    const { contentId, brandId, designRef, isVideo, readOnly, onClose, onOpenChat } = props;
    const theme = useTheme();
    const colors = Colors(theme);
    const { width, xl } = useBreakpoints();
    const styles = useStyles(colors);

    const { revision, history, addRevision, setRenders, setVideoRender, revertTo } = useContentDesign(contentId, designRef);
    const { addComment } = useContentComments(contentId);
    // Video-synced audio: plays the music bed + voiceover in step with the video
    // preview so "play" reflects the final mix (music ducked under the voice).
    const player = useSoundtrackPlayer(props.audio);

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
    // Soundtrack starts collapsed — the user opens it on demand.
    const [musicOpen, setMusicOpen] = useState(false);

    const html = revision?.html ?? "";
    const w = revision?.width ?? designRef?.width ?? 1080;
    const h = revision?.height ?? designRef?.height ?? 1350;
    const docType = revision?.docType ?? designRef?.docType ?? "image";
    const isVideoDesign = docType === "video";
    const slideCount = Math.max(revision?.slideCount ?? designRef?.slideCount ?? 1, 1);
    const hasDesign = !!html;
    const displayWidth = Math.min(width - 32, 340);
    const progress = durMs > 0 ? Math.min(curMs / durMs, 1) : 0;

    // Short summary of what audio is attached — shown on the collapsed trigger.
    const audioSummary = useMemo(() => {
        const parts: string[] = [];
        if (props.audio?.musicUrl) parts.push(props.audio.musicTitle || "Music");
        if (props.audio?.voiceoverUrl) parts.push("Voiceover");
        return parts.join(" · ");
    }, [props.audio?.musicUrl, props.audio?.musicTitle, props.audio?.voiceoverUrl]);

    const goToSlide = (i: number) => {
        const clamped = Math.max(0, Math.min(i, slideCount - 1));
        setSlide(clamped);
        frameRef.current?.showSlide(clamped, w);
    };

    const onMessage = (msg: FrameOutMsg) => {
        if (msg.type === "ready") {
            if (isVideoDesign) frameRef.current?.seek(0);
        } else if (msg.type === "time") {
            setCurMs(msg.ms);
            setDurMs(msg.duration);
        } else if (msg.type === "ended") {
            setPlaying(false);
            void player.pause();
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
            addRevision(msg.html, w, h, slideCount, docType, "text", revision?.id);
        } else if (msg.type === "renderSlides") {
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
            void player.pause();
            setPlaying(false);
        } else {
            const from = progress >= 1 ? 0 : curMs;
            if (progress >= 1) frameRef.current?.seek(0);
            frameRef.current?.play();
            void player.playFrom(from);
            setPlaying(true);
        }
    };

    const seekToFraction = (frac: number) => {
        if (durMs <= 0) return;
        const clamped = Math.max(0, Math.min(frac, 1));
        const ms = Math.round(clamped * durMs);
        setPlaying(false);
        frameRef.current?.seek(ms);
        void player.seek(ms);
    };

    const saveRender = () => {
        if (!hasDesign) return;
        if (isVideoDesign) {
            if (Platform.OS !== "web") {
                setVideoNote("Video render is available on web for now.");
                return;
            }
            frameRef.current?.pause();
            void player.pause();
            setPlaying(false);
            setCapturing(true);
            setVideoNote("Rendering video…");
            const a = props.audio;
            frameRef.current?.captureVideo(24, a
                ? {
                      musicUrl: a.musicUrl,
                      voiceoverUrl: a.voiceoverUrl,
                      musicVolume: a.musicVolume,
                      voiceoverVolume: a.voiceoverVolume,
                      duckMusic: a.duckMusic,
                  }
                : undefined);
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

    const renderTitle = isVideoDesign ? "Render video" : slideCount > 1 ? "Render slides" : "Render";

    return (
        <View style={styles.container}>
            {/* Header — close (✕) on the left, primary Render on the right. */}
            <View style={styles.header}>
                <Pressable
                    style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close the Design Stage"
                    hitSlop={8}
                >
                    <FontAwesomeIcon icon={faXmark} size={16} color={colors.text} />
                </Pressable>
                <Text style={styles.title}>Design Studio</Text>
                <View style={styles.headerActions}>
                    {hasDesign && history.length > 1 && !readOnly ? (
                        <Pressable onPress={() => revertTo(history[1].id)} style={styles.secondaryBtn}>
                            <Text style={styles.secondaryBtnText}>Revert</Text>
                        </Pressable>
                    ) : null}
                    {hasDesign && !readOnly ? (
                        <Pressable
                            onPress={saveRender}
                            style={({ pressed }) => [styles.renderBtn, pressed && styles.pressed]}
                            disabled={capturing}
                        >
                            {capturing ? (
                                <ActivityIndicator size="small" color={colors.onPrimary} />
                            ) : (
                                <Text style={styles.renderBtnText}>{renderTitle}</Text>
                            )}
                        </Pressable>
                    ) : null}
                </View>
            </View>

            {/* Body — canvas when there's a design, else a clean empty state. */}
            <View style={styles.body}>
                {hasDesign ? (
                    <ScrollView
                        contentContainerStyle={styles.canvasScroll}
                        showsVerticalScrollIndicator={false}
                    >
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
                                    <Text style={styles.hint}>
                                        Tap text to edit. Pin a comment on anything and the AI applies it.
                                    </Text>
                                </View>
                            ) : null}

                            {!readOnly ? (
                                <Pressable style={styles.canvaBtn} onPress={designInCanva}>
                                    <Text style={styles.canvaBtnText}>Deep-edit in Canva</Text>
                                </Pressable>
                            ) : null}
                        </View>
                    </ScrollView>
                ) : (
                    <View style={styles.empty}>
                        <View style={styles.emptyIcon}>
                            <FontAwesomeIcon icon={faWandMagicSparkles} size={26} color={colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>Let's design this together</Text>
                        <Text style={styles.emptySub}>
                            {xl
                                ? "Describe what you want in the AI chat on the right and I'll generate an editable design right here."
                                : "Tell the AI what you want and I'll generate an editable design right here."}
                        </Text>
                        {!xl ? (
                            <Pressable
                                style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
                                onPress={onOpenChat}
                            >
                                <Text style={styles.emptyCtaText}>Talk to the AI</Text>
                            </Pressable>
                        ) : null}
                    </View>
                )}
            </View>

            {/* Soundtrack — collapsed trigger + bottom panel (video only). */}
            {isVideo && !musicOpen ? (
                <Pressable
                    style={({ pressed }) => [styles.musicTrigger, pressed && styles.pressed]}
                    onPress={() => setMusicOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Add music and voiceover"
                >
                    <View style={styles.musicIcon}>
                        <FontAwesomeIcon icon={faMusic} size={14} color={colors.primary} />
                    </View>
                    <View style={styles.musicTriggerBody}>
                        <Text style={styles.musicTriggerTitle}>
                            {audioSummary ? "Soundtrack" : "Add music & voiceover"}
                        </Text>
                        {audioSummary ? (
                            <Text style={styles.musicTriggerSub} numberOfLines={1}>
                                {audioSummary}
                            </Text>
                        ) : null}
                    </View>
                    <FontAwesomeIcon icon={faChevronUp} size={13} color={colors.textSecondary} />
                </Pressable>
            ) : null}

            {isVideo && musicOpen ? (
                <View style={styles.musicSheet}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <SoundtrackPanel
                            brandId={brandId}
                            voiceoverSource={props.voiceoverSource}
                            audio={props.audio}
                            onAudioChange={props.onAudioChange}
                            readOnly={readOnly}
                            onClose={() => setMusicOpen(false)}
                        />
                    </ScrollView>
                </View>
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
                                    <Pressable style={styles.modalSecondaryBtn} onPress={addPlainComment}>
                                        <Text style={styles.modalSecondaryBtnText}>Comment</Text>
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
                container: {
                    // Full-area surface (not a card): fills the whole centre column
                    // and sits on the app background so the header/soundtrack read as
                    // real toolbars rather than a floating card.
                    flex: 1,
                    backgroundColor: colors.background,
                    overflow: "hidden",
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.06,
                    elevation: 3,
                    backgroundColor: colors.card,
                    zIndex: 2,
                },
                closeBtn: {
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                title: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.text },
                headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
                secondaryBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.tag },
                secondaryBtnText: { fontSize: 13, color: colors.text },
                renderBtn: {
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 9,
                    backgroundColor: colors.primary,
                    minWidth: 84,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                renderBtnText: { fontSize: 13, fontWeight: "700", color: colors.onPrimary },

                body: { flex: 1 },
                canvasScroll: { alignItems: "center", padding: 16, gap: 12 },
                canvasWrap: { alignItems: "center", gap: 12 },

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
                playIcon: { color: colors.onPrimary, fontSize: 13 },
                track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.tag, overflow: "hidden" },
                trackFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
                time: { fontSize: 12, color: colors.textSecondary, minWidth: 64, textAlign: "right" },
                videoNote: { fontSize: 12, color: colors.textSecondary },

                actionBar: {
                    alignSelf: "stretch",
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

                canvaBtn: {
                    alignSelf: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                },
                canvaBtnText: { color: colors.text, fontSize: 14 },

                // Empty state
                empty: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 28,
                    gap: 12,
                },
                emptyIcon: {
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.aliceBlue,
                },
                emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
                emptySub: {
                    fontSize: 13,
                    lineHeight: 20,
                    color: colors.textSecondary,
                    textAlign: "center",
                    maxWidth: 320,
                },
                emptyCta: {
                    marginTop: 4,
                    paddingHorizontal: 18,
                    paddingVertical: 11,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                emptyCtaText: { color: colors.onPrimary, fontSize: 14, fontWeight: "700" },

                // Soundtrack collapsed trigger
                musicTrigger: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.06,
                    elevation: 4,
                },
                musicIcon: {
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.aliceBlue,
                },
                musicTriggerBody: { flex: 1, gap: 2 },
                musicTriggerTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
                musicTriggerSub: { fontSize: 12, color: colors.textSecondary },

                // Soundtrack expanded bottom panel — narrows the design above it.
                musicSheet: {
                    maxHeight: "62%",
                    backgroundColor: colors.card,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    paddingTop: 6,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -6 },
                    shadowRadius: 16,
                    shadowOpacity: 0.1,
                    elevation: 8,
                },

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
                modalSecondaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.tag },
                modalSecondaryBtnText: { color: colors.text, fontSize: 14 },
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
                primaryBtnText: { color: colors.onPrimary, fontSize: 14, fontWeight: "600" },
                pressed: { opacity: 0.72 },
            }),
        [colors]
    );

export default DesignStage;
