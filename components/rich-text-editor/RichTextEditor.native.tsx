import Colors from "@/shared-uis/constants/Colors";
import { ensureEnrichedHtml } from "@/utils/rich-text";
import {
    faBold,
    faCheck,
    faChevronDown,
    faCommentDots,
    faImage,
    faItalic,
    faLink,
    faListOl,
    faListUl,
    faLock,
    faPen,
    faStrikethrough,
    faUnderline
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    EnrichedTextInput,
    type EnrichedTextInputInstance,
    type HtmlStyle,
    type OnChangeStateEvent,
} from "react-native-enriched";
import AIQuickEditModal from "@/components/ai/AIQuickEdit/AIQuickEditModal";
import { useBreakpoints } from "@/hooks";
import ImageInsertModal from "./ImageInsertModal";
import LinkInsertModal from "./LinkInsertModal";

/** Hard ceiling (px) for an inserted image's display width. */
const MAX_IMAGE_WIDTH = 720;

/** Height of the keyboard-docked formatting bar (used to reserve scroll room). */
const ACCESSORY_HEIGHT = 48;

/**
 * Resolves an image URL's display dimensions, scaled down to fit `maxWidth`
 * (and never upscaled past the source). Returns a sane fallback if the size
 * can't be read.
 */
async function resolveImageSize(
    url: string,
    maxWidth: number
): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
        Image.getSize(
            url,
            (w, h) => {
                if (!w || !h) return resolve({ width: maxWidth, height: Math.round(maxWidth * 0.6) });
                const ratio = w > maxWidth ? maxWidth / w : 1;
                resolve({ width: Math.round(w * ratio), height: Math.round(h * ratio) });
            },
            () => resolve({ width: maxWidth, height: Math.round(maxWidth * 0.6) })
        );
    });
}

export interface EditLockUI {
    editable: boolean;
    lockedByName?: string | null;
    onRequestEdit?: () => void;
    onEndEdit?: () => void;
    /** Strategy is finalized (pushed to calendar) → read-only; the lock bar
     *  points at duplicate and the "Edit" affordance is withheld. */
    finalized?: boolean;
}

export interface StrategyEditorPanelProps {
    content: string;
    onChange: (text: string) => void;
    onSendToChat: (text: string) => void;
    onSnippetComment?: (snippet: string, anchorStart: number, anchorEnd: number) => void;
    /** Context ID passed to AI features (Quick Edit, Chat). */
    strategyId?: string;
    /** AI module used for Quick Edit context. Defaults to "content". */
    module?: string;
    /** Web-only collaboration flag — ignored on native (single-writer). */
    collaborative?: boolean;
    /**
     * Single-writer lock state (Phase 3). On native this drives the read-only /
     * "Edit" / "Done" bar: the device must hold the lock to type.
     */
    lock?: EditLockUI;
}

