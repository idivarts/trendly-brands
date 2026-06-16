import { CONTENT_TYPE_LABELS, ContentType } from "@/components/content-calendar/types";
import ContentCommentsPanel from "@/components/contents/ContentCommentsPanel";
import AIGeneratingHint from "@/components/shared/AIGeneratingHint";
import FloatingPromptInput from "@/components/shared/FloatingPromptInput";
import { MEDIA_SPEC } from "@/components/contents/detail/media-spec";
import MediaStage from "@/components/contents/detail/MediaStage";
import PreviewPanel from "@/components/contents/detail/PreviewPanel";
import ContentInfoModal from "@/components/contents/detail/ContentInfoModal";
import PostingSummary from "@/components/contents/detail/PostingSummary";
import PostPerformance from "@/components/contents/PostPerformance";
import PublishModal from "@/components/contents/detail/PublishModal";
import NoSocialsModal from "@/components/contents/detail/NoSocialsModal";
import ScriptEditor from "@/components/contents/detail/ScriptEditor";
import UnsavedChangesModal from "@/components/contents/detail/UnsavedChangesModal";
import { MOCK_CONTENT_ITEMS } from "@/components/contents/mock-data";
import {
    CONTENT_STATUS_LABELS,
    ContentStatus,
    ScheduleMode,
    SocialDestination,
    contentStatusColors,
} from "@/components/contents/types";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import AIChatPanel, { FocusItem } from "@/components/shared/AIChatPanel";
import { PanelComment } from "@/components/shared/CommentsPanel";
import RightSidePanel, { RightPanelMode } from "@/components/shared/RightSidePanel";
import RightPanelFab from "@/components/shared/RightPanelFab";
import ContentActionsMenu from "@/components/contents/detail/ContentActionsMenu";
import ShareModal from "@/components/sharing/ShareModal";
import { View } from "@/components/theme/Themed";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import ReadMore from "@/shared-uis/components/ReadMore";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import PageHeader from "@/components/ui/page-header";
import { useBreakpoints } from "@/hooks";
import { CaptionVariant, HashtagGroup, useAIGenerate } from "@/hooks/use-ai-generate";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBrandSocialContext } from "@/contexts/brand-social-context.provider";
import { useContents } from "@/hooks/use-contents";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCalendarXmark,
    faCheck,
    faCommentDots,
    faEye,
    faHandshake,
    faLock,
    faMagicWandSparkles,
    faPaperPlane,
    faRobot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
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

