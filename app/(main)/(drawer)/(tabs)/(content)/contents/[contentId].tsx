import CreateCollabFromContentModal, { CollabContentSource } from "@/components/collaborations/CreateCollabFromContentModal";
import { CONTENT_TYPE_LABELS, ContentType } from "@/components/content-calendar/types";
import ContentCommentsPanel from "@/components/contents/ContentCommentsPanel";
import FloatingPromptInput from "@/components/shared/FloatingPromptInput";
import { MEDIA_SPEC } from "@/components/contents/detail/media-spec";
import MediaStage from "@/components/contents/detail/MediaStage";
import PreviewPanel from "@/components/contents/detail/PreviewPanel";
import ContentInfoModal from "@/components/contents/detail/ContentInfoModal";
import PostingSummary from "@/components/contents/detail/PostingSummary";
import PublishModal from "@/components/contents/detail/PublishModal";
import ScriptEditor from "@/components/contents/detail/ScriptEditor";
import { MOCK_CONTENT_ITEMS } from "@/components/contents/mock-data";
import {
    CONTENT_STATUS_LABELS,
    ContentStatus,
    ScheduleMode,
    SocialDestination,
    contentStatusColors,
} from "@/components/contents/types";
import DatePickerModal, {
    formatDateForWebInput,
} from "@/components/modals/DatePickerModal";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import AIChatPanel, { FocusItem } from "@/components/shared/AIChatPanel";
import { PanelComment } from "@/components/shared/CommentsPanel";
import RightSidePanel, { RightPanelMode } from "@/components/shared/RightSidePanel";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { useBreakpoints } from "@/hooks";
import { useAIGenerate } from "@/hooks/use-ai-generate";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBrandSocialContext } from "@/contexts/brand-social-context.provider";
import { useContents } from "@/hooks/use-contents";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCheck,
    faCircleInfo,
    faCommentDots,
    faEye,
    faHandshake,
    faMagicWandSparkles,
    faPaperPlane,
    faRobot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
} from "react-native";

// ─── Main Screen ─────────────────────────────────────────────────────────────

const CreateContentScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const { contentId, title: paramTitle, idea: paramIdea, type: paramType, date: paramDate } =
        useLocalSearchParams<{
            contentId: string;
            title?: string;
            idea?: string;
            type?: string;
            date?: string;
        }>();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const { items, updateContent } = useContents();
    const { socialAccounts } = useBrandSocialContext();
    const { selectedBrand } = useBrandContext();

    // Resolve the live item from the real contents list first; fall back to
    // mock data so demo/test contentIds still work in dev.
    const seedItem = useMemo(
        () =>
            items.find((i) => i.id === contentId) ??
            MOCK_CONTENT_ITEMS.find((i) => i.id === contentId) ??
            null,
        [items, contentId]
    );

    const [title, setTitle] = useState(seedItem?.title ?? paramTitle ?? "");
    const [idea, setIdea] = useState(seedItem?.idea ?? paramIdea ?? "");
    const [date, setDate] = useState<Date>(
        seedItem?.date
            ? new Date(seedItem.date + "T00:00:00")
            : paramDate
                ? new Date(paramDate + "T00:00:00")
                : new Date()
    );
    const [status, setStatus] = useState<ContentStatus>(seedItem?.status ?? "draft");
    const [caption, setCaption] = useState(seedItem?.caption ?? "");
    const [hashtags, setHashtags] = useState(seedItem?.hashtags ?? "");
    const [script, setScript] = useState(seedItem?.script ?? "");
    const [imagePrompt, setImagePrompt] = useState(seedItem?.imagePrompt ?? "");
    const [attachments, setAttachments] = useState<Attachment[]>(seedItem?.attachments ?? []);
    const [destinations, setDestinations] = useState<SocialDestination[]>(seedItem?.destinations ?? []);
    const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(seedItem?.scheduleMode ?? "scheduled");
    const [publishing, setPublishing] = useState(false);
    const [scriptAiPrompt, setScriptAiPrompt] = useState("");
    const [timeOfPosting, setTimeOfPosting] = useState(seedItem?.timeOfPosting ?? "");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCollabModal, setShowCollabModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);

    // Firestore items arrive after first render. Hydrate local form state the
    // first time the real item shows up for this contentId. Tracked per-id so
    // navigating to a different content reseeds the form, but subsequent edits
    // on the same id aren't clobbered by snapshot replays.
    const hydratedForRef = useRef<string | null>(null);
    useEffect(() => {
        if (!seedItem) return;
        if (hydratedForRef.current === seedItem.id) return;
        hydratedForRef.current = seedItem.id;

        setTitle(seedItem.title ?? "");
        setIdea(seedItem.idea ?? "");
        setStatus(seedItem.status ?? "draft");
        setCaption(seedItem.caption ?? "");
        setHashtags(seedItem.hashtags ?? "");
        setScript(seedItem.script ?? "");
        setImagePrompt(seedItem.imagePrompt ?? "");
        setAttachments(seedItem.attachments ?? []);
        setDestinations(seedItem.destinations ?? []);
        setScheduleMode(seedItem.scheduleMode ?? "scheduled");
        setTimeOfPosting(seedItem.timeOfPosting ?? "");
        if (seedItem.date) {
            setDate(new Date(seedItem.date + "T00:00:00"));
        }
        // Freshly hydrated state is "clean" — skip the next dirty-watch tick.
        skipDirtyRef.current = true;
        setDirty(false);
    }, [seedItem]);

    // ── Unsaved-changes (dirty) tracking ─────────────────────────────────────
    const [dirty, setDirty] = useState(false);
    const skipDirtyRef = useRef(true);
    useEffect(() => {
        if (skipDirtyRef.current) {
            skipDirtyRef.current = false;
            return;
        }
        setDirty(true);
    }, [title, idea, caption, hashtags, script, imagePrompt, status, timeOfPosting, attachments, destinations, scheduleMode, date]);

    // ── Right side panel (comments + AI chat) ────────────────────────────────
    const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>("none");
    const [chatFocusItems, setChatFocusItems] = useState<FocusItem[]>([]);

    const handleSendToChat = useCallback((text: string) => {
        const label = text.length > 120 ? text.slice(0, 120) + "…" : text;
        setChatFocusItems((prev) => [...prev, { id: `focus-${Date.now()}`, label }]);
        setRightPanelMode("chat");
    }, []);

    // "Send to AI" on a comment: focus its text in the chat (opens the panel).
    const handleCommentToChat = useCallback(
        (comment: PanelComment) => handleSendToChat(comment.text),
        [handleSendToChat]
    );

    const [magicTarget, setMagicTarget] = useState<"caption" | "hashtags" | null>(null);
    const [magicGenerating, setMagicGenerating] = useState(false);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const contentType = (seedItem?.type ?? paramType ?? "post") as ContentType;
    const isReel = contentType === "reel";
    const mediaSpec = MEDIA_SPEC[contentType];

    const collabSource: CollabContentSource = {
        contentId: contentId ?? `content-${Date.now()}`,
        title,
        idea,
        type: contentType,
        date: formatDateForWebInput(date),
    };
    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Real AI generation hooks — backed by /api/ai + OpenRouter.
    const {
        captions: aiCaptions,
        generateCaption,
        hashtags: aiHashtags,
        generateHashtags,
        script: aiScript,
        scriptStreaming,
        generateScript,
        images: aiImages,
        imagesStreaming,
        generateImage,
    } = useAIGenerate();

    const handleSave = useCallback(async () => {
        if (!contentId || saveState === "saving") return;
        setSaveState("saving");
        await updateContent(contentId, {
            title,
            description: idea,
            status: status as any,
            caption,
            hashtags,
            timeOfPosting,
            script,
            imagePrompt,
            attachments,
            postingTimeStamp: date ? new Date(date.toISOString().split("T")[0] + "T00:00:00Z").getTime() : undefined,
        });
        setDirty(false);
        setSaveState("saved");
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setSaveState("idle"), 2000);
    }, [contentId, saveState, updateContent, title, idea, status, caption, hashtags, timeOfPosting, script, imagePrompt, attachments, date]);

    // Publish now / schedule. Persists the latest edits + destinations to
    // Firestore so the backend reads fresh data, then calls the publish /
    // schedule endpoint (functions/trendly_v2 → internal/trendlyapis/publishing).
    const handlePublish = useCallback(async () => {
        if (!contentId || publishing || destinations.length === 0) return;
        const brandId = selectedBrand?.id;
        if (!brandId) return;
        setPublishing(true);

        // Derive the precise publish epoch: "now" → current time; otherwise the
        // selected date combined with the chosen HH:MM (defaulting to 09:00).
        let scheduledAt = Date.now();
        if (scheduleMode === "scheduled") {
            const d = new Date(date);
            if (/^\d{1,2}:\d{2}$/.test(timeOfPosting)) {
                const [hh, mm] = timeOfPosting.split(":").map(Number);
                d.setHours(hh, mm, 0, 0);
            } else {
                d.setHours(9, 0, 0, 0);
            }
            scheduledAt = d.getTime();
        }

        try {
            // 1. Persist current state so the backend publishes the latest content.
            await updateContent(contentId, {
                title,
                description: idea,
                caption,
                hashtags,
                script,
                imagePrompt,
                attachments,
                timeOfPosting,
                destinations,
                scheduleMode,
                scheduledAt,
                postingTimeStamp: new Date(date.toISOString().split("T")[0] + "T00:00:00Z").getTime(),
            });

            // 2. Trigger publish-now or schedule on the backend.
            if (scheduleMode === "now") {
                const res = await HttpWrapper.fetch(
                    `/api/v2/brands/${brandId}/contents/${contentId}/publish`,
                    { method: "POST" }
                );
                if (!res.ok) throw new Error(`Publish failed (${res.status})`);
                setStatus("posted");
            } else {
                const res = await HttpWrapper.fetch(
                    `/api/v2/brands/${brandId}/contents/${contentId}/schedule`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ scheduledAt }),
                    }
                );
                if (!res.ok) throw new Error(`Schedule failed (${res.status})`);
                setStatus("scheduled");
            }
            setDirty(false);
            setShowPublishModal(false);
        } catch (e) {
            // Surface via console for now; a toast is added in the Phase 6 polish.
            console.warn("Publish/schedule error:", e);
        } finally {
            setPublishing(false);
        }
    }, [contentId, publishing, destinations, scheduleMode, date, timeOfPosting, updateContent, selectedBrand?.id, title, idea, caption, hashtags, script, imagePrompt, attachments]);

    const handleCreateCollab = useCallback(() => {
        setShowCollabModal(true);
    }, []);

    const handleMagicGenerate = useCallback(
        (prompt: string) => {
            const platform = "Instagram";
            setMagicGenerating(true);
            if (magicTarget === "caption") {
                generateCaption({
                    topic: prompt,
                    platform,
                    format: contentType,
                    contextId: contentId,
                });
            } else if (magicTarget === "hashtags") {
                generateHashtags({
                    topic: prompt,
                    platform,
                    contextId: contentId,
                });
            }
        },
        [magicTarget, contentType, contentId, generateCaption, generateHashtags]
    );

    const handleScriptAiEnhance = useCallback(() => {
        setScript("");
        const keyMessage = scriptAiPrompt.trim();
        if (!keyMessage) return;
        setIsGeneratingScript(true);
        generateScript({
            videoType: isReel ? "Reel" : "Video",
            topic: title || idea || "Brand content",
            keyMessage,
            tone: "friendly",
            contextId: contentId,
        });
    }, [scriptAiPrompt, isReel, title, idea, contentId, generateScript]);

    const handleImageGenerate = useCallback((promptArg?: string) => {
        const p = (promptArg ?? imagePrompt).trim();
        if (!p) return;
        setImagePrompt(p);
        setIsGeneratingImage(true);
        generateImage({
            description: p,
            aspectRatio: MEDIA_SPEC[contentType].aspectRatios[0] ?? "1:1",
            count: 1,
        });
    }, [imagePrompt, contentType, generateImage]);

    // React to AI generation results streaming back from the backend.

    // Captions: take the first variant and apply it. The FloatingPromptInput
    // closes when we clear magicTarget once the result lands.
    useEffect(() => {
        if (magicTarget !== "caption" || aiCaptions.length === 0) return;
        setCaption(aiCaptions[0].text);
        setMagicGenerating(false);
        setMagicTarget(null);
    }, [aiCaptions, magicTarget]);

    // Hashtags: flatten all tier groups into a single space-separated #tag string.
    useEffect(() => {
        if (magicTarget !== "hashtags" || aiHashtags.length === 0) return;
        const joined = aiHashtags
            .flatMap((g) => g.tags)
            .map((t) => `#${t}`)
            .join(" ");
        setHashtags(joined);
        setMagicGenerating(false);
        setMagicTarget(null);
    }, [aiHashtags, magicTarget]);

    // Script: stream into the script field. Append on first run; replace the
    // streamed block on subsequent token updates so the user sees it grow live.
    const scriptStreamStartRef = useRef<number | null>(null);
    useEffect(() => {
        if (!isGeneratingScript) return;
        if (!aiScript) return;
        if (scriptStreamStartRef.current === null) {
            // Mark insertion point right before the streamed content lands.
            scriptStreamStartRef.current = (script ? script.length + 2 : 0);
        }
        const start = scriptStreamStartRef.current;
        setScript((prev) => {
            const base = prev.slice(0, start);
            return (base ? base + (base.endsWith("\n\n") ? "" : "\n\n") : "") + aiScript;
        });
        if (!scriptStreaming) {
            setScriptAiPrompt("");
            setIsGeneratingScript(false);
            scriptStreamStartRef.current = null;
        }
    }, [aiScript, scriptStreaming, isGeneratingScript]);

    // Image: on completion, append the generated asset to the media gallery
    // (or replace it for single-asset types). Persists via attachments[] on save.
    useEffect(() => {
        if (!isGeneratingImage) return;
        if (imagesStreaming) return;
        if (aiImages.length === 0) return;
        const latest = aiImages[aiImages.length - 1];
        const asset: Attachment = { type: "image", imageUrl: latest.s3Url };
        setAttachments((prev) =>
            MEDIA_SPEC[contentType].multi ? [...prev, asset] : [asset]
        );
        setIsGeneratingImage(false);
    }, [aiImages, imagesStreaming, isGeneratingImage, contentType]);

    const formattedDate = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const statusColorSet = contentStatusColors(status, colors);

    const headerActions = useMemo(
        () => [
            // 💬 Comments + 🤖 Chat toggles — mobile only; desktop lives in the RightSidePanel rail
            !xl ? (
                <Pressable
                    key="comments"
                    style={({ pressed }) => [
                        styles.iconBtn,
                        rightPanelMode === "comments" && styles.iconBtnActive,
                        pressed && styles.iconBtnPressed,
                    ]}
                    onPress={() =>
                        setRightPanelMode((m) => (m === "comments" ? "none" : "comments"))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Comments"
                    accessibilityState={{ selected: rightPanelMode === "comments" }}
                >
                    <FontAwesomeIcon
                        icon={faCommentDots}
                        size={15}
                        color={rightPanelMode === "comments" ? colors.onPrimary : colors.textSecondary}
                    />
                </Pressable>
            ) : null,
            !xl ? (
                <Pressable
                    key="chat"
                    style={({ pressed }) => [
                        styles.iconBtn,
                        rightPanelMode === "chat" && styles.iconBtnActive,
                        pressed && styles.iconBtnPressed,
                    ]}
                    onPress={() =>
                        setRightPanelMode((m) => (m === "chat" ? "none" : "chat"))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="AI Chat"
                    accessibilityState={{ selected: rightPanelMode === "chat" }}
                >
                    <FontAwesomeIcon
                        icon={faRobot}
                        size={15}
                        color={rightPanelMode === "chat" ? colors.onPrimary : colors.textSecondary}
                    />
                </Pressable>
            ) : null,
            !xl ? (
                <Pressable
                    key="preview"
                    style={({ pressed }) => [
                        styles.iconBtn,
                        rightPanelMode === "preview" && styles.iconBtnActive,
                        pressed && styles.iconBtnPressed,
                    ]}
                    onPress={() =>
                        setRightPanelMode((m) => (m === "preview" ? "none" : "preview"))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Preview"
                    accessibilityState={{ selected: rightPanelMode === "preview" }}
                >
                    <FontAwesomeIcon
                        icon={faEye}
                        size={15}
                        color={rightPanelMode === "preview" ? colors.onPrimary : colors.textSecondary}
                    />
                </Pressable>
            ) : null,
            // ℹ️ Content details (title / idea / status)
            <Pressable
                key="info"
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                onPress={() => setShowInfoModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Content details"
            >
                <FontAwesomeIcon icon={faCircleInfo} size={16} color={colors.textSecondary} />
            </Pressable>,
            // 🚀 Publish / schedule
            <Pressable
                key="publish"
                style={({ pressed }) => [
                    xl ? styles.publishHeaderBtn : styles.iconBtn,
                    pressed && styles.iconBtnPressed,
                ]}
                onPress={() => setShowPublishModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Publish or schedule"
            >
                <FontAwesomeIcon icon={faPaperPlane} size={13} color={colors.primary} />
                {xl && <Text style={styles.publishHeaderText}>Publish</Text>}
            </Pressable>,
            // Save
            <Pressable
                key="save"
                style={({ pressed }) => [
                    xl ? styles.saveBtn : styles.saveBtnIcon,
                    saveState === "saved" && styles.saveBtnSaved,
                    pressed && styles.btnPressed,
                ]}
                onPress={handleSave}
                disabled={saveState === "saving"}
                accessibilityRole="button"
                accessibilityLabel={dirty ? "Save (unsaved changes)" : "Save"}
            >
                {saveState === "saving" ? (
                    xl ? <Text style={styles.saveBtnText}>Saving…</Text> : <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                    <>
                        <FontAwesomeIcon icon={faCheck} size={13} color={colors.onPrimary} />
                        {xl && <Text style={styles.saveBtnText}>{saveState === "saved" ? "Saved" : dirty ? "Save •" : "Save"}</Text>}
                    </>
                )}
            </Pressable>,
        ],
        [styles, colors, handleSave, saveState, rightPanelMode, xl, dirty]
    );

    return (
        <AppLayout>
            <PageHeader
                title={title || "Create Content"}
                showBackButton
                actionButtons={headerActions}
                mobileActions="all"
                customMainContent={
                    <View style={styles.headerMain}>
                        <View style={styles.headerTitleRow}>
                            <Text style={styles.headerTitleText} numberOfLines={1}>
                                {title || "Create Content"}
                            </Text>
                            <View
                                style={[styles.statusBadge, { backgroundColor: statusColorSet.bg }]}
                                accessibilityLabel={`Status: ${CONTENT_STATUS_LABELS[status]}`}
                            >
                                <Text style={[styles.statusBadgeText, { color: statusColorSet.fg }]}>
                                    {CONTENT_STATUS_LABELS[status]}
                                </Text>
                            </View>
                        </View>
                        {xl ? (
                            <Text style={styles.headerTypeText}>
                                {CONTENT_TYPE_LABELS[contentType]}
                            </Text>
                        ) : null}
                    </View>
                }
            />

            {/* ── Split layout: form (left) + comments panel (right) ─────── */}
            <View style={styles.splitContainer}>
                {/* Left: scrollable form */}
                <KeyboardAvoidingView
                    style={styles.flex1}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.scroll}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* ── Posting summary (only once configured) ──────────── */}
                        {destinations.length > 0 ? (
                            <View style={styles.section}>
                                <PostingSummary
                                    socialAccounts={socialAccounts}
                                    destinations={destinations}
                                    scheduleMode={scheduleMode}
                                    formattedDate={formattedDate}
                                    timeOfPosting={timeOfPosting}
                                    onEdit={() => setShowPublishModal(true)}
                                />
                            </View>
                        ) : null}

                        {/* ── Content heading: title + type ────────────────────── */}
                        <View style={styles.section}>
                            <View style={styles.contentHeading}>
                                <Text style={styles.contentTitle} numberOfLines={2}>
                                    {title || "Untitled content"}
                                </Text>
                                <View style={styles.typeTag}>
                                    <Text style={styles.typeTagText}>
                                        {CONTENT_TYPE_LABELS[contentType]}
                                    </Text>
                                </View>
                            </View>

                            {mediaSpec.kind !== "none" && (
                                <MediaStage
                                    contentType={contentType}
                                    attachments={attachments}
                                    onAttachmentsChange={setAttachments}
                                    imagePrompt={imagePrompt}
                                    onImagePromptChange={setImagePrompt}
                                    onGenerateImage={handleImageGenerate}
                                    isGeneratingImage={isGeneratingImage}
                                />
                            )}

                            {mediaSpec.hasScript && (
                                <ScriptEditor
                                    title={isReel ? "Reel Script" : "Script"}
                                    subtitle={
                                        isReel
                                            ? "Optional — add a shot-by-shot script, or just upload your finished video above."
                                            : "Outline the talking points and flow for your live session."
                                    }
                                    script={script}
                                    onScriptChange={setScript}
                                    aiPrompt={scriptAiPrompt}
                                    onAiPromptChange={setScriptAiPrompt}
                                    onEnhance={handleScriptAiEnhance}
                                    isGenerating={isGeneratingScript}
                                    contentId={contentId}
                                    onSendToChat={handleSendToChat}
                                    collapsible={isReel}
                                />
                            )}
                        </View>

                        {/* ── Caption ──────────────────────────────────────────── */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>CAPTION</Text>
                            <View style={styles.card}>
                                <View style={styles.inputWithWand}>
                                    <TextInput
                                        style={[styles.input, styles.inputFlex, styles.textAreaShort]}
                                        placeholder="Write a compelling caption for this post..."
                                        placeholderTextColor={colors.textSecondary}
                                        value={caption}
                                        onChangeText={setCaption}
                                        multiline
                                        maxLength={2200}
                                        textAlignVertical="top"
                                    />
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.wandBtn,
                                            pressed && styles.btnPressed,
                                        ]}
                                        onPress={() => setMagicTarget("caption")}
                                    >
                                        <FontAwesomeIcon
                                            icon={faMagicWandSparkles}
                                            size={16}
                                            color={colors.primary}
                                        />
                                    </Pressable>
                                </View>
                            </View>
                        </View>

                        {/* ── Hashtags ──────────────────────────────────────────── */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>HASHTAGS</Text>
                            <View style={styles.card}>
                                <View style={styles.inputWithWand}>
                                    <TextInput
                                        style={[styles.input, styles.inputFlex]}
                                        placeholder="#YourBrand #Product #Niche"
                                        placeholderTextColor={colors.textSecondary}
                                        value={hashtags}
                                        onChangeText={setHashtags}
                                        maxLength={500}
                                    />
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.wandBtn,
                                            pressed && styles.btnPressed,
                                        ]}
                                        onPress={() => setMagicTarget("hashtags")}
                                    >
                                        <FontAwesomeIcon
                                            icon={faMagicWandSparkles}
                                            size={16}
                                            color={colors.primary}
                                        />
                                    </Pressable>
                                </View>
                            </View>
                        </View>

                        {/* ── Reel Collab CTA ───────────────────────────────────── */}
                        {isReel && (
                            <View style={styles.section}>
                                <View style={styles.collabBanner}>
                                    <View style={styles.collabAccent} />
                                    <View style={styles.collabBody}>
                                        <Text style={styles.collabTitle}>
                                            Want influencers to create this reel?
                                        </Text>
                                        <Text style={styles.collabSub}>
                                            Post this reel as a collaboration requirement so creators can
                                            discover it, apply, and bring your script to life.
                                        </Text>
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.collabBtn,
                                                pressed && styles.btnPressed,
                                            ]}
                                            onPress={handleCreateCollab}
                                        >
                                            <FontAwesomeIcon
                                                icon={faHandshake}
                                                size={14}
                                                color={colors.onPrimary}
                                            />
                                            <Text style={styles.collabBtnText}>
                                                Create Collab Requirement
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        )}

                        <View style={styles.bottomPad} />
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Right: split-pane comments on desktop only. Mobile uses
                    the floating overlay rendered below. */}
                {xl && (
                    <View style={[
                        styles.rightPanel,
                        rightPanelMode === "none" && styles.rightPanelCollapsed,
                    ]}>
                        <RightSidePanel
                            mode={rightPanelMode}
                            onModeChange={setRightPanelMode}
                            commentsSlot={
                                <ContentCommentsPanel
                                    contentId={contentId ?? null}
                                    onSendToAI={handleCommentToChat}
                                />
                            }
                            chatSlot={
                                <AIChatPanel
                                    module="content"
                                    contextId={contentId}
                                    focusItems={chatFocusItems}
                                    onRemoveFocusItem={(id) =>
                                        setChatFocusItems((prev) => prev.filter((f) => f.id !== id))
                                    }
                                    isCompact
                                />
                            }
                            previewSlot={
                                <PreviewPanel
                                    contentType={contentType}
                                    attachments={attachments}
                                    caption={caption}
                                    hashtags={hashtags}
                                />
                            }
                        />
                    </View>
                )}
            </View>

            {!xl && (
                <RightSidePanel
                    mode={rightPanelMode}
                    onModeChange={setRightPanelMode}
                    commentsSlot={
                        <ContentCommentsPanel
                            contentId={contentId ?? null}
                            onCollapse={() => setRightPanelMode("none")}
                            onSendToAI={handleCommentToChat}
                        />
                    }
                    chatSlot={
                        <AIChatPanel
                            module="content"
                            contextId={contentId}
                            focusItems={chatFocusItems}
                            onRemoveFocusItem={(id) =>
                                setChatFocusItems((prev) => prev.filter((f) => f.id !== id))
                            }
                            isCompact
                            onCollapse={() => setRightPanelMode("none")}
                        />
                    }
                    previewSlot={
                        <PreviewPanel
                            contentType={contentType}
                            attachments={attachments}
                            caption={caption}
                            hashtags={hashtags}
                            onCollapse={() => setRightPanelMode("none")}
                        />
                    }
                />
            )}

            <DatePickerModal
                visible={showDatePicker}
                title="Date of Posting"
                value={date}
                onChange={setDate}
                onClose={() => setShowDatePicker(false)}
            />

            <FloatingPromptInput
                visible={magicTarget !== null}
                title={
                    magicTarget === "caption"
                        ? "Generate caption with AI"
                        : "Generate hashtags with AI"
                }
                subtitle={
                    magicTarget === "caption"
                        ? "Set the tone, or paste a draft to refine."
                        : "Describe your niche, product, or audience."
                }
                placeholder={
                    magicTarget === "caption"
                        ? "E.g. punchy and playful, highlight free shipping…"
                        : "E.g. orthopedic sandals for women, wellness niche…"
                }
                loading={magicGenerating}
                onClose={() => setMagicTarget(null)}
                onGenerate={handleMagicGenerate}
            />

            <CreateCollabFromContentModal
                visible={showCollabModal}
                content={collabSource}
                onClose={() => setShowCollabModal(false)}
            />

            <ContentInfoModal
                visible={showInfoModal}
                title={title}
                idea={idea}
                status={status}
                typeLabel={CONTENT_TYPE_LABELS[contentType]}
                onChangeTitle={setTitle}
                onChangeIdea={setIdea}
                onChangeStatus={setStatus}
                onClose={() => setShowInfoModal(false)}
            />

            <PublishModal
                visible={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                socialAccounts={socialAccounts}
                destinations={destinations}
                onDestinationsChange={setDestinations}
                scheduleMode={scheduleMode}
                onScheduleModeChange={setScheduleMode}
                formattedDate={formattedDate}
                onPressDate={() => setShowDatePicker(true)}
                timeOfPosting={timeOfPosting}
                onTimeChange={setTimeOfPosting}
                onPublish={handlePublish}
                publishing={publishing}
            />
        </AppLayout>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    const maxWidth = xl ? 860 : undefined;
    return useMemo(
        () =>
            StyleSheet.create({
                flex1: {
                    flex: 1,
                },
                scroll: {
                    paddingTop: 16,
                    paddingHorizontal: 16,
                    paddingBottom: 40,
                    ...(maxWidth ? { maxWidth, alignSelf: "center" as const, width: "100%" } : {}),
                },
                section: {
                    marginBottom: 20,
                },
                // ── Split layout ──────────────────────────────────────────────
                splitContainer: {
                    flex: 1,
                    flexDirection: "row",
                },
                rightPanel: {
                    flex: 0.5,
                },
                rightPanelCollapsed: {
                    // `flex: 0` ⇒ `flex: 0 1 0%` collapses width to 0; use
                    // explicit grow/shrink/basis so the 44px rail is honored.
                    flexGrow: 0,
                    flexShrink: 0,
                    flexBasis: 44,
                    width: 44,
                },
                // ── Header icon button (comments toggle) ──────────────────────
                iconBtn: {
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                iconBtnActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                iconBtnPressed: { opacity: 0.75 },
                // ── Header custom main (title + status badge + type) ──────────
                headerMain: {
                    flex: 1,
                    flexShrink: 1,
                    minWidth: 0,
                },
                headerTitleRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                },
                headerTitleText: {
                    flexShrink: 1,
                    fontSize: 22,
                    fontWeight: "700",
                    color: colors.text,
                },
                statusBadge: {
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                    flexShrink: 0,
                },
                statusBadgeText: {
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 0.3,
                },
                headerTypeText: {
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginTop: 2,
                    letterSpacing: 1,
                },
                // Secondary header button (Publish) — distinct from primary Save
                publishHeaderBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: colors.aliceBlue,
                },
                publishHeaderText: {
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.primary,
                },
                // ── In-page content heading (title + type tag) ───────────────
                contentHeading: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                },
                contentTitle: {
                    flexShrink: 1,
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.text,
                },
                sectionLabel: {
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1.1,
                    color: colors.textSecondary,
                    marginBottom: 8,
                },
                card: {
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    padding: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                cardTitle: {
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 4,
                },
                cardSub: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    lineHeight: 18,
                    marginBottom: 12,
                },
                typeTag: {
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                typeTagText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                input: {
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: colors.text,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                inputFlex: {
                    flex: 1,
                },
                textAreaShort: {
                    minHeight: 70,
                    maxHeight: 140,
                },
                inputWithWand: {
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "flex-start",
                },
                wandBtn: {
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    backgroundColor: colors.aliceBlue,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 4,
                    shadowOpacity: 0.06,
                    elevation: 2,
                },
                collabBanner: {
                    flexDirection: "row",
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    overflow: "hidden",
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 12,
                    shadowOpacity: 0.1,
                    elevation: 4,
                },
                collabAccent: {
                    width: 4,
                    backgroundColor: colors.primary,
                },
                collabBody: {
                    flex: 1,
                    padding: 16,
                },
                collabTitle: {
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 6,
                },
                collabSub: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    lineHeight: 19,
                    marginBottom: 14,
                },
                collabBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    gap: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                collabBtnText: {
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                saveBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                saveBtnIcon: {
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                saveBtnSaved: {
                    backgroundColor: colors.statusApprovedFg,
                    shadowColor: colors.statusApprovedFg,
                },
                saveBtnText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.onPrimary,
                },
                btnPressed: {
                    opacity: 0.72,
                },
                bottomPad: {
                    height: 40,
                },
            }),
        [colors, xl, maxWidth]
    );
}

export default CreateContentScreen;
