import Colors from "@/shared-uis/constants/Colors";
import { ensureHtml } from "@/utils/rich-text";
import {
    faBold,
    faCommentDots,
    faItalic,
    faListOl,
    faListUl,
    faPen,
    faShareNodes,
    faStrikethrough,
    faUnderline,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import QuickEditModal from "./QuickEditModal";

export interface StrategyEditorPanelProps {
    content: string;
    onChange: (text: string) => void;
    onSendToChat: (text: string) => void;
    onSnippetComment?: (snippet: string, anchorStart: number, anchorEnd: number) => void;
}

/**
 * WYSIWYG strategy editor — web platform.
 * Uses the browser's native contentEditable + execCommand APIs.
 * No external library required; zero peer-dep conflicts.
 */
const StrategyEditorPanel: React.FC<StrategyEditorPanelProps> = ({
    content,
    onChange,
    onSendToChat,
    onSnippetComment,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const editorRef = useRef<HTMLDivElement>(null);
    const [quickEditVisible, setQuickEditVisible] = useState(false);
    const [selectedText, setSelectedText] = useState("");
    const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
    const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

    const styles = useMemo(() => makeStyles(colors), [colors]);

    // ── Initialise / sync content into the editor ─────────────────────────────
    const lastHtmlRef = useRef<string>("");

    useEffect(() => {
        if (!editorRef.current) return;
        const incoming = ensureHtml(content || "");
        // Only update DOM if content changed externally (not from user typing)
        if (incoming !== lastHtmlRef.current) {
            editorRef.current.innerHTML = incoming;
            lastHtmlRef.current = incoming;
        }
    }, [content]);

    // ── Handle user edits ─────────────────────────────────────────────────────
    const handleInput = useCallback(() => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        lastHtmlRef.current = html;
        onChange(html);
    }, [onChange]);

    // ── Track selection for context toolbar ──────────────────────────────────
    const updateSelectionState = useCallback(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
            setSelectedText("");
            setSelectionRange(null);
        } else {
            const text = sel.toString();
            setSelectedText(text);

            // Approximate character offsets relative to editor text content
            if (editorRef.current && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const preRange = document.createRange();
                preRange.selectNodeContents(editorRef.current);
                preRange.setEnd(range.startContainer, range.startOffset);
                const from = preRange.toString().length;
                setSelectionRange({ from, to: from + text.length });
            }
        }

        // Update active format states
        setActiveFormats({
            bold: document.queryCommandState("bold"),
            italic: document.queryCommandState("italic"),
            underline: document.queryCommandState("underline"),
            strikeThrough: document.queryCommandState("strikeThrough"),
            insertUnorderedList: document.queryCommandState("insertUnorderedList"),
            insertOrderedList: document.queryCommandState("insertOrderedList"),
        });
    }, []);

    // ── Execute a formatting command ──────────────────────────────────────────
    const execFormat = useCallback((command: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false);
        handleInput();
        updateSelectionState();
    }, [handleInput, updateSelectionState]);

    // ── Selection-aware actions ───────────────────────────────────────────────
    const handleSendToChat = useCallback(() => {
        if (selectedText) onSendToChat(selectedText);
    }, [selectedText, onSendToChat]);

    const handleSnippetComment = useCallback(() => {
        if (onSnippetComment && selectedText && selectionRange) {
            onSnippetComment(selectedText, selectionRange.from, selectionRange.to);
        }
    }, [onSnippetComment, selectedText, selectionRange]);

    const handleQuickEditApply = useCallback((prompt: string) => {
        if (!editorRef.current) return;
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(`[Quick Edit: "${prompt}"]\n${selectedText}`));
        }
        handleInput();
        setQuickEditVisible(false);
    }, [selectedText, handleInput]);

    // ── Toolbar button definitions ────────────────────────────────────────────
    const formatButtons = [
        { icon: faBold, label: "Bold", command: "bold" },
        { icon: faItalic, label: "Italic", command: "italic" },
        { icon: faUnderline, label: "Underline", command: "underline" },
        { icon: faStrikethrough, label: "Strike", command: "strikeThrough" },
        { icon: faListUl, label: "Bullet list", command: "insertUnorderedList" },
        { icon: faListOl, label: "Ordered list", command: "insertOrderedList" },
    ];

    const hasSelection = selectedText.length > 0;

    return (
        <View style={styles.container}>
            {/* ── Toolbar ──────────────────────────────────────────────────── */}
            <View style={styles.toolbar}>
                <View style={styles.toolbarLeft}>
                    {formatButtons.map((btn) => {
                        const isActive = activeFormats[btn.command] ?? false;
                        return (
                            <Pressable
                                key={btn.label}
                                style={[styles.toolbarBtn, isActive && styles.toolbarBtnActive]}
                                onPress={() => execFormat(btn.command)}
                                accessibilityLabel={btn.label}
                            >
                                <FontAwesomeIcon
                                    icon={btn.icon}
                                    size={13}
                                    color={isActive ? colors.onPrimary : colors.textSecondary}
                                />
                            </Pressable>
                        );
                    })}
                </View>

                {hasSelection && (
                    <>
                        <View style={styles.toolbarDivider} />
                        <View style={styles.toolbarRight}>
                            <Text style={styles.selectionHint}>{selectedText.length} chars</Text>
                            <Pressable style={styles.selectionAction} onPress={() => setQuickEditVisible(true)}>
                                <FontAwesomeIcon icon={faPen} size={12} color={colors.secondaryText} />
                                <Text style={styles.selectionActionText}>Quick Edit</Text>
                            </Pressable>
                            <Pressable style={styles.selectionAction} onPress={handleSendToChat}>
                                <FontAwesomeIcon icon={faShareNodes} size={12} color={colors.secondaryText} />
                                <Text style={styles.selectionActionText}>Send to Chat</Text>
                            </Pressable>
                            {onSnippetComment && (
                                <Pressable style={styles.selectionAction} onPress={handleSnippetComment}>
                                    <FontAwesomeIcon icon={faCommentDots} size={12} color={colors.secondaryText} />
                                    <Text style={styles.selectionActionText}>Comment</Text>
                                </Pressable>
                            )}
                        </View>
                    </>
                )}
            </View>

            {/* ── Editor (contentEditable div) ─────────────────────────────── */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyUp={updateSelectionState}
                onMouseUp={updateSelectionState}
                onSelect={updateSelectionState}
                style={{
                    flex: 1,
                    minHeight: 400,
                    padding: 20,
                    fontSize: 14,
                    lineHeight: "1.6",
                    color: colors.text,
                    backgroundColor: colors.background,
                    outline: "none",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                }}
            />

            <QuickEditModal
                visible={quickEditVisible}
                selectedText={selectedText}
                onClose={() => setQuickEditVisible(false)}
                onApply={handleQuickEditApply}
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
        toolbarLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
        toolbarDivider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 8 },
        toolbarRight: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 },
        toolbarBtn: {
            width: 30, height: 30, borderRadius: 6,
            alignItems: "center", justifyContent: "center",
            backgroundColor: colors.background,
            shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3, shadowOpacity: 0.06, elevation: 1,
        },
        toolbarBtnActive: { backgroundColor: colors.primary, shadowOpacity: 0, elevation: 0 },
        selectionHint: { fontSize: 11, color: colors.textSecondary },
        selectionAction: {
            flexDirection: "row", alignItems: "center", gap: 5,
            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
            backgroundColor: colors.secondarySurface,
            borderWidth: 1, borderColor: colors.secondaryBorder,
        },
        selectionActionText: { fontSize: 12, fontWeight: "600", color: colors.secondaryText },
    });
}

export default StrategyEditorPanel;