// Convert a *local-midnight* Date (what the date picker produces) into the
// epoch for that same calendar day at UTC midnight — the convention every
// content writer uses for `postingTimeStamp` (see toIContent / calendar drag).
// Using date.toISOString() here would be wrong: in a positive-offset timezone
// (e.g. IST) local midnight is the *previous* day in UTC, shifting the stored
// day back by one.
const localDateToUtcMidnight = (d: Date): number =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

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
    const styles = useStyles(colors, xl);

    const router = useRouter();
    const { items, updateContent, deleteContent } = useContents();
    const { socialAccounts } = useBrandSocialContext();
    const { selectedBrand, hasCapability } = useBrandContext();
    const { openModal } = useConfirmationModel();

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
    const [unscheduling, setUnscheduling] = useState(false);
    const [scriptAiPrompt, setScriptAiPrompt] = useState("");
    const [timeOfPosting, setTimeOfPosting] = useState(seedItem?.timeOfPosting ?? "");
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showNoSocialsModal, setShowNoSocialsModal] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

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
    // Measured width of the split row — feeds the RightSidePanel resize bounds.
    const [splitWidth, setSplitWidth] = useState(0);

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

    // `magicTarget` drives ONLY the prompt modal (which field's prompt is open).
    // The in-flight state is tracked per-field below so the modal can close the
    // instant the prompt is submitted while generation continues in the
    // background — caption and hashtags can even generate concurrently.
    const [magicTarget, setMagicTarget] = useState<"caption" | "hashtags" | null>(null);
    const [captionGenerating, setCaptionGenerating] = useState(false);
    const [hashtagGenerating, setHashtagGenerating] = useState(false);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const contentType = (seedItem?.type ?? paramType ?? "post") as ContentType;
    const isReel = contentType === "reel";
    const isTextPost = contentType === "text";
    const mediaSpec = MEDIA_SPEC[contentType];

    // Instagram has no text-only post format, so a text post can only target
    // Facebook / LinkedIn / X. Hide Instagram from the destination picker and
    // prune any Instagram destination that may already be selected.
    const publishableAccounts = useMemo(
        () =>
            isTextPost
                ? socialAccounts.filter((a) => a.platform !== "instagram")
                : socialAccounts,
        [socialAccounts, isTextPost]
    );

    // A text post can't go to Instagram — drop any Instagram destination if the
    // type is (or becomes) text.
    useEffect(() => {
        if (!isTextPost) return;
        setDestinations((prev) => {
            const next = prev.filter((d) => d.platform !== "instagram");
            return next.length === prev.length ? prev : next;
        });
    }, [isTextPost]);

    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Real AI generation hooks — backed by /api/ai + OpenRouter.
    const {
        captions: aiCaptions,
        captionLoading,
        generateCaption,
        hashtags: aiHashtags,
        hashtagLoading,
        generateHashtags,
        script: aiScript,
        scriptStreaming,
        generateScript,
        images: aiImages,
        imagesStreaming,
        generateImage,
    } = useAIGenerate();

    // Scheduled / posted content is locked: every edit + Save is disabled.
    // A "scheduled" post can be unlocked by unscheduling it (reverts to
    // "approved"); a "posted" one is locked permanently.
    const locked = status === "scheduled" || status === "posted";

    // Returns true when the content was persisted, false otherwise (no-op or
    // failure) — the unsaved-changes leave flow relies on this to decide whether
    // it's safe to navigate away.
    const handleSave = useCallback(async (): Promise<boolean> => {
        if (!contentId || saveState === "saving" || locked) return false;
        setSaveState("saving");
        try {
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
                postingTimeStamp: date ? localDateToUtcMidnight(date) : undefined,
            });
        } catch (e) {
            console.warn("Save error:", e);
            setSaveState("idle");
            return false;
        }
        setDirty(false);
        setSaveState("saved");
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setSaveState("idle"), 2000);
        return true;
    }, [contentId, saveState, locked, updateContent, title, idea, status, caption, hashtags, timeOfPosting, script, imagePrompt, attachments, date]);

    // Publish now / schedule. Persists the latest edits + destinations to
    // Firestore so the backend reads fresh data, then calls the publish /
    // schedule endpoint (functions/trendly_v2 → internal/trendlyapis/publishing).
    const handlePublish = useCallback(async () => {
        if (!contentId || publishing || destinations.length === 0 || locked) return;
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
                postingTimeStamp: localDateToUtcMidnight(date),
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
    }, [contentId, publishing, locked, destinations, scheduleMode, date, timeOfPosting, updateContent, selectedBrand?.id, title, idea, caption, hashtags, script, imagePrompt, attachments]);

    // Guard the publish entry point: if the brand has no connected social
    // accounts, surface a blocking modal that routes to Connected Accounts
    // instead of opening the publish/schedule sheet.
    const handleOpenPublish = useCallback(() => {
        if (publishableAccounts.length === 0) {
            setShowNoSocialsModal(true);
            return;
        }
        setShowPublishModal(true);
    }, [publishableAccounts.length]);

    // Unschedule a scheduled post: cancels the backend Step Functions execution
    // and reverts status to "approved", which unlocks the editor again. Returns
    // true on success so callers (e.g. delete) can sequence off it.
    const handleUnschedule = useCallback(async (): Promise<boolean> => {
        if (!contentId || unscheduling) return false;
        const brandId = selectedBrand?.id;
        if (!brandId) return false;
        setUnscheduling(true);
        try {
            const res = await HttpWrapper.fetch(
                `/api/v2/brands/${brandId}/contents/${contentId}/schedule`,
                { method: "DELETE" }
            );
            if (!res.ok) throw new Error(`Unschedule failed (${res.status})`);
            setStatus("approved");
            skipDirtyRef.current = true;
            setDirty(false);
            return true;
        } catch (e) {
            console.warn("Unschedule error:", e);
            return false;
        } finally {
            setUnscheduling(false);
        }
    }, [contentId, unscheduling, selectedBrand?.id]);

    const handleCreateCollab = useCallback(() => {
        router.push("/hire-us");
    }, [router]);

    // Shared success path: drop the doc-gone page back to the contents list,
    // skipping the unsaved-changes guard (the doc no longer exists).
    const leaveAfterDelete = useCallback(() => {
        Toaster.success("Content deleted", `"${title || "Content"}" was removed.`);
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/contents");
        }
    }, [title, router]);

    // Permanently delete this content (frontend Firestore delete, gated by the
    // `delete_content` capability + a confirmation modal). Locked states are
    // guarded:
    //   • posted   → blocked. The live social post isn't ours to remove, and the
    //                record is kept for analytics history.
    //   • scheduled → must unschedule first (cancels the backend Step Functions
    //                 job), otherwise the delete would orphan it. We chain
    //                 unschedule → delete behind a single confirm.
    const handleDelete = useCallback(() => {
        if (!contentId) return;

        if (status === "posted") {
            openModal({
                title: "Can't delete a posted item",
                description:
                    "This content has already been published to your connected socials. Deleting it here wouldn't remove the live post — and the record is kept so its performance stays in your analytics.",
                confirmText: "Got it",
                cancelText: "",
                confirmAction: () => {},
            });
            return;
        }

        if (status === "scheduled") {
            openModal({
                title: "Unschedule & delete?",
                description: `"${title || "This content"}" is scheduled to publish. To delete it we'll cancel the schedule first, then permanently remove it. This cannot be undone.`,
                confirmText: "Unschedule & Delete",
                cancelText: "Cancel",
                confirmAction: async () => {
                    const unscheduled = await handleUnschedule();
                    if (!unscheduled) {
                        Toaster.error("Couldn't unschedule", "Please try again.");
                        return;
                    }
                    const ok = await deleteContent(contentId);
                    if (!ok) {
                        Toaster.error("Couldn't delete", "Unscheduled, but the delete failed. Please try again.");
                        return;
                    }
                    leaveAfterDelete();
                },
            });
            return;
        }

        openModal({
            title: "Delete content?",
            description: `"${title || "This content"}" will be permanently deleted. This is an irreversible action and cannot be undone.`,
            confirmText: "Delete Content",
            cancelText: "Cancel",
            confirmAction: async () => {
                const ok = await deleteContent(contentId);
                if (!ok) {
                    Toaster.error("Couldn't delete", "Please try again.");
                    return;
                }
                leaveAfterDelete();
            },
        });
    }, [contentId, status, title, openModal, deleteContent, handleUnschedule, leaveAfterDelete]);

    // ── Back navigation with an unsaved-changes guard ────────────────────────
    const doNavigateBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/contents");
        }
    }, [router]);

    // Header back press: prompt to save/discard when there are unsaved edits,
    // otherwise leave straight away.
    const handleBackPress = useCallback(() => {
        if (dirty) {
            setShowLeaveConfirm(true);
        } else {
            doNavigateBack();
        }
    }, [dirty, doNavigateBack]);

    const handleLeaveSave = useCallback(async () => {
        const ok = await handleSave();
        if (!ok) return; // save failed — keep the prompt open so the user can retry or discard
        setShowLeaveConfirm(false);
        doNavigateBack();
    }, [handleSave, doNavigateBack]);

    const handleLeaveDiscard = useCallback(() => {
        setShowLeaveConfirm(false);
        doNavigateBack();
    }, [doNavigateBack]);

    // Snapshots of the last AI result, captured the moment a new request fires.
    // The apply-effects use these to tell a fresh result apart from a stale one
    // left over from a previous run (e.g. when a request fails and the hook
    // never replaces its result array).
    const captionSnapRef = useRef<CaptionVariant[] | null>(null);
    const hashtagSnapRef = useRef<HashtagGroup[] | null>(null);

    const handleMagicGenerate = useCallback(
        (prompt: string) => {
            const target = magicTarget;
            if (!target) return;
            const platform = "Instagram";
            // Pass the current (possibly unsaved) editor state so the AI writes
            // with the context of what's on screen right now, not the last save.
            const liveContent = {
                title,
                description: idea,
                caption,
                hashtags,
                script,
            };
            // Flip the per-field flag and fire the request. The modal closes
            // itself (onClose) — the user is free to keep editing while the
            // inline hint shows progress and the result lands automatically.
            if (target === "caption") {
                captionSnapRef.current = aiCaptions;
                setCaptionGenerating(true);
                generateCaption({
                    topic: prompt,
                    platform,
                    format: contentType,
                    contextId: contentId,
                    ...liveContent,
                });
            } else {
                hashtagSnapRef.current = aiHashtags;
                setHashtagGenerating(true);
                generateHashtags({
                    topic: prompt,
                    platform,
                    format: contentType,
                    contextId: contentId,
                    ...liveContent,
                });
            }
        },
        [magicTarget, contentType, contentId, title, idea, caption, hashtags, script, aiCaptions, aiHashtags, generateCaption, generateHashtags]
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
            // Live editor state so the script reflects the current piece.
            title,
            format: contentType,
            description: idea,
            caption,
            hashtags,
        });
    }, [scriptAiPrompt, isReel, title, idea, contentType, caption, hashtags, contentId, generateScript]);

    const handleImageGenerate = useCallback((promptArg?: string) => {
        const p = (promptArg ?? imagePrompt).trim();
        if (!p) return;
        setImagePrompt(p);
        setIsGeneratingImage(true);
        generateImage({
            description: p,
            aspectRatio: MEDIA_SPEC[contentType].aspectRatios[0] ?? "1:1",
            count: 1,
            contextId: contentId,
            multi: MEDIA_SPEC[contentType].multi,
        });
    }, [imagePrompt, contentType, contentId, generateImage]);

    // React to AI generation results streaming back from the backend.

    // Captions: when the request settles (loading true → false), take the first
    // variant and apply it, then release the field. The snapshot guard skips a
    // stale array (e.g. a failed call left the previous result untouched) so we
    // never overwrite the caption with old data — but we always clear the flag.
    const prevCaptionLoadingRef = useRef(false);
    useEffect(() => {
        const settled = prevCaptionLoadingRef.current && !captionLoading;
        prevCaptionLoadingRef.current = captionLoading;
        if (!settled || !captionGenerating) return;
        if (aiCaptions.length > 0 && aiCaptions !== captionSnapRef.current) {
            setCaption(aiCaptions[0].text);
        }
        setCaptionGenerating(false);
    }, [captionLoading, captionGenerating, aiCaptions]);

    // Hashtags: flatten all tier groups into a single space-separated #tag string.
    const prevHashtagLoadingRef = useRef(false);
    useEffect(() => {
        const settled = prevHashtagLoadingRef.current && !hashtagLoading;
        prevHashtagLoadingRef.current = hashtagLoading;
        if (!settled || !hashtagGenerating) return;
        if (aiHashtags.length > 0 && aiHashtags !== hashtagSnapRef.current) {
            const joined = aiHashtags
                .flatMap((g) => g.tags)
                .map((t) => `#${t}`)
                .join(" ");
            setHashtags(joined);
        }
        setHashtagGenerating(false);
    }, [hashtagLoading, hashtagGenerating, aiHashtags]);

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

    // Image (websocket fast-path): when connected, apply the streamed result to
    // the gallery immediately for snappy feedback. The backend has already
    // persisted it to the content doc, so no manual Save is needed.
    useEffect(() => {
        if (!isGeneratingImage) return;
        if (imagesStreaming) return;
        if (aiImages.length === 0) return;
        const latest = aiImages[aiImages.length - 1];
        if (!latest?.s3Url) return;
        const asset: Attachment = { type: "image", imageUrl: latest.s3Url };
        setAttachments((prev) => {
            // De-dupe — the Firestore reconciliation below may also surface it.
            if (prev.some((a) => a.imageUrl === latest.s3Url)) return prev;
            return MEDIA_SPEC[contentType].multi ? [...prev, asset] : [asset];
        });
        setIsGeneratingImage(false);
    }, [aiImages, imagesStreaming, isGeneratingImage, contentType]);

    // Image (backend-driven reconciliation): the job's status + result live on the
    // content doc, so a generation survives a websocket drop or a page reload.
    // Pull any server-persisted images not yet reflected locally, and clear the
    // generating flag once the backend job resolves.
    useEffect(() => {
        const gen = seedItem?.imageGeneration;
        const status = gen?.status;

        if (status === "done" || status === "error") {
            setIsGeneratingImage(false);
        }
        if (!gen) return;

        const serverAtt = seedItem?.attachments ?? [];
        setAttachments((local) => {
            const localUrls = new Set(
                local.map((a) => a.imageUrl).filter(Boolean) as string[]
            );
            const missing = serverAtt.filter(
                (a) => a.type === "image" && a.imageUrl && !localUrls.has(a.imageUrl)
            );
            if (missing.length === 0) return local;
            // Backend already persisted these — don't flag the form as dirty.
            skipDirtyRef.current = true;
            return MEDIA_SPEC[contentType].multi
                ? [...local, ...missing]
                : [missing[missing.length - 1]];
        });
    }, [seedItem?.imageGeneration, seedItem?.attachments, contentType]);

    // Derived image-generation UI state: show progress while either the local
    // request or the backend job is running; surface backend errors.
    const imageGenStatus = seedItem?.imageGeneration?.status;
    const imageGenerating = isGeneratingImage || imageGenStatus === "generating";
    const imageGenError =
        imageGenStatus === "error"
            ? seedItem?.imageGeneration?.error || "Image generation failed. Please try again."
            : null;

    const formattedDate = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const statusColorSet = contentStatusColors(status, colors);

    const headerActions = useMemo(
        () => [
            // Comments / AI Chat / Preview moved to the mobile RightPanelFab
            // (bottom-right); desktop keeps them in the RightSidePanel rail.

            // ⋮ Overflow menu — Content details, Share, and Delete. Grouping the
            // secondary + destructive actions here keeps the header lean (esp.
            // on !xl, where Publish + Save already fill the row).
            <ContentActionsMenu
                key="menu"
                onDetails={() => setShowInfoModal(true)}
                onShare={
                    selectedBrand?.id && contentId && hasCapability("manage_content")
                        ? () => setShowShareModal(true)
                        : undefined
                }
                onDelete={hasCapability("delete_content") ? handleDelete : undefined}
            />,
            // 🚀 Publish / schedule — hidden once locked (scheduled / posted)
            locked ? null : (
                <Pressable
                    key="publish"
                    style={({ pressed }) => [
                        xl ? styles.publishHeaderBtn : styles.iconBtn,
                        pressed && styles.iconBtnPressed,
                    ]}
                    onPress={handleOpenPublish}
                    accessibilityRole="button"
                    accessibilityLabel="Publish or schedule"
                >
                    <FontAwesomeIcon icon={faPaperPlane} size={13} color={colors.primary} />
                    {xl && <Text style={styles.publishHeaderText}>Publish</Text>}
                </Pressable>
            ),
            // Save — hidden once locked (scheduled / posted)
            locked ? null : (
                <Pressable
                    key="save"
                    style={({ pressed }) => [
                        xl ? styles.saveBtn : styles.saveBtnIcon,
                        !dirty && styles.saveBtnSaved,
                        pressed && styles.btnPressed,
                    ]}
                    onPress={handleSave}
                    disabled={saveState === "saving" || !dirty}
                    accessibilityRole="button"
                    accessibilityLabel={dirty ? "Save (unsaved changes)" : "Saved"}
                >
                    {saveState === "saving" ? (
                        xl ? <Text style={styles.saveBtnText}>Saving…</Text> : <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faCheck} size={13} color={colors.onPrimary} />
                            {xl && <Text style={styles.saveBtnText}>{dirty ? "Save" : "Saved"}</Text>}
                        </>
                    )}
                </Pressable>
            ),
        ],
        [styles, colors, handleSave, saveState, xl, dirty, locked, selectedBrand?.id, contentId, hasCapability, handleOpenPublish, handleDelete]
    );

    return (
        <AppLayout>
            <PageHeader
                title={title || "Create Content"}
                showBackButton
                onBackPress={handleBackPress}
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
            <View
                style={styles.splitContainer}
                onLayout={(e) => setSplitWidth(e.nativeEvent.layout.width)}
            >
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
                        {/* ── Lock banner: scheduled / posted content is read-only ── */}
                        {locked ? (
                            <View style={styles.section}>
                                <View style={styles.lockBanner}>
                                    <View style={styles.lockIconWrap}>
                                        <FontAwesomeIcon icon={faLock} size={14} color={colors.primary} />
                                    </View>
                                    <View style={styles.lockBannerBody}>
                                        <Text style={styles.lockBannerTitle}>
                                            {status === "posted" ? "Posted — locked" : "Scheduled — locked"}
                                        </Text>
                                        <Text style={styles.lockBannerSub}>
                                            {status === "posted"
                                                ? "This content has been posted and can no longer be edited."
                                                : "Editing is paused while this post is scheduled. Unschedule it to make changes."}
                                        </Text>
                                    </View>
                                    {status === "scheduled" ? (
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.unscheduleBtn,
                                                pressed && styles.btnPressed,
                                            ]}
                                            onPress={handleUnschedule}
                                            disabled={unscheduling}
                                            accessibilityRole="button"
                                            accessibilityLabel="Unschedule post"
                                        >
                                            {unscheduling ? (
                                                <ActivityIndicator size="small" color={colors.primary} />
                                            ) : (
                                                <FontAwesomeIcon icon={faCalendarXmark} size={13} color={colors.primary} />
                                            )}
                                            <Text style={styles.unscheduleBtnText}>
                                                {unscheduling ? "Unscheduling…" : "Unschedule"}
                                            </Text>
                                        </Pressable>
                                    ) : null}
                                </View>
                            </View>
                        ) : null}

                        {/* ── Posting summary (only once configured) ──────────── */}
                        {destinations.length > 0 ? (
                            <View style={styles.section}>
                                <PostingSummary
                                    socialAccounts={publishableAccounts}
                                    destinations={destinations}
                                    scheduleMode={scheduleMode}
                                    formattedDate={formattedDate}
                                    timeOfPosting={timeOfPosting}
                                    onEdit={() => setShowPublishModal(true)}
                                    locked={status === "posted"}
                                    postedAt={
                                        status === "posted" ? seedItem?.scheduledAt : undefined
                                    }
                                />
                            </View>
                        ) : null}

                        {/* ── Post performance (live analytics + comments) ────── */}
                        {status === "posted" && seedItem ? (
                            <View style={styles.section}>
                                <PostPerformance content={seedItem} />
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

                            {idea ? (
                                <ReadMore
                                    text={idea}
                                    lineCount={1}
                                    style={styles.ideaText}
                                />
                            ) : null}

                            {mediaSpec.kind !== "none" && (
                                <MediaStage
                                    contentType={contentType}
                                    attachments={attachments}
                                    onAttachmentsChange={setAttachments}
                                    imagePrompt={imagePrompt}
                                    onImagePromptChange={setImagePrompt}
                                    onGenerateImage={handleImageGenerate}
                                    isGeneratingImage={imageGenerating}
                                    generationError={imageGenError}
                                    readOnly={locked}
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
                                    readOnly={locked}
                                />
                            )}
                        </View>

                        {/* ── Caption / Content ────────────────────────────────── */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>
                                {contentType === "text" ? "CONTENT" : "CAPTION"}
                            </Text>
                            <View style={styles.card}>
                                <View style={styles.inputWithWand}>
                                    <TextInput
                                        style={[styles.input, styles.inputFlex, styles.textAreaShort]}
                                        placeholder={
                                            contentType === "text"
                                                ? "Write your post..."
                                                : "Write a compelling caption for this post..."
                                        }
                                        placeholderTextColor={colors.textSecondary}
                                        value={caption}
                                        onChangeText={setCaption}
                                        multiline
                                        maxLength={2200}
                                        textAlignVertical="top"
                                        editable={!locked}
                                    />
                                    {!locked ? (
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.wandBtn,
                                                pressed && styles.btnPressed,
                                            ]}
                                            onPress={() => setMagicTarget("caption")}
                                            disabled={captionGenerating}
                                        >
                                            {captionGenerating ? (
                                                <ActivityIndicator size="small" color={colors.primary} />
                                            ) : (
                                                <FontAwesomeIcon
                                                    icon={faMagicWandSparkles}
                                                    size={16}
                                                    color={colors.primary}
                                                />
                                            )}
                                        </Pressable>
                                    ) : null}
                                </View>
                            </View>
                            {captionGenerating ? (
                                <View style={styles.aiHintWrap}>
                                    <AIGeneratingHint
                                        title={contentType === "text" ? "Writing your post…" : "Writing your caption…"}
                                        subtitle="You can keep working — it'll drop in here automatically when it's ready."
                                    />
                                </View>
                            ) : null}
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
                                        editable={!locked}
                                    />
                                    {!locked ? (
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.wandBtn,
                                                pressed && styles.btnPressed,
                                            ]}
                                            onPress={() => setMagicTarget("hashtags")}
                                            disabled={hashtagGenerating}
                                        >
                                            {hashtagGenerating ? (
                                                <ActivityIndicator size="small" color={colors.primary} />
                                            ) : (
                                                <FontAwesomeIcon
                                                    icon={faMagicWandSparkles}
                                                    size={16}
                                                    color={colors.primary}
                                                />
                                            )}
                                        </Pressable>
                                    ) : null}
                                </View>
                            </View>
                            {hashtagGenerating ? (
                                <View style={styles.aiHintWrap}>
                                    <AIGeneratingHint
                                        title="Finding the best hashtags…"
                                        subtitle="You can keep working — they'll fill in automatically when they're ready."
                                    />
                                </View>
                            ) : null}
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
                    <View style={styles.rightPanel}>
                        <RightSidePanel
                            mode={rightPanelMode}
                            onModeChange={setRightPanelMode}
                            containerWidth={splitWidth}
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

            {/* Mobile: panel surfaces live in a bottom-right speed-dial FAB.
                bottomOffset clears the 70px bottom tab bar. */}
            {!xl && (
                <RightPanelFab
                    mode={rightPanelMode}
                    onModeChange={setRightPanelMode}
                    bottomOffset={70}
                    actions={[
                        { mode: "comments", icon: faCommentDots, label: "Comments" },
                        { mode: "chat", icon: faRobot, label: "AI Chat" },
                        { mode: "preview", icon: faEye, label: "Preview" },
                    ]}
                />
            )}

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
                onClose={() => setMagicTarget(null)}
                onGenerate={handleMagicGenerate}
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
                readOnly={locked}
            />

            {selectedBrand?.id && contentId ? (
                <ShareModal
                    visible={showShareModal}
                    target={{
                        type: "content",
                        brandId: selectedBrand.id,
                        resourceId: contentId,
                    }}
                    title={title || "Untitled content"}
                    onClose={() => setShowShareModal(false)}
                />
            ) : null}

            <NoSocialsModal
                visible={showNoSocialsModal}
                onClose={() => setShowNoSocialsModal(false)}
                onConnect={() => {
                    setShowNoSocialsModal(false);
                    router.push("/connected-accounts" as any);
                }}
            />
            <PublishModal
                visible={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                socialAccounts={publishableAccounts}
                destinations={destinations}
                onDestinationsChange={setDestinations}
                scheduleMode={scheduleMode}
                onScheduleModeChange={setScheduleMode}
                formattedDate={formattedDate}
                dateValue={date}
                onDateChange={setDate}
                timeOfPosting={timeOfPosting}
                onTimeChange={setTimeOfPosting}
                onPublish={handlePublish}
                publishing={publishing}
            />

            <UnsavedChangesModal
                visible={showLeaveConfirm}
                saving={saveState === "saving"}
                onSave={handleLeaveSave}
                onDiscard={handleLeaveDiscard}
                onCancel={() => setShowLeaveConfirm(false)}
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
                    // The panel owns its own width (drag-to-resize / 44px rail);
                    // this wrapper just hugs it without growing or shrinking.
                    flexShrink: 0,
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
                    marginBottom: 8,
                },
                contentTitle: {
                    flexShrink: 1,
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.text,
                },
                ideaText: {
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.textSecondary,
                    marginBottom: 4,
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
                aiHintWrap: {
                    marginTop: 10,
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
                // ── Lock banner (scheduled / posted content) ──────────────────
                lockBanner: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: colors.aliceBlue,
                    borderRadius: 12,
                    padding: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                lockIconWrap: {
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.card,
                },
                lockBannerBody: {
                    flex: 1,
                    minWidth: 0,
                },
                lockBannerTitle: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 2,
                },
                lockBannerSub: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    lineHeight: 17,
                },
                unscheduleBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 10,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 4,
                    shadowOpacity: 0.06,
                    elevation: 2,
                },
                unscheduleBtnText: {
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.primary,
                },
            }),
        [colors, xl, maxWidth]
    );
}

export default CreateContentScreen;
