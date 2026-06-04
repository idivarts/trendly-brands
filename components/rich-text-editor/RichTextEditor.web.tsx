import AIQuickEditModal from "@/components/ai/AIQuickEdit/AIQuickEditModal";
import Colors from "@/shared-uis/constants/Colors";
import { ensureEnrichedHtml } from "@/utils/rich-text";
import {
    faBold,
    faCommentDots,
    faEraser,
    faImage,
    faItalic,
    faLink,
    faListOl,
    faListUl,
    faPen,
    faQuoteLeft,
    faShareNodes,
    faStrikethrough,
    faUnderline,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { $createLinkNode, $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
    $isListNode,
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    ListItemNode,
    ListNode,
    REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
    $createHeadingNode,
    $createQuoteNode,
    $isHeadingNode,
    $isQuoteNode,
    HeadingNode,
    QuoteNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $findMatchingParent } from "@lexical/utils";
import {
    $createParagraphNode,
    $createRangeSelection,
    $createTextNode,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    $setSelection,
    FORMAT_TEXT_COMMAND,
    type EditorState,
    type LexicalEditor,
    type TextFormatType,
} from "lexical";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ImageInsertModal from "./ImageInsertModal";
import { $createImageNode, ImageNode } from "./lexical/ImageNode";
import { $serializeToEnrichedInner, $setEditorContentFromHtml } from "./lexical/serialize";
import LinkInsertModal from "./LinkInsertModal";

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

const STYLE_ID = "trendly-lexical-core-css";

/** Lexical theme — class names the editor stamps onto rendered nodes. */
const EDITOR_THEME = {
    paragraph: "tl-p",
    quote: "tl-quote",
    heading: { h1: "tl-h1", h2: "tl-h2", h3: "tl-h3" },
    list: { ul: "tl-ul", ol: "tl-ol", listitem: "tl-li" },
    link: "tl-a",
    code: "tl-codeblock",
    text: {
        bold: "tl-b",
        italic: "tl-i",
        underline: "tl-u",
        strikethrough: "tl-s",
        code: "tl-code",
    },
};

/** Hard ceiling (px) for an inserted image's display width. */
const MAX_IMAGE_WIDTH = 720;

function injectStyles(colors: ReturnType<typeof Colors>) {
    if (typeof document === "undefined") return;
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
    }
    style.textContent = `
        .tl-scroll { position: relative; }
        .tl-content {
            box-sizing: border-box;
            width: 100%;
            max-width: 760px;
            margin: 0 auto;
            min-height: 400px;
            padding: 20px;
            outline: none;
            line-height: 1.6;
            font-size: 16px;
            font-family: inherit;
            white-space: pre-wrap;
            word-wrap: break-word;
            tab-size: 4;
            color: ${colors.text as string};
            caret-color: ${colors.text as string};
        }
        .tl-content:focus { outline: none; }
        .tl-placeholder {
            position: absolute;
            top: 20px;
            left: 0;
            right: 0;
            margin: 0 auto;
            max-width: 760px;
            padding: 0 20px;
            box-sizing: border-box;
            pointer-events: none;
            font-style: italic;
            font-size: 16px;
            color: rgba(128,128,128,0.6);
        }
        .tl-content .tl-p { margin: 0 0 6px 0; font-size: 16px; }
        .tl-content .tl-h1 { font-size: 2em; font-weight: 700; margin: 0 0 8px 0; line-height: 1.2; }
        .tl-content .tl-h2 { font-size: 1.5em; font-weight: 700; margin: 0 0 8px 0; line-height: 1.3; }
        .tl-content .tl-h3 { font-size: 1.17em; font-weight: 700; margin: 0 0 8px 0; line-height: 1.4; }
        .tl-content .tl-ul,
        .tl-content .tl-ol { padding-left: 1.5em; margin: 0 0 6px 0; }
        .tl-content .tl-ul .tl-li { list-style-type: disc; }
        .tl-content .tl-ol .tl-li { list-style-type: decimal; }
        .tl-content .tl-quote {
            border-left: 4px solid ${colors.border as string};
            margin: 0 0 8px 0;
            padding-left: 16px;
            opacity: 0.8;
            font-style: italic;
        }
        .tl-content .tl-a { color: ${colors.primary as string}; text-decoration: underline; cursor: pointer; }
        .tl-content .tl-b { font-weight: 700; }
        .tl-content .tl-i { font-style: italic; }
        .tl-content .tl-u { text-decoration: underline; }
        .tl-content .tl-s { text-decoration: line-through; }
        .tl-content .tl-code { font-family: monospace; background: ${colors.tag as string}; padding: 1px 4px; border-radius: 4px; }
        .tl-content .tl-codeblock {
            display: block;
            font-family: monospace;
            background: ${colors.tag as string};
            padding: 12px;
            border-radius: 8px;
            white-space: pre-wrap;
            margin: 0 0 8px 0;
        }
        .tl-content img { display: block; max-width: min(720px, 100%); height: auto; border-radius: 8px; margin: 8px auto; }
    `;
}

