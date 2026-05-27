import { CONTENT_TYPE_LABELS, ContentType } from "@/components/content-calendar/types";
import CreateCollabFromContentModal, { CollabContentSource } from "@/components/collaborations/CreateCollabFromContentModal";
import ContentCommentsPanel from "@/components/contents/ContentCommentsPanel";
import RightSidePanel, { RightPanelMode } from "@/components/shared/RightSidePanel";
import { MOCK_CONTENT_ITEMS } from "@/components/contents/mock-data";
import {
    CONTENT_STATUS_LABELS,
    ContentItem,
    ContentStatus,
    POPULAR_POSTING_TIMES,
} from "@/components/contents/types";
import { useAIGenerate } from "@/hooks/use-ai-generate";
import { useContents } from "@/hooks/use-contents";
import DatePickerModal, {
    formatDateForWebInput,
} from "@/components/modals/DatePickerModal";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import AppLayout from "@/layouts/app-layout";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCalendarDays,
    faCheck,
    faClock,
    faCommentDots,
    faHandshake,
    faMagicWandSparkles,
    faPaperPlane,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
} from "react-native";

// ─── Magic Wand Prompt Modal ──────────────────────────────────────────────────

interface MagicPromptModalProps {
    visible: boolean;
    title: string;
    placeholder: string;
    onClose: () => void;
    onGenerate: (prompt: string) => void;
}

const MagicPromptModal: React.FC<MagicPromptModalProps> = ({
    visible,
    title,
    placeholder,
    onClose,
    onGenerate,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [prompt, setPrompt] = useState("");
    const styles = useMemo(() => magicStyles(colors), [colors]);

    const handleGenerate = () => {
        if (!prompt.trim()) return;
        onGenerate(prompt.trim());
        setPrompt("");
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.wand}>
                            <FontAwesomeIcon
                                icon={faMagicWandSparkles}
                                size={16}
                                color={colors.primary}
                            />
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <FontAwesomeIcon icon={faXmark} size={15} color={colors.textSecondary} />
                        </Pressable>
                    </View>
                    <View style={styles.body}>
                        <TextInput
                            style={styles.input}
                            placeholder={placeholder}
                            placeholderTextColor={colors.textSecondary}
                            value={prompt}
                            onChangeText={setPrompt}
                            multiline
                            maxLength={300}
                            textAlignVertical="top"
                            autoFocus
                        />
                    </View>
                    <View style={styles.footer}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.cancelBtn,
                                pressed && styles.btnPressed,
                            ]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.generateBtn,
                                !prompt.trim() && styles.generateBtnDisabled,
                                pressed && styles.btnPressed,
                            ]}
                            onPress={handleGenerate}
                            disabled={!prompt.trim()}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} size={13} color={colors.onPrimary} />
                            <Text style={styles.generateText}>Generate</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

function magicStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: colors.backdrop,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
        },
        sheet: {
            width: "100%",
            maxWidth: 440,
            backgroundColor: colors.card,
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.16,
            elevation: 12,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 18,
            paddingVertical: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        wand: {
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: colors.aliceBlue,
            alignItems: "center",
            justifyContent: "center",
        },
        title: {
            flex: 1,
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
        },
        closeBtn: {
            padding: 4,
        },
        body: {
            paddingHorizontal: 18,
            paddingVertical: 12,
        },
        input: {
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 14,
            color: colors.text,
            minHeight: 90,
            maxHeight: 160,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        footer: {
            flexDirection: "row",
            gap: 10,
            paddingHorizontal: 18,
            paddingBottom: 16,
        },
        cancelBtn: {
            flex: 1,
            paddingVertical: 11,
            borderRadius: 10,
            alignItems: "center",
            backgroundColor: colors.tag,
        },
        cancelText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        generateBtn: {
            flex: 2,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            paddingVertical: 11,
            borderRadius: 10,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        generateBtnDisabled: {
            opacity: 0.45,
            shadowOpacity: 0,
            elevation: 0,
        },
        generateText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        btnPressed: {
            opacity: 0.72,
        },
    });
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

const STATUS_ORDER: ContentStatus[] = ["draft", "review_pending", "approved"];

const STATUS_COLOR: Record<ContentStatus, string> = {
    draft: "#8B8B8B",
    review_pending: "#E07A00",
    approved: "#1A7A3A",
};

const STATUS_BG: Record<ContentStatus, string> = {
    draft: "rgba(139,139,139,0.13)",
    review_pending: "rgba(224,122,0,0.13)",
    approved: "rgba(26,122,58,0.13)",
};

const CreateContentScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const { contentId, title: paramTitle, idea: paramIdea, type: paramType, date: paramDate } =
        useLocalSearchParams<{
            contentId?: string;
            title?: string;
            idea?: string;
            type?: string;
            date?: string;
        }>();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const seedItem = useMemo(
        () => MOCK_CONTENT_ITEMS.find((i) => i.id === contentId) ?? null,
        [contentId]
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
    const [scriptAiPrompt, setScriptAiPrompt] = useState("");
    const [timeOfPosting, setTimeOfPosting] = useState(seedItem?.timeOfPosting ?? "");
    const [customTime, setCustomTime] = useState("");
    const [showCustomTime, setShowCustomTime] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCollabModal, setShowCollabModal] = useState(false);

    // ── Right side panel (comments) ───────────────────────────────────────────
    const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>("none");

    const [magicTarget, setMagicTarget] = useState<"caption" | "hashtags" | null>(null);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const contentType = (seedItem?.type ?? paramType ?? "post") as ContentType;
    const isReel = contentType === "reel";
    const isImageBased = contentType === "post" || contentType === "carousel";

    const collabSource: CollabContentSource = {
        contentId: contentId ?? `content-${Date.now()}`,
        title,
        idea,
        type: contentType,
        date: formatDateForWebInput(date),
    };

    const { updateContent } = useContents();
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
            postingTimeStamp: date ? new Date(date.toISOString().split("T")[0] + "T00:00:00Z").getTime() : undefined,
        });
        setSaveState("saved");
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setSaveState("idle"), 2000);
    }, [contentId, saveState, updateContent, title, idea, status, caption, hashtags, timeOfPosting, script, imagePrompt, date]);

    const handleCreateCollab = useCallback(() => {
        setShowCollabModal(true);
    }, []);

    const handleMagicGenerate = useCallback(
        (prompt: string) => {
            const platform = "Instagram";
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

    const handleImageGenerate = useCallback(() => {
        if (!imagePrompt.trim()) return;
        setIsGeneratingImage(true);
        generateImage({
            description: imagePrompt,
            aspectRatio: contentType === "reel" ? "9:16" : "1:1",
            count: 1,
        });
    }, [imagePrompt, contentType, generateImage]);

    // React to AI generation results streaming back from the backend.

    // Captions: take the first variant and apply it. The MagicPromptModal closes
    // on apply via its own onGenerate flow; we just clear magicTarget when done.
    useEffect(() => {
        if (magicTarget !== "caption" || aiCaptions.length === 0) return;
        setCaption(aiCaptions[0].text);
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

    // Image: alert with the result URL on completion. The existing UI doesn't
    // host an image preview slot, so this preserves the original mock behavior
    // but now shows a real S3 URL.
    useEffect(() => {
        if (!isGeneratingImage) return;
        if (imagesStreaming) return;
        if (aiImages.length === 0) return;
        Alert.alert("Image generated", aiImages[aiImages.length - 1].s3Url);
        setIsGeneratingImage(false);
    }, [aiImages, imagesStreaming, isGeneratingImage]);

    const formattedDate = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const headerActions = useMemo(
        () => [
            // 💬 Comments toggle
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
            >
                <FontAwesomeIcon
                    icon={faCommentDots}
                    size={15}
                    color={rightPanelMode === "comments" ? colors.onPrimary : colors.textSecondary}
                />
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
                accessibilityLabel="Save"
            >
                {saveState === "saving" ? (
                    xl ? <Text style={styles.saveBtnText}>Saving…</Text> : <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                    <>
                        <FontAwesomeIcon icon={faCheck} size={13} color={colors.onPrimary} />
                        {xl && <Text style={styles.saveBtnText}>{saveState === "saved" ? "Saved" : "Save"}</Text>}
                    </>
                )}
            </Pressable>,
        ],
        [styles, colors, handleSave, saveState, rightPanelMode, xl]
    );

    return (
        <AppLayout>
            <PageHeader
                title={title || "Create Content"}
                subtitle={CONTENT_TYPE_LABELS[contentType]}
                showBackButton
                actionButtons={headerActions}
                mobileActions="all"
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
                    {/* ── Status Row ──────────────────────────────────────── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>STATUS</Text>
                        <View style={styles.statusRow}>
                            {STATUS_ORDER.map((s) => (
                                <Pressable
                                    key={s}
                                    style={({ pressed }) => [
                                        styles.statusChip,
                                        {
                                            backgroundColor:
                                                status === s ? STATUS_BG[s] : colors.tag,
                                        },
                                        pressed && styles.btnPressed,
                                    ]}
                                    onPress={() => setStatus(s)}
                                >
                                    <Text
                                        style={[
                                            styles.statusChipText,
                                            {
                                                color:
                                                    status === s
                                                        ? STATUS_COLOR[s]
                                                        : colors.textSecondary,
                                                fontWeight: status === s ? "700" : "500",
                                            },
                                        ]}
                                    >
                                        {CONTENT_STATUS_LABELS[s]}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* ── Calendar Stage Fields ────────────────────────────── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>CONTENT INFO</Text>
                        <View style={styles.card}>
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>Type</Text>
                                <View style={styles.typeTag}>
                                    <Text style={styles.typeTagText}>
                                        {CONTENT_TYPE_LABELS[contentType]}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.fieldDivider} />

                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>Date of Posting</Text>
                                <Pressable
                                    style={styles.dateBtn}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <FontAwesomeIcon
                                        icon={faCalendarDays}
                                        size={12}
                                        color={colors.primary}
                                    />
                                    <Text style={styles.dateBtnText}>{formattedDate}</Text>
                                </Pressable>
                            </View>

                            <View style={styles.fieldDivider} />

                            <Text style={styles.fieldLabel}>Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="E.g. Founder Story Launch Reel"
                                placeholderTextColor={colors.textSecondary}
                                value={title}
                                onChangeText={setTitle}
                                maxLength={120}
                            />

                            <Text style={[styles.fieldLabel, styles.mt12]}>Idea / Vision</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe the concept, mood, or key message..."
                                placeholderTextColor={colors.textSecondary}
                                value={idea}
                                onChangeText={setIdea}
                                multiline
                                maxLength={500}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* ── Content Format ───────────────────────────────────── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>CONTENT FORMAT</Text>

                        {isReel ? (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Reel Script</Text>
                                <Text style={styles.cardSub}>
                                    Write your full reel script with scene transitions, dialogue, and
                                    direction notes.
                                </Text>
                                <TextInput
                                    style={[styles.input, styles.scriptArea]}
                                    placeholder={"[Scene 1 - Hook]\nHey everyone...\n\n[Scene 2 - Main content]\n...\n\n[Scene 3 - CTA]\nFollow for more!"}
                                    placeholderTextColor={colors.textSecondary}
                                    value={script}
                                    onChangeText={setScript}
                                    multiline
                                    textAlignVertical="top"
                                />

                                <View style={styles.aiPromptRow}>
                                    <TextInput
                                        style={[styles.input, styles.aiPromptInput]}
                                        placeholder="Describe changes or ask AI to generate script..."
                                        placeholderTextColor={colors.textSecondary}
                                        value={scriptAiPrompt}
                                        onChangeText={setScriptAiPrompt}
                                    />
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.aiSendBtn,
                                            !scriptAiPrompt.trim() && styles.aiSendBtnDisabled,
                                            pressed && styles.btnPressed,
                                        ]}
                                        onPress={handleScriptAiEnhance}
                                        disabled={!scriptAiPrompt.trim() || isGeneratingScript}
                                    >
                                        <FontAwesomeIcon
                                            icon={faMagicWandSparkles}
                                            size={14}
                                            color={colors.onPrimary}
                                        />
                                        <Text style={styles.aiSendBtnText}>
                                            {isGeneratingScript ? "Generating..." : "Enhance"}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        ) : isImageBased ? (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Image Generation</Text>
                                <Text style={styles.cardSub}>
                                    Describe the visual you want. Add iterative instructions to
                                    refine and generate variations.
                                </Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="E.g. Bold minimal design, product centred on white background, brand colours: deep blue and white..."
                                    placeholderTextColor={colors.textSecondary}
                                    value={imagePrompt}
                                    onChangeText={setImagePrompt}
                                    multiline
                                    maxLength={600}
                                    textAlignVertical="top"
                                />
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.generateImgBtn,
                                        !imagePrompt.trim() && styles.generateImgBtnDisabled,
                                        pressed && styles.btnPressed,
                                    ]}
                                    onPress={handleImageGenerate}
                                    disabled={!imagePrompt.trim() || isGeneratingImage}
                                >
                                    <FontAwesomeIcon
                                        icon={faMagicWandSparkles}
                                        size={14}
                                        color={colors.onPrimary}
                                    />
                                    <Text style={styles.generateImgBtnText}>
                                        {isGeneratingImage
                                            ? "Generating Image..."
                                            : "Generate Image"}
                                    </Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.card}>
                                <Text style={styles.cardSub}>
                                    Content format tooling is not available for{" "}
                                    <Text style={{ fontWeight: "700" }}>
                                        {CONTENT_TYPE_LABELS[contentType]}
                                    </Text>{" "}
                                    type yet.
                                </Text>
                            </View>
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

                    {/* ── Time of Posting ───────────────────────────────────── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>TIME OF POSTING</Text>
                        <View style={styles.card}>
                            <Text style={styles.cardSub}>
                                Pick a popular time or set your own.
                            </Text>
                            <View style={styles.timeRow}>
                                {POPULAR_POSTING_TIMES.map((t) => (
                                    <Pressable
                                        key={t.value}
                                        style={({ pressed }) => [
                                            styles.timeChip,
                                            timeOfPosting === t.value && styles.timeChipActive,
                                            pressed && styles.btnPressed,
                                        ]}
                                        onPress={() => {
                                            setTimeOfPosting(t.value);
                                            setShowCustomTime(false);
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={faClock}
                                            size={11}
                                            color={
                                                timeOfPosting === t.value
                                                    ? colors.onPrimary
                                                    : colors.textSecondary
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.timeChipText,
                                                timeOfPosting === t.value &&
                                                    styles.timeChipTextActive,
                                            ]}
                                        >
                                            {t.label}
                                        </Text>
                                    </Pressable>
                                ))}
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.timeChip,
                                        showCustomTime && styles.timeChipActive,
                                        pressed && styles.btnPressed,
                                    ]}
                                    onPress={() => {
                                        setShowCustomTime((v) => !v);
                                        if (!showCustomTime) setTimeOfPosting("");
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.timeChipText,
                                            showCustomTime && styles.timeChipTextActive,
                                        ]}
                                    >
                                        Custom
                                    </Text>
                                </Pressable>
                            </View>

                            {showCustomTime && (
                                <TextInput
                                    style={[styles.input, styles.mt12]}
                                    placeholder="HH:MM (e.g. 08:30)"
                                    placeholderTextColor={colors.textSecondary}
                                    value={customTime}
                                    onChangeText={(v) => {
                                        setCustomTime(v);
                                        setTimeOfPosting(v);
                                    }}
                                    maxLength={5}
                                    keyboardType="numbers-and-punctuation"
                                />
                            )}
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
                                    onCollapse={() => setRightPanelMode("none")}
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

            <MagicPromptModal
                visible={magicTarget !== null}
                title={
                    magicTarget === "caption"
                        ? "Generate Caption with AI"
                        : "Generate Hashtags with AI"
                }
                placeholder={
                    magicTarget === "caption"
                        ? "Describe the tone: funny, professional, motivational... or paste your draft to enhance it."
                        : "Describe your niche, product, or target audience for relevant hashtags."
                }
                onClose={() => setMagicTarget(null)}
                onGenerate={handleMagicGenerate}
            />

            <CreateCollabFromContentModal
                visible={showCollabModal}
                content={collabSource}
                onClose={() => setShowCollabModal(false)}
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
                    flex: 0,
                    width: 24,
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
                fieldRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 4,
                },
                fieldDivider: {
                    height: 10,
                },
                fieldLabel: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 6,
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
                dateBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: colors.aliceBlue,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                dateBtnText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.primary,
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
                textArea: {
                    minHeight: 90,
                    maxHeight: 180,
                },
                textAreaShort: {
                    minHeight: 70,
                    maxHeight: 140,
                },
                scriptArea: {
                    minHeight: 200,
                    maxHeight: 380,
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                    fontSize: 13,
                    lineHeight: 20,
                    marginBottom: 12,
                },
                aiPromptRow: {
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                },
                aiPromptInput: {
                    flex: 1,
                },
                aiSendBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                aiSendBtnDisabled: {
                    opacity: 0.45,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                aiSendBtnText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.onPrimary,
                },
                generateImgBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    marginTop: 4,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                generateImgBtnDisabled: {
                    opacity: 0.45,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                generateImgBtnText: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.onPrimary,
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
                statusRow: {
                    flexDirection: "row",
                    gap: 8,
                    flexWrap: "wrap",
                },
                statusChip: {
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                statusChipText: {
                    fontSize: 13,
                },
                timeRow: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                },
                timeChip: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                timeChipActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                timeChipText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                timeChipTextActive: {
                    color: colors.onPrimary,
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
                    backgroundColor: "#1A7A3A",
                    shadowColor: "#1A7A3A",
                },
                saveBtnText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.onPrimary,
                },
                btnPressed: {
                    opacity: 0.72,
                },
                mt12: {
                    marginTop: 12,
                },
                bottomPad: {
                    height: 40,
                },
            }),
        [colors, xl, maxWidth]
    );
}

export default CreateContentScreen;
