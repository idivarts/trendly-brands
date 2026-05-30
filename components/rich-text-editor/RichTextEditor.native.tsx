import Colors from "@/shared-uis/constants/Colors";
import { ensureEnrichedHtml } from "@/utils/rich-text";
import {
    faBold,
    faImage,
    faItalic,
    faLink,
    faListOl,
    faListUl,
    faPen,
    faStrikethrough,
    faUnderline
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Image,
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
    type OnChangeStateEvent,
} from "react-native-enriched";
import AIQuickEditModal from "@/components/ai/AIQuickEdit/AIQuickEditModal";
import { useBreakpoints } from "@/hooks";
import ImageInsertModal from "./ImageInsertModal";
import LinkInsertModal from "./LinkInsertModal";

/** Hard ceiling (px) for an inserted image's display width. */
const MAX_IMAGE_WIDTH = 720;

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

export interface StrategyEditorPanelProps {
    content: string;
    onChange: (text: string) => void;
    onSendToChat: (text: string) => void;
    onSnippetComment?: (snippet: string, anchorStart: number, anchorEnd: number) => void;
    /** Context ID passed to AI features (Quick Edit, Chat). */
    strategyId?: string;
    /** AI module used for Quick Edit context. Defaults to "content". */
    module?: string;
}

const StrategyEditorPanel: React.FC<StrategyEditorPanelProps> = ({
    content,
    onChange,
    onSendToChat,
    onSnippetComment,
    strategyId,
    module: aiModule = "content",
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { width } = useBreakpoints();
    const editorRef = useRef<EnrichedTextInputInstance>(null);
    const [stylesState, setStylesState] = useState<OnChangeStateEvent | null>(null);
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

    // react-native-enriched does not expose selected text directly via state,
    // so selection-based actions (Send to Chat, Comment) are limited on native.
    // Quick Edit takes the entire current content as the "selected text" and
    // applies the AI-rewritten result as the new content.
    const handleAIQuickEditAccept = useCallback(
        (newText: string) => {
            onChange(newText);
            setQuickEditVisible(false);
        },
        [onChange]
    );

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
            {/* ── Toolbar ──────────────────────────────────────────────────── */}
            <View style={styles.toolbar}>
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

                {/* Quick Edit always available on native (no selection required) */}
                <View style={styles.toolbarRight}>
                    <Pressable
                        style={styles.selectionAction}
                        onPress={() => setQuickEditVisible(true)}
                    >
                        <FontAwesomeIcon icon={faPen} size={12} color={colors.secondaryText} />
                        <Text style={styles.selectionActionText}>Quick Edit</Text>
                    </Pressable>
                </View>
            </View>

            {/* ── Editor ───────────────────────────────────────────────────── */}
            <KeyboardAvoidingView
                style={styles.kavContainer}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 180 : 0}
            >
                <ScrollView
                    style={styles.editorScroll}
                    contentContainerStyle={styles.editorScrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <EnrichedTextInput
                        ref={editorRef}
                        defaultValue={ensureEnrichedHtml(content || "")}
                        // Run native output through the same canonical normaliser
                        // the web editor uses, so both export identical rich text.
                        onChangeHtml={(event) =>
                            onChange(ensureEnrichedHtml(event.nativeEvent.value))
                        }
                        onChangeState={(event) => setStylesState(event.nativeEvent)}
                        onChangeSelection={(event) => {
                            selectionRef.current = event.nativeEvent;
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
        toolbar: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
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
            minHeight: 400,
            padding: 20,
            fontSize: 16,
            lineHeight: 24,
            textAlignVertical: "top",
        },
    });
}

export default StrategyEditorPanel;