/** Loads an image URL's display size, scaled to fit `maxWidth`. */
function resolveImageSize(url: string, maxWidth: number): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
        const fallback = { width: maxWidth, height: Math.round(maxWidth * 0.6) };
        if (typeof window === "undefined") return resolve(fallback);
        const img = new window.Image();
        img.onload = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            if (!w || !h) return resolve(fallback);
            const ratio = w > maxWidth ? maxWidth / w : 1;
            resolve({ width: Math.round(w * ratio), height: Math.round(h * ratio) });
        };
        img.onerror = () => resolve(fallback);
        img.src = url;
    });
}

type SavedSelection = {
    a: [string, number, "text" | "element"];
    f: [string, number, "text" | "element"];
    text: string;
} | null;

// ── Inner editor (has access to the Lexical editor via context) ─────────────

const EditorBody: React.FC<StrategyEditorPanelProps> = ({
    content,
    onChange,
    onSendToChat,
    onSnippetComment,
    strategyId,
    module: aiModule = "content",
}) => {
    const [editor] = useLexicalComposerContext();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const containerRef = useRef<HTMLDivElement>(null);
    const lastHtmlRef = useRef("");
    const savedSelRef = useRef<SavedSelection>(null);
    // Keep the latest callbacks in refs so the OnChange handler / listeners stay stable.
    const onChangeRef = useRef(onChange);
    const onSendToChatRef = useRef(onSendToChat);
    const onSnippetCommentRef = useRef(onSnippetComment);
    const selectedTextRef = useRef("");

    const [quickEditVisible, setQuickEditVisible] = useState(false);
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [linkInitialText, setLinkInitialText] = useState("");
    const [selectedText, setSelectedText] = useState("");
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strike: false,
    });
    const [dropdownValue, setDropdownValue] = useState("normal");
    const [listType, setListType] = useState<"bullet" | "number" | null>(null);
    const [blockquoteActive, setBlockquoteActive] = useState(false);
    const [linkActive, setLinkActive] = useState(false);
    const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; placement: "top" | "bottom" } | null>(null);

    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    useEffect(() => { onSendToChatRef.current = onSendToChat; }, [onSendToChat]);
    useEffect(() => { onSnippetCommentRef.current = onSnippetComment; }, [onSnippetComment]);
    useEffect(() => { selectedTextRef.current = selectedText; }, [selectedText]);

    useEffect(() => { injectStyles(colors); }, [colors]);

    // ── Position the floating selection popover ────────────────────────────────
    const computePopover = useCallback(() => {
        const container = containerRef.current;
        const domSel = typeof window !== "undefined" ? window.getSelection() : null;
        if (!container || !domSel || domSel.rangeCount === 0) { setPopoverPos(null); return; }
        const range = domSel.getRangeAt(0);
        if (range.collapsed) { setPopoverPos(null); return; }
        const rect = range.getBoundingClientRect();
        if (!rect || (rect.width === 0 && rect.height === 0)) { setPopoverPos(null); return; }
        const cRect = container.getBoundingClientRect();

        const POPOVER_HEIGHT = 40;
        const POPOVER_WIDTH = 320;
        const GAP = 8;

        const selTop = rect.top - cRect.top + container.scrollTop;
        const selLeft = rect.left - cRect.left + container.scrollLeft;
        const selCenterX = selLeft + rect.width / 2;
        const visibleTop = container.scrollTop;

        let placement: "top" | "bottom" = "top";
        let top = selTop - POPOVER_HEIGHT - GAP;
        if (top < visibleTop + 4) {
            placement = "bottom";
            top = selTop + rect.height + GAP;
        }

        const containerWidth = container.clientWidth;
        const minLeft = container.scrollLeft + 8;
        const maxLeft = Math.max(minLeft, container.scrollLeft + containerWidth - POPOVER_WIDTH - 8);
        let left = selCenterX - POPOVER_WIDTH / 2;
        left = Math.max(minLeft, Math.min(maxLeft, left));

        setPopoverPos({ top, left, placement });
    }, []);

    // ── Reflect active formats / block type + drive the popover ────────────────
    const syncToolbarState = useCallback(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            setActiveFormats({ bold: false, italic: false, underline: false, strike: false });
            setDropdownValue("normal");
            setListType(null);
            setBlockquoteActive(false);
            setLinkActive(false);
            setSelectedText("");
            setPopoverPos(null);
            return;
        }

        setActiveFormats({
            bold: selection.hasFormat("bold"),
            italic: selection.hasFormat("italic"),
            underline: selection.hasFormat("underline"),
            strike: selection.hasFormat("strikethrough"),
        });

        const anchorNode = selection.anchor.getNode();
        const topLevel = anchorNode.getKey() === "root" ? null : anchorNode.getTopLevelElement();
        let dropdown = "normal";
        let list: "bullet" | "number" | null = null;
        let quote = false;
        if (topLevel) {
            if ($isHeadingNode(topLevel)) {
                const tag = topLevel.getTag();
                dropdown = tag === "h1" || tag === "h2" || tag === "h3" ? tag : "normal";
            } else if ($isQuoteNode(topLevel)) {
                quote = true;
            } else if ($isListNode(topLevel)) {
                list = topLevel.getListType() === "number" ? "number" : "bullet";
            }
        }
        setDropdownValue(dropdown);
        setListType(list);
        setBlockquoteActive(quote);
        setLinkActive($findMatchingParent(anchorNode, (n) => $isLinkNode(n)) !== null);

        const text = selection.getTextContent();
        if (text && text.trim().length > 0 && !selection.isCollapsed()) {
            setSelectedText(text.trim());
            computePopover();
        } else {
            setSelectedText("");
            setPopoverPos(null);
        }
    }, [computePopover]);

    // ── Initial content load ───────────────────────────────────────────────────
    useEffect(() => {
        const incoming = ensureEnrichedHtml(content || "");
        lastHtmlRef.current = incoming;
        editor.update(() => $setEditorContentFromHtml(editor, incoming));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── External content sync (avoid update loops) ─────────────────────────────
    useEffect(() => {
        const incoming = ensureEnrichedHtml(content || "");
        if (incoming === lastHtmlRef.current) return;
        lastHtmlRef.current = incoming;
        editor.update(() => $setEditorContentFromHtml(editor, incoming));
    }, [content, editor]);

    // ── Active-state listener + scroll reposition ──────────────────────────────
    useEffect(() => {
        const unregister = editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => syncToolbarState());
        });
        const container = containerRef.current;
        const onScroll = () => { if (selectedTextRef.current) computePopover(); };
        container?.addEventListener("scroll", onScroll);
        return () => {
            unregister();
            container?.removeEventListener("scroll", onScroll);
        };
    }, [editor, syncToolbarState, computePopover]);

    // ── Editor → canonical HTML → onChange ─────────────────────────────────────
    const handleEditorChange = useCallback((editorState: EditorState) => {
        editorState.read(() => {
            const inner = $serializeToEnrichedInner();
            const emitted = inner ? `<html>\n${inner}\n</html>` : "";
            if (emitted !== lastHtmlRef.current) {
                lastHtmlRef.current = emitted;
                onChangeRef.current(emitted);
            }
        });
    }, []);

    // ── Selection capture / restore (modals steal focus) ───────────────────────
    const captureSelection = useCallback(() => {
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                savedSelRef.current = {
                    a: [selection.anchor.key, selection.anchor.offset, selection.anchor.type],
                    f: [selection.focus.key, selection.focus.offset, selection.focus.type],
                    text: selection.getTextContent(),
                };
            } else {
                savedSelRef.current = null;
            }
        });
    }, [editor]);

    const restoreSelection = useCallback((): boolean => {
        const saved = savedSelRef.current;
        if (!saved) return false;
        try {
            const selection = $createRangeSelection();
            selection.anchor.set(saved.a[0], saved.a[1], saved.a[2]);
            selection.focus.set(saved.f[0], saved.f[1], saved.f[2]);
            $setSelection(selection);
            return true;
        } catch {
            return false;
        }
    }, []);

    // ── Toolbar handlers ───────────────────────────────────────────────────────
    const handleInlineFormat = useCallback((format: TextFormatType) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    }, [editor]);

    const handleTextSize = useCallback((value: string) => {
        editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            if (value === "h1" || value === "h2" || value === "h3") {
                $setBlocksType(selection, () => $createHeadingNode(value));
            } else {
                $setBlocksType(selection, () => $createParagraphNode());
            }
        });
    }, [editor]);

    const handleList = useCallback((type: "bullet" | "number") => {
        if (listType === type) {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        } else if (type === "bullet") {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }
    }, [editor, listType]);

    const handleBlockquote = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            $setBlocksType(selection, () => (blockquoteActive ? $createParagraphNode() : $createQuoteNode()));
        });
    }, [editor, blockquoteActive]);

    const handleClearFormat = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            selection.getNodes().forEach((node) => {
                if ($isTextNode(node)) {
                    node.setFormat(0);
                    node.setStyle("");
                }
            });
            $setBlocksType(selection, () => $createParagraphNode());
        });
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }, [editor]);

    // ── Link & image insertion ─────────────────────────────────────────────────
    const openLinkModal = useCallback(() => {
        captureSelection();
        setLinkInitialText(savedSelRef.current?.text?.trim() ?? "");
        setLinkModalVisible(true);
    }, [captureSelection]);

    const openImageModal = useCallback(() => {
        captureSelection();
        setImageModalVisible(true);
    }, [captureSelection]);

    const handleInsertLink = useCallback((text: string, url: string) => {
        editor.update(() => {
            const restored = restoreSelection();
            const linkNode = $createLinkNode(url);
            linkNode.append($createTextNode(text || url));
            const selection = $getSelection();
            if (restored && $isRangeSelection(selection)) {
                selection.insertNodes([linkNode]);
            } else {
                const paragraph = $createParagraphNode();
                paragraph.append(linkNode);
                $getRoot().append(paragraph);
            }
        });
    }, [editor, restoreSelection]);

    const handleInsertImage = useCallback(async (imageUrl: string) => {
        const containerWidth = containerRef.current?.clientWidth ?? MAX_IMAGE_WIDTH;
        const maxWidth = Math.min(MAX_IMAGE_WIDTH, Math.max(120, containerWidth - 40));
        const size = await resolveImageSize(imageUrl, maxWidth);
        editor.update(() => {
            const restored = restoreSelection();
            const imageNode = $createImageNode({ src: imageUrl, width: size.width, height: size.height });
            const selection = $getSelection();
            if (restored && $isRangeSelection(selection)) {
                selection.insertNodes([imageNode]);
            } else {
                const paragraph = $createParagraphNode();
                paragraph.append(imageNode);
                $getRoot().append(paragraph);
            }
        });
    }, [editor, restoreSelection]);

    // ── Selection-aware actions ────────────────────────────────────────────────
    const handleQuickEditOpen = useCallback(() => {
        captureSelection();
        setQuickEditVisible(true);
    }, [captureSelection]);

    const handleAIQuickEditAccept = useCallback((newText: string) => {
        editor.update(() => {
            const restored = restoreSelection();
            const selection = $getSelection();
            if (restored && $isRangeSelection(selection)) {
                selection.insertText(newText);
            }
        });
        setQuickEditVisible(false);
    }, [editor, restoreSelection]);

    const handleSendToChat = useCallback(() => {
        if (selectedText) onSendToChatRef.current(selectedText);
    }, [selectedText]);

    const handleSnippetComment = useCallback(() => {
        const snippet = selectedText;
        if (!snippet || !onSnippetCommentRef.current) return;
        editor.getEditorState().read(() => {
            const full = $getRoot().getTextContent();
            const start = full.indexOf(snippet);
            const anchorStart = start < 0 ? 0 : start;
            const anchorEnd = start < 0 ? snippet.length : start + snippet.length;
            onSnippetCommentRef.current?.(snippet, anchorStart, anchorEnd);
        });
    }, [editor, selectedText]);

    // ── Toolbar config ─────────────────────────────────────────────────────────
    const inlineButtons: { icon: typeof faBold; label: string; format: TextFormatType; active: boolean }[] = [
        { icon: faBold, label: "Bold", format: "bold", active: activeFormats.bold },
        { icon: faItalic, label: "Italic", format: "italic", active: activeFormats.italic },
        { icon: faUnderline, label: "Underline", format: "underline", active: activeFormats.underline },
        { icon: faStrikethrough, label: "Strike", format: "strikethrough", active: activeFormats.strike },
    ];

    const hasSelection = selectedText.length > 0;

    const selectStyle: React.CSSProperties = {
        height: 30,
        borderRadius: 6,
        border: `1px solid ${colors.outline as string}`,
        paddingLeft: 6,
        paddingRight: 4,
        fontSize: 12,
        fontWeight: "600",
        color: colors.textSecondary as string,
        backgroundColor: colors.background as string,
        cursor: "pointer",
        outline: "none",
        marginRight: 6,
    };

    return (
        <View style={styles.container}>
            {/* ── Toolbar ──────────────────────────────────────────────────── */}
            <View style={styles.toolbar}>
                <View style={styles.toolbarLeft}>
                    <select value={dropdownValue} onChange={(e) => handleTextSize(e.target.value)} style={selectStyle}>
                        <option value="normal">Normal</option>
                        <option value="h1">H1</option>
                        <option value="h2">H2</option>
                        <option value="h3">H3</option>
                    </select>

                    {inlineButtons.map((btn) => (
                        <Pressable
                            key={btn.label}
                            style={[styles.toolbarBtn, btn.active && styles.toolbarBtnActive]}
                            onPress={() => handleInlineFormat(btn.format)}
                            accessibilityLabel={btn.label}
                        >
                            <FontAwesomeIcon
                                icon={btn.icon}
                                size={13}
                                color={btn.active ? (colors.onPrimary as string) : (colors.textSecondary as string)}
                            />
                        </Pressable>
                    ))}

                    <View style={styles.toolbarDivider} />

                    <Pressable
                        style={[styles.toolbarBtn, listType === "bullet" && styles.toolbarBtnActive]}
                        onPress={() => handleList("bullet")}
                        accessibilityLabel="Bullet list"
                    >
                        <FontAwesomeIcon
                            icon={faListUl}
                            size={13}
                            color={listType === "bullet" ? (colors.onPrimary as string) : (colors.textSecondary as string)}
                        />
                    </Pressable>
                    <Pressable
                        style={[styles.toolbarBtn, listType === "number" && styles.toolbarBtnActive]}
                        onPress={() => handleList("number")}
                        accessibilityLabel="Ordered list"
                    >
                        <FontAwesomeIcon
                            icon={faListOl}
                            size={13}
                            color={listType === "number" ? (colors.onPrimary as string) : (colors.textSecondary as string)}
                        />
                    </Pressable>

                    <View style={styles.toolbarDivider} />

                    <Pressable
                        style={[styles.toolbarBtn, blockquoteActive && styles.toolbarBtnActive]}
                        onPress={handleBlockquote}
                        accessibilityLabel="Blockquote"
                    >
                        <FontAwesomeIcon
                            icon={faQuoteLeft}
                            size={13}
                            color={blockquoteActive ? (colors.onPrimary as string) : (colors.textSecondary as string)}
                        />
                    </Pressable>

                    <Pressable style={styles.toolbarBtn} onPress={handleClearFormat} accessibilityLabel="Clear formatting">
                        <FontAwesomeIcon icon={faEraser} size={13} color={colors.textSecondary as string} />
                    </Pressable>

                    <View style={styles.toolbarDivider} />

                    <Pressable
                        style={[styles.toolbarBtn, linkActive && styles.toolbarBtnActive]}
                        onPress={openLinkModal}
                        accessibilityLabel="Insert link"
                    >
                        <FontAwesomeIcon
                            icon={faLink}
                            size={13}
                            color={linkActive ? (colors.onPrimary as string) : (colors.textSecondary as string)}
                        />
                    </Pressable>

                    <Pressable style={styles.toolbarBtn} onPress={openImageModal} accessibilityLabel="Insert image">
                        <FontAwesomeIcon icon={faImage} size={13} color={colors.textSecondary as string} />
                    </Pressable>
                </View>
            </View>

            {/* ── Editor surface ───────────────────────────────────────────── */}
            <div
                ref={containerRef}
                className="tl-scroll"
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: colors.background as string,
                    overflowY: "auto",
                    position: "relative",
                } as React.CSSProperties}
            >
                <RichTextPlugin
                    contentEditable={<ContentEditable className="tl-content" />}
                    placeholder={<div className="tl-placeholder">Write your content strategy...</div>}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <ListPlugin />
                <LinkPlugin />
                <OnChangePlugin onChange={handleEditorChange} ignoreSelectionChange />

                {hasSelection && popoverPos && (
                    <View
                        // @ts-ignore - web-only DOM event to keep the visual selection intact
                        onMouseDown={(e: any) => e.preventDefault()}
                        style={[styles.floatingPopover, { top: popoverPos.top, left: popoverPos.left }]}
                    >
                        <Pressable
                            style={({ hovered, pressed }: any) => [styles.popoverAction, (hovered || pressed) && styles.popoverActionHover]}
                            onPress={handleQuickEditOpen}
                        >
                            <FontAwesomeIcon icon={faPen} size={12} color={colors.onPrimary as string} />
                            <Text style={styles.popoverActionText}>Quick Edit</Text>
                        </Pressable>
                        <View style={styles.popoverDivider} />
                        <Pressable
                            style={({ hovered, pressed }: any) => [styles.popoverAction, (hovered || pressed) && styles.popoverActionHover]}
                            onPress={handleSendToChat}
                        >
                            <FontAwesomeIcon icon={faShareNodes} size={12} color={colors.onPrimary as string} />
                            <Text style={styles.popoverActionText}>Send to Chat</Text>
                        </Pressable>
                        {onSnippetComment && (
                            <>
                                <View style={styles.popoverDivider} />
                                <Pressable
                                    style={({ hovered, pressed }: any) => [styles.popoverAction, (hovered || pressed) && styles.popoverActionHover]}
                                    onPress={handleSnippetComment}
                                >
                                    <FontAwesomeIcon icon={faCommentDots} size={12} color={colors.onPrimary as string} />
                                    <Text style={styles.popoverActionText}>Comment</Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                )}
            </div>

            {/* ── AI Quick Edit modal ──────────────────────────────────────── */}
            <AIQuickEditModal
                visible={quickEditVisible}
                onClose={() => setQuickEditVisible(false)}
                selectedText={selectedText}
                module={aiModule}
                contextId={strategyId}
                onAccept={handleAIQuickEditAccept}
            />

            {/* ── Link insertion ───────────────────────────────────────────── */}
            <LinkInsertModal
                visible={linkModalVisible}
                initialText={linkInitialText}
                onClose={() => setLinkModalVisible(false)}
                onInsert={handleInsertLink}
            />

            {/* ── Image insertion ──────────────────────────────────────────── */}
            <ImageInsertModal
                visible={imageModalVisible}
                onClose={() => setImageModalVisible(false)}
                onInsert={handleInsertImage}
            />
        </View>
    );
};

