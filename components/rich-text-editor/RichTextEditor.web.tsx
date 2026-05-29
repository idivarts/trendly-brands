import Colors from "@/shared-uis/constants/Colors";
import { ensureHtml } from "@/utils/rich-text";
import {
    faBold,
    faCommentDots,
    faEraser,
    faItalic,
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AIQuickEditModal from "@/components/ai/AIQuickEdit/AIQuickEditModal";

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

const QUILL_STYLE_ID = "trendly-quill-core-css";

function injectQuillStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById(QUILL_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = QUILL_STYLE_ID;
    style.textContent = `
        .trendly-quill-container { position: relative; flex: 1; display: flex; flex-direction: column; }
        .trendly-quill-container .ql-editor {
            box-sizing: border-box;
            flex: 1;
            line-height: 1.6;
            min-height: 400px;
            outline: none;
            overflow-y: auto;
            padding: 20px;
            tab-size: 4;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 14px;
            font-family: inherit;
        }
        .trendly-quill-container .ql-editor.ql-blank::before {
            color: rgba(128,128,128,0.6);
            content: attr(data-placeholder);
            left: 20px;
            pointer-events: none;
            position: absolute;
            right: 20px;
            font-style: italic;
        }
        .trendly-quill-container .ql-editor p { margin: 0 0 6px 0; }
        .trendly-quill-container .ql-editor h1 { font-size: 2em; font-weight: 700; margin: 0 0 8px 0; line-height: 1.2; }
        .trendly-quill-container .ql-editor h2 { font-size: 1.5em; font-weight: 700; margin: 0 0 8px 0; line-height: 1.3; }
        .trendly-quill-container .ql-editor h3 { font-size: 1.17em; font-weight: 700; margin: 0 0 8px 0; line-height: 1.4; }
        .trendly-quill-container .ql-editor h4 { font-size: 1em; font-weight: 700; margin: 0 0 6px 0; }
        .trendly-quill-container .ql-editor h5 { font-size: 0.83em; font-weight: 700; margin: 0 0 6px 0; }
        .trendly-quill-container .ql-size-small { font-size: 0.75em; }
        .trendly-quill-container .ql-editor ul,
        .trendly-quill-container .ql-editor ol { padding-left: 1.5em; margin: 0 0 6px 0; }
        .trendly-quill-container .ql-editor ul li { list-style-type: disc; }
        .trendly-quill-container .ql-editor ol li { list-style-type: decimal; }
        .trendly-quill-container .ql-editor blockquote {
            border-left: 4px solid #ccc;
            margin: 0 0 8px 0;
            padding-left: 16px;
            opacity: 0.8;
            font-style: italic;
        }
        .trendly-quill-container .ql-editor strong { font-weight: 700; }
        .trendly-quill-container .ql-editor em { font-style: italic; }
        .trendly-quill-container .ql-editor u { text-decoration: underline; }
        .trendly-quill-container .ql-editor s { text-decoration: line-through; }
    `;
    document.head.appendChild(style);
}

function getDropdownValue(formats: Record<string, any>): string {
    if (formats.header) return `h${formats.header}`;
    if (formats.size === "small") return "small";
    return "normal";
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
    const containerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<any>(null);
    const lastHtmlRef = useRef("");
    const [quickEditVisible, setQuickEditVisible] = useState(false);
    const [selectedText, setSelectedText] = useState("");
    const [selectionRange, setSelectionRange] = useState<{ index: number; length: number } | null>(null);
    const [activeFormats, setActiveFormats] = useState<Record<string, any>>({});
    const [dropdownValue, setDropdownValue] = useState("normal");
    const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; placement: "top" | "bottom" } | null>(null);
    const popoverRef = useRef<View | null>(null);

    const styles = useMemo(() => makeStyles(colors), [colors]);

    // Inject minimal Quill CSS once on mount
    useEffect(() => {
        injectQuillStyles();
    }, []);

    // Initialise Quill once
    useEffect(() => {
        if (!containerRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const QuillClass = require("quill").default;

        // Register size class format for "small" text
        try {
            const SizeClass = QuillClass.import("attributors/class/size");
            SizeClass.whitelist = ["small"];
            QuillClass.register(SizeClass, true);
        } catch (_) { /* already registered or unavailable */ }

        const quill = new QuillClass(containerRef.current, {
            modules: { toolbar: false },
            theme: false,
            placeholder: "Write your content strategy...",
        });

        // Apply theme colours to the editor element
        const editorEl = containerRef.current.querySelector(".ql-editor") as HTMLElement | null;
        if (editorEl) {
            editorEl.style.color = colors.text as string;
            editorEl.style.backgroundColor = colors.background as string;
        }

        const initialHtml = ensureHtml(content || "");
        quill.clipboard.dangerouslyPasteHTML(initialHtml);
        lastHtmlRef.current = quill.getSemanticHTML();

        quill.on("text-change", () => {
            const html = quill.getSemanticHTML();
            lastHtmlRef.current = html;
            onChange(html);
        });

        const computePopoverPosition = (range: any) => {
            const container = containerRef.current;
            if (!container || !range || range.length === 0) {
                setPopoverPos(null);
                return;
            }
            const editor = container.querySelector(".ql-editor") as HTMLElement | null;
            if (!editor) return;
            const bounds = quill.getBounds(range.index, range.length);
            if (!bounds) return;

            const POPOVER_HEIGHT_ESTIMATE = 40;
            const POPOVER_WIDTH_ESTIMATE = 320;
            const GAP = 8;

            // Coordinates of selection rect relative to the outer container.
            const selTop = editor.offsetTop + bounds.top - editor.scrollTop;
            const selLeft = editor.offsetLeft + bounds.left - editor.scrollLeft;
            const selCenterX = selLeft + bounds.width / 2;

            // Default: place above the selection; flip below if not enough room.
            let placement: "top" | "bottom" = "top";
            let top = selTop - POPOVER_HEIGHT_ESTIMATE - GAP;
            if (top < editor.offsetTop + 4) {
                placement = "bottom";
                top = selTop + bounds.height + GAP;
            }

            // Clamp left within container.
            const containerWidth = container.clientWidth;
            let left = selCenterX - POPOVER_WIDTH_ESTIMATE / 2;
            const minLeft = 8;
            const maxLeft = Math.max(minLeft, containerWidth - POPOVER_WIDTH_ESTIMATE - 8);
            left = Math.max(minLeft, Math.min(maxLeft, left));

            setPopoverPos({ top, left, placement });
        };

        quill.on("selection-change", (range: any) => {
            if (!range) return;
            const formats = quill.getFormat(range.index, range.length);
            setActiveFormats(formats);
            setDropdownValue(getDropdownValue(formats));
            if (range.length > 0) {
                const text = quill.getText(range.index, range.length);
                setSelectedText(text.trim());
                setSelectionRange({ index: range.index, length: range.length });
                computePopoverPosition(range);
            } else {
                setSelectedText("");
                setSelectionRange(null);
                setPopoverPos(null);
            }
        });

        // Reposition popover when the editor scrolls while a selection is active.
        const editorEl2 = containerRef.current.querySelector(".ql-editor") as HTMLElement | null;
        const onEditorScroll = () => {
            const r = quill.getSelection();
            if (r && r.length > 0) computePopoverPosition(r);
        };
        editorEl2?.addEventListener("scroll", onEditorScroll);

        quillRef.current = quill;

        return () => {
            quill.off("text-change");
            quill.off("selection-change");
            editorEl2?.removeEventListener("scroll", onEditorScroll);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync external content changes without causing update loops
    useEffect(() => {
        const quill = quillRef.current;
        if (!quill) return;
        const incoming = ensureHtml(content || "");
        if (incoming !== lastHtmlRef.current) {
            const sel = quill.getSelection();
            quill.clipboard.dangerouslyPasteHTML(incoming);
            lastHtmlRef.current = quill.getSemanticHTML();
            if (sel) quill.setSelection(sel.index, sel.length);
        }
    }, [content]);

    // ── Format helpers ────────────────────────────────────────────────────────

    const handleInlineFormat = useCallback((format: string) => {
        const quill = quillRef.current;
        if (!quill) return;
        const current = quill.getFormat();
        quill.format(format, !current[format]);
        setActiveFormats(quill.getFormat());
    }, []);

    const handleList = useCallback((type: "bullet" | "ordered") => {
        const quill = quillRef.current;
        if (!quill) return;
        const current = quill.getFormat();
        quill.format("list", current.list === type ? false : type);
        setActiveFormats(quill.getFormat());
    }, []);

    const handleBlockquote = useCallback(() => {
        const quill = quillRef.current;
        if (!quill) return;
        const current = quill.getFormat();
        quill.format("blockquote", !current.blockquote);
        setActiveFormats(quill.getFormat());
    }, []);

    const handleClearFormat = useCallback(() => {
        const quill = quillRef.current;
        if (!quill) return;
        const range = quill.getSelection();
        if (range) quill.removeFormat(range.index, range.length);
        setActiveFormats({});
        setDropdownValue("normal");
    }, []);

    const handleTextSize = useCallback((value: string) => {
        const quill = quillRef.current;
        if (!quill) return;
        quill.format("header", false);
        quill.format("size", false);
        if (value.startsWith("h")) {
            quill.format("header", parseInt(value[1], 10));
        } else if (value === "small") {
            quill.format("size", "small");
        }
        const updated = quill.getFormat();
        setActiveFormats(updated);
        setDropdownValue(value);
    }, []);

    // ── Selection-aware actions ───────────────────────────────────────────────

    const handleSendToChat = useCallback(() => {
        if (selectedText) onSendToChat(selectedText);
    }, [selectedText, onSendToChat]);

    const handleSnippetComment = useCallback(() => {
        if (onSnippetComment && selectedText && selectionRange) {
            onSnippetComment(selectedText, selectionRange.index, selectionRange.index + selectionRange.length);
        }
    }, [onSnippetComment, selectedText, selectionRange]);

    // Replace the current Quill selection with AI-generated text, then sync to parent.
    const handleAIQuickEditAccept = useCallback(
        (newText: string) => {
            const quill = quillRef.current;
            if (!quill || !selectionRange) {
                setQuickEditVisible(false);
                return;
            }
            quill.deleteText(selectionRange.index, selectionRange.length);
            quill.insertText(selectionRange.index, newText);
            quill.setSelection(selectionRange.index + newText.length, 0);
            const html = quill.root.innerHTML;
            lastHtmlRef.current = html;
            onChange(html);
            setQuickEditVisible(false);
        },
        [selectionRange, onChange]
    );

    // ── Toolbar button definitions ────────────────────────────────────────────

    const inlineButtons = [
        { icon: faBold, label: "Bold", format: "bold" },
        { icon: faItalic, label: "Italic", format: "italic" },
        { icon: faUnderline, label: "Underline", format: "underline" },
        { icon: faStrikethrough, label: "Strike", format: "strike" },
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
                    {/* Text size / header dropdown */}
                    <select value={dropdownValue} onChange={(e) => handleTextSize(e.target.value)} style={selectStyle}>
                        <option value="normal">Normal</option>
                        <option value="h1">H1</option>
                        <option value="h2">H2</option>
                        <option value="h3">H3</option>
                        <option value="h4">H4</option>
                        <option value="h5">H5</option>
                        <option value="small">Small</option>
                    </select>

                    {/* Inline format buttons */}
                    {inlineButtons.map((btn) => {
                        const isActive = !!activeFormats[btn.format];
                        return (
                            <Pressable
                                key={btn.label}
                                style={[styles.toolbarBtn, isActive && styles.toolbarBtnActive]}
                                onPress={() => handleInlineFormat(btn.format)}
                                accessibilityLabel={btn.label}
                            >
                                <FontAwesomeIcon
                                    icon={btn.icon}
                                    size={13}
                                    color={isActive ? (colors.onPrimary as string) : (colors.textSecondary as string)}
                                />
                            </Pressable>
                        );
                    })}

                    <View style={styles.toolbarDivider} />

                    {/* List buttons */}
                    <Pressable
                        style={[styles.toolbarBtn, activeFormats.list === "bullet" && styles.toolbarBtnActive]}
                        onPress={() => handleList("bullet")}
                        accessibilityLabel="Bullet list"
                    >
                        <FontAwesomeIcon
                            icon={faListUl}
                            size={13}
                            color={activeFormats.list === "bullet" ? (colors.onPrimary as string) : (colors.textSecondary as string)}
                        />
                    </Pressable>
                    <Pressable
                        style={[styles.toolbarBtn, activeFormats.list === "ordered" && styles.toolbarBtnActive]}
                        onPress={() => handleList("ordered")}
                        accessibilityLabel="Ordered list"
                    >
                        <FontAwesomeIcon
                            icon={faListOl}
                            size={13}
                            color={activeFormats.list === "ordered" ? (colors.onPrimary as string) : (colors.textSecondary as string)}
                        />
                    </Pressable>

                    <View style={styles.toolbarDivider} />

                    {/* Blockquote */}
                    <Pressable
                        style={[styles.toolbarBtn, activeFormats.blockquote && styles.toolbarBtnActive]}
                        onPress={handleBlockquote}
                        accessibilityLabel="Blockquote"
                    >
                        <FontAwesomeIcon
                            icon={faQuoteLeft}
                            size={13}
                            color={activeFormats.blockquote ? (colors.onPrimary as string) : (colors.textSecondary as string)}
                        />
                    </Pressable>

                    {/* Clear formatting */}
                    <Pressable
                        style={styles.toolbarBtn}
                        onPress={handleClearFormat}
                        accessibilityLabel="Clear formatting"
                    >
                        <FontAwesomeIcon icon={faEraser} size={13} color={colors.textSecondary as string} />
                    </Pressable>
                </View>

            </View>

            {/* ── Quill editor container ───────────────────────────────────── */}
            <div
                ref={containerRef}
                className="trendly-quill-container"
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: colors.background as string,
                    overflowY: "auto",
                    position: "relative",
                } as React.CSSProperties}
            >
                {hasSelection && popoverPos && (
                    <View
                        ref={popoverRef as any}
                        // @ts-ignore - web-only DOM event used to keep Quill selection intact
                        onMouseDown={(e: any) => e.preventDefault()}
                        style={[
                            styles.floatingPopover,
                            { top: popoverPos.top, left: popoverPos.left },
                        ]}
                    >
                        <Pressable
                            style={({ hovered, pressed }: any) => [
                                styles.popoverAction,
                                (hovered || pressed) && styles.popoverActionHover,
                            ]}
                            onPress={() => setQuickEditVisible(true)}
                        >
                            <FontAwesomeIcon icon={faPen} size={12} color={colors.onPrimary as string} />
                            <Text style={styles.popoverActionText}>Quick Edit</Text>
                        </Pressable>
                        <View style={styles.popoverDivider} />
                        <Pressable
                            style={({ hovered, pressed }: any) => [
                                styles.popoverAction,
                                (hovered || pressed) && styles.popoverActionHover,
                            ]}
                            onPress={handleSendToChat}
                        >
                            <FontAwesomeIcon icon={faShareNodes} size={12} color={colors.onPrimary as string} />
                            <Text style={styles.popoverActionText}>Send to Chat</Text>
                        </Pressable>
                        {onSnippetComment && (
                            <>
                                <View style={styles.popoverDivider} />
                                <Pressable
                                    style={({ hovered, pressed }: any) => [
                                        styles.popoverAction,
                                        (hovered || pressed) && styles.popoverActionHover,
                                    ]}
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

            {/* ── AI Quick Edit modal — streaming, with Accept/Discard ──── */}
            <AIQuickEditModal
                visible={quickEditVisible}
                onClose={() => setQuickEditVisible(false)}
                selectedText={selectedText}
                module={aiModule}
                contextId={strategyId}
                onAccept={handleAIQuickEditAccept}
            />
        </View>
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
        popoverActionHover: {
            backgroundColor: "rgba(255,255,255,0.14)",
        },
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
        selectionActionText: { fontSize: 12, fontWeight: "600", color: colors.secondaryText },
    });
}

export default StrategyEditorPanel;