const StrategyEditorPanel: React.FC<StrategyEditorPanelProps> = ({
    content,
    onChange,
    onSendToChat,
    onSnippetComment,
    strategyId,
    module: aiModule = "content",
    lock,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { width } = useBreakpoints();

    // Native is the single-writer surface: editable only while this device holds
    // the lock. When `lock` is omitted (e.g. ScriptEditor), stay fully editable.
    const editable = lock ? lock.editable : true;
    const editorRef = useRef<EnrichedTextInputInstance>(null);
    const [stylesState, setStylesState] = useState<OnChangeStateEvent | null>(null);
    // Track keyboard visibility + height so the formatting bar can dock to the
    // top of the keyboard (an input-accessory style bar) and disappear with it.
    const [keyboard, setKeyboard] = useState({ visible: false, height: 0 });
    // Selection-gated actions (Quick Edit, Comment) only appear when the user
    // has an actual text selection in the editor.
    const [hasSelection, setHasSelection] = useState(false);
    const [quickEditVisible, setQuickEditVisible] = useState(false);
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    // Latest editor selection — captured here because opening a modal blurs the
    // editor and clears the live selection by the time we need start/end.
    const selectionRef = useRef<{ start: number; end: number; text: string }>({
        start: 0,
        end: 0,
        text: "",
    });

    const styles = useMemo(() => makeStyles(colors), [colors]);

    // react-native-enriched exposes no per-block margins, and it ignores the
    // RN `lineHeight` style on native — so block spacing (line leading + gaps
    // between paragraphs/headings) is supplied by our patch-package patch to
    // the native module (see patches/react-native-enriched+0.2.1.patch:
    // iOS lineHeightMultiple + paragraphSpacing, Android setLineSpacing). That
    // makes native spacing mirror the web (Lexical) editor. Here we only set
    // the heading hierarchy; sizes mirror the web editor's proportions.
    const htmlStyle = useMemo<HtmlStyle>(
        () => ({
            h1: { fontSize: 26, bold: true },
            h2: { fontSize: 22, bold: true },
            h3: { fontSize: 19, bold: true },
            blockquote: { borderColor: colors.border, color: colors.textSecondary },
            code: { color: colors.text, backgroundColor: colors.tag },
            codeblock: { color: colors.text, backgroundColor: colors.tag },
            a: { color: colors.primary, textDecorationLine: "underline" },
        }),
        [colors]
    );

    // Watch the keyboard so the formatting bar can sit flush on top of it and
    // vanish when it closes. iOS fires the *Will* events (smoother, with the
    // animation); Android only fires the *Did* events.
    useEffect(() => {
        const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const show = Keyboard.addListener(showEvt, (e) =>
            setKeyboard({ visible: true, height: e.endCoordinates?.height ?? 0 })
        );
        const hide = Keyboard.addListener(hideEvt, () =>
            setKeyboard({ visible: false, height: 0 })
        );
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    // "Edit" → drop the user straight into typing: as soon as the device takes
    // the lock (editable flips false→true), focus the editor so the keyboard
    // opens instantly. We only react to the transition so a screen that mounts
    // already-editable (e.g. ScriptEditor) doesn't steal focus on load.
    const prevEditableRef = useRef(editable);
    useEffect(() => {
        if (editable && !prevEditableRef.current) {
            // Defer a tick so the native input has applied editable=true before
            // we ask it to become first responder.
            const t = setTimeout(() => editorRef.current?.focus(), 50);
            prevEditableRef.current = editable;
            return () => clearTimeout(t);
        }
        prevEditableRef.current = editable;
    }, [editable]);

    const dismissKeyboard = useCallback(() => {
        editorRef.current?.blur();
        Keyboard.dismiss();
    }, []);

    // Quick Edit takes the entire current content as the "selected text" and
    // applies the AI-rewritten result as the new content. (The native rich-text
    // engine has no replace-range API, so the rewrite is whole-document; the
    // button is only offered once the user has made a selection.)
    const handleAIQuickEditAccept = useCallback(
        (newText: string) => {
            onChange(newText);
            setQuickEditVisible(false);
        },
        [onChange]
    );

    const openQuickEdit = useCallback(() => {
        // Close the keyboard so the Quick Edit modal isn't crowded by it.
        dismissKeyboard();
        setQuickEditVisible(true);
    }, [dismissKeyboard]);

    // Comment on the current selection. Selection offsets/text are captured live
    // in selectionRef (the modal/popover blurs the editor, clearing the live
    // selection by the time we read it).
    const handleComment = useCallback(() => {
        const { start, end, text } = selectionRef.current;
        if (!text || !onSnippetComment) return;
        dismissKeyboard();
        onSnippetComment(text, start, end);
    }, [onSnippetComment, dismissKeyboard]);

    // Apply a link to the captured selection, or insert a new link at the caret.
    const handleInsertLink = useCallback((text: string, url: string) => {
        const { start, end } = selectionRef.current;
        editorRef.current?.setLink(start, end, text, url);
    }, []);

    // Resolve display size (capped to 720px, but never wider than the editor),
    // then embed the (already uploaded) image URL.
    const handleInsertImage = useCallback(
        async (imageUrl: string) => {
            // 40 ≈ editor's 20px horizontal padding on each side.
            const maxWidth = Math.min(MAX_IMAGE_WIDTH, Math.max(120, width - 40));
            const size = await resolveImageSize(imageUrl, maxWidth);
            editorRef.current?.setImage(imageUrl, size.width, size.height);
        },
        [width]
    );

    const formatButtons = [
        {
            icon: faBold,
            label: "Bold",
            isActive: stylesState?.isBold ?? false,
            onPress: () => editorRef.current?.toggleBold(),
        },
        {
            icon: faItalic,
            label: "Italic",
            isActive: stylesState?.isItalic ?? false,
            onPress: () => editorRef.current?.toggleItalic(),
        },
        {
            icon: faUnderline,
            label: "Underline",
            isActive: stylesState?.isUnderline ?? false,
            onPress: () => editorRef.current?.toggleUnderline(),
        },
        {
            icon: faStrikethrough,
            label: "Strike",
            isActive: stylesState?.isStrikeThrough ?? false,
            onPress: () => editorRef.current?.toggleStrikeThrough(),
        },
        {
            icon: faListUl,
            label: "Bullet list",
            isActive: stylesState?.isUnorderedList ?? false,
            onPress: () => editorRef.current?.toggleUnorderedList(),
        },
        {
            icon: faListOl,
            label: "Ordered list",
            isActive: stylesState?.isOrderedList ?? false,
            onPress: () => editorRef.current?.toggleOrderedList(),
        },
        {
            icon: faLink,
            label: "Insert link",
            isActive: stylesState?.isLink ?? false,
            onPress: () => setLinkModalVisible(true),
        },
        {
            icon: faImage,
            label: "Insert image",
            isActive: false,
            onPress: () => setImageModalVisible(true),
        },
    ];

    return (
        <View style={styles.container}>
            {/* ── Top bar: selection actions + "Done" (editing) or lock bar ──────
                Formatting controls dock to the top of the keyboard (accessory bar
                below). The top bar hosts the selection-gated Comment / Quick Edit
                actions on the left and "Done" on the right. It's only rendered
                when it has something to show (a Done action or a live selection). */}
            {editable ? (
                lock?.onEndEdit || hasSelection ? (
                    <View style={styles.topBar}>
                        <View style={styles.topBarLeft}>
                            {/* Comment + Quick Edit only make sense on a selection. */}
                            {hasSelection && onSnippetComment && (
                                <Pressable
                                    style={styles.selectionAction}
                                    onPress={handleComment}
                                    accessibilityLabel="Comment on selection"
                                >
                                    <FontAwesomeIcon icon={faCommentDots} size={12} color={colors.secondaryText} />
                                    <Text style={styles.selectionActionText}>Comment</Text>
                                </Pressable>
                            )}
                            {hasSelection && (
                                <Pressable
                                    style={styles.selectionAction}
                                    onPress={openQuickEdit}
                                    accessibilityLabel="Quick Edit with AI"
                                >
                                    <FontAwesomeIcon icon={faPen} size={12} color={colors.secondaryText} />
                                    <Text style={styles.selectionActionText}>Quick Edit</Text>
                                </Pressable>
                            )}
                        </View>
                        {/* "Done" releases the lock so web can resume co-editing. */}
                        {lock?.onEndEdit && (
                            <Pressable style={styles.doneAction} onPress={lock.onEndEdit}>
                                <FontAwesomeIcon icon={faCheck} size={12} color={colors.onPrimary} />
                                <Text style={styles.doneActionText}>Done</Text>
                            </Pressable>
                        )}
                    </View>
                ) : null
            ) : (
                <View style={styles.lockBar}>
                    <FontAwesomeIcon icon={faLock} size={13} color={colors.textSecondary} />
                    <Text style={styles.lockBarText} numberOfLines={1}>
                        {lock?.finalized
                            ? "Finalized — duplicate to edit"
                            : lock?.lockedByName
                            ? `${lock.lockedByName} is editing`
                            : "View only"}
                    </Text>
                    {!lock?.finalized && !lock?.lockedByName && lock?.onRequestEdit && (
                        <Pressable style={styles.editAction} onPress={lock.onRequestEdit}>
                            <FontAwesomeIcon icon={faPen} size={12} color={colors.onPrimary} />
                            <Text style={styles.editActionText}>Edit</Text>
                        </Pressable>
                    )}
                </View>
            )}

            {/* ── Editor ───────────────────────────────────────────────────── */}
            <KeyboardAvoidingView
                style={styles.kavContainer}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={styles.editorScroll}
                    contentContainerStyle={[
                        styles.editorScrollContent,
                        // Reserve room so the last line clears the keyboard-docked
                        // formatting bar instead of hiding behind it.
                        keyboard.visible && { paddingBottom: ACCESSORY_HEIGHT },
                    ]}
                    keyboardShouldPersistTaps="handled"
                >
                    <EnrichedTextInput
                        ref={editorRef}
                        editable={editable}
                        htmlStyle={htmlStyle}
                        defaultValue={ensureEnrichedHtml(content || "")}
                        // Run native output through the same canonical normaliser
                        // the web editor uses, so both export identical rich text.
                        onChangeHtml={(event) =>
                            onChange(ensureEnrichedHtml(event.nativeEvent.value))
                        }
                        onChangeState={(event) => setStylesState(event.nativeEvent)}
                        onChangeSelection={(event) => {
                            selectionRef.current = event.nativeEvent;
                            setHasSelection(event.nativeEvent.end > event.nativeEvent.start);
                        }}
                        placeholder="Write your content strategy..."
                        placeholderTextColor={colors.textSecondary}
                        style={{
                            ...styles.editor,
                            backgroundColor: colors.background,
                            borderColor: colors.outline,
                            color: colors.text,
                        }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Formatting accessory — docked to the top of the keyboard ─────
                Sits flush above the keyboard while editing (input-accessory
                style). Holds the format buttons plus the selection-gated
                Quick Edit / Comment actions and a keyboard-collapse button. */}
            {editable && keyboard.visible && (
                <View style={[styles.accessory, { bottom: keyboard.height }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.toolbarScroll}
                        contentContainerStyle={styles.toolbarLeft}
                        keyboardShouldPersistTaps="handled"
                    >
                        {formatButtons.map((btn) => (
                            <Pressable
                                key={btn.label}
                                style={({ pressed }) => [
                                    styles.toolbarBtn,
                                    btn.isActive && styles.toolbarBtnActive,
                                    pressed && styles.toolbarBtnPressed,
                                ]}
                                onPress={btn.onPress}
                                accessibilityLabel={btn.label}
                            >
                                <FontAwesomeIcon
                                    icon={btn.icon}
                                    size={13}
                                    color={btn.isActive ? colors.onPrimary : colors.textSecondary}
                                />
                            </Pressable>
                        ))}
                    </ScrollView>

                    <View style={styles.toolbarRight}>
                        {/* Collapse-keyboard button — iOS keyboards lack one. */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.dismissBtn,
                                pressed && styles.toolbarBtnPressed,
                            ]}
                            onPress={dismissKeyboard}
                            hitSlop={6}
                            accessibilityLabel="Collapse keyboard"
                        >
                            <FontAwesomeIcon
                                icon={faChevronDown}
                                size={13}
                                color={colors.textSecondary}
                            />
                        </Pressable>
                    </View>
                </View>
            )}

            {/* ── AI Quick Edit modal — streaming, with Accept/Discard ──── */}
            <AIQuickEditModal
                visible={quickEditVisible}
                onClose={() => setQuickEditVisible(false)}
                selectedText={content}
                module={aiModule}
                contextId={strategyId}
                onAccept={handleAIQuickEditAccept}
            />

            {/* ── Link insertion ──────────────────────────────────────────── */}
            <LinkInsertModal
                visible={linkModalVisible}
                initialText={selectionRef.current.text}
                onClose={() => setLinkModalVisible(false)}
                onInsert={handleInsertLink}
            />

            {/* ── Image insertion (upload via AWS or paste URL) ───────────── */}
            <ImageInsertModal
                visible={imageModalVisible}
                onClose={() => setImageModalVisible(false)}
                onInsert={handleInsertImage}
            />
        </View>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        container: {
            flex: 1,
        },
        topBar: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        topBarLeft: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            flexShrink: 1,
        },
        // Formatting bar docked to the top edge of the keyboard. Absolutely
        // positioned; `bottom` is set dynamically to the live keyboard height.
        accessory: {
            position: "absolute",
            left: 0,
            right: 0,
            height: ACCESSORY_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
            backgroundColor: colors.card,
            zIndex: 10,
            // Upward shadow so it reads as a layer floating over the editor.
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowRadius: 8,
            shadowOpacity: 0.08,
            elevation: 8,
        },
        toolbarScroll: {
            flex: 1,
        },
        toolbarLeft: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingRight: 8,
        },
        toolbarRight: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
            paddingLeft: 8,
        },
        lockBar: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 11,
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        lockBarText: {
            flex: 1,
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        editAction: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        editActionText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        doneAction: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 10,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        doneActionText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        toolbarBtn: {
            width: 30,
            height: 30,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.background,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.06,
            elevation: 1,
        },
        toolbarBtnActive: {
            backgroundColor: colors.primary,
            shadowOpacity: 0,
            elevation: 0,
        },
        toolbarBtnPressed: {
            backgroundColor: colors.aliceBlue,
            shadowOpacity: 0,
            elevation: 0,
        },
        dismissBtn: {
            width: 30,
            height: 30,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.background,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.06,
            elevation: 1,
        },
        selectionAction: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 6,
            backgroundColor: colors.secondarySurface,
            borderWidth: 1,
            borderColor: colors.secondaryBorder,
        },
        selectionActionText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.secondaryText,
        },
        kavContainer: {
            flex: 1,
        },
        editorScroll: {
            flex: 1,
        },
        editorScrollContent: {
            flexGrow: 1,
        },
        editor: {
            flex: 1,
            width: "100%",
            maxWidth: 760,
            alignSelf: "center",
            minHeight: 400,
            padding: 20,
            fontSize: 16,
            lineHeight: 26,
            textAlignVertical: "top",
        },
    });
}

export default StrategyEditorPanel;