// ── Outer wrapper: provides the Lexical context ─────────────────────────────

const StrategyEditorPanel: React.FC<StrategyEditorPanelProps> = (props) => {
    const initialConfig = useMemo(
        () => ({
            namespace: "trendly-strategy-editor",
            theme: EDITOR_THEME,
            onError: (error: Error) => {
                // eslint-disable-next-line no-console
                console.error("[RichTextEditor] Lexical error:", error);
            },
            nodes: [
                HeadingNode,
                QuoteNode,
                ListNode,
                ListItemNode,
                LinkNode,
                CodeNode,
                CodeHighlightNode,
                ImageNode,
            ],
        }),
        []
    );

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <EditorBody {...props} />
        </LexicalComposer>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        container: { flex: 1 },
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
        toolbarLeft: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4, flex: 1 },
        toolbarDivider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 6 },
        floatingPopover: {
            position: "absolute",
            flexDirection: "row",
            alignItems: "center",
            padding: 5,
            borderRadius: 14,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowRadius: 28,
            shadowOpacity: 0.38,
            elevation: 14,
            zIndex: 50,
        },
        popoverAction: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 11,
            paddingVertical: 7,
            borderRadius: 9,
        },
        popoverActionHover: { backgroundColor: "rgba(255,255,255,0.14)" },
        popoverActionText: {
            fontSize: 12.5,
            fontWeight: "600",
            color: colors.onPrimary,
            letterSpacing: 0.2,
        },
        popoverDivider: {
            width: 1,
            height: 16,
            backgroundColor: "rgba(255,255,255,0.18)",
            marginHorizontal: 1,
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
        toolbarBtnActive: { backgroundColor: colors.primary, shadowOpacity: 0, elevation: 0 },
    });
}

export default StrategyEditorPanel;
