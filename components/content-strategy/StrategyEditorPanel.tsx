import Colors from "@/shared-uis/constants/Colors";
import {
    faBold,
    faCommentDots,
    faHeading,
    faItalic,
    faListUl,
    faPen,
    faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useRef, useState } from "react";
import {
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextInputSelectionChangeEventData,
    View,
} from "react-native";
import QuickEditModal from "./QuickEditModal";

interface StrategyEditorPanelProps {
    content: string;
    onChange: (text: string) => void;
    onSendToChat: (text: string) => void;
    /** Called when the user clicks "Comment" on a selected snippet */
    onSnippetComment?: (snippet: string, anchorStart: number, anchorEnd: number) => void;
}

interface ToolbarAction {
    icon: typeof faBold;
    label: string;
    prefix?: string;
    suffix?: string;
    linePrefix?: string;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
    { icon: faHeading, label: "Heading", linePrefix: "## " },
    { icon: faBold, label: "Bold", prefix: "**", suffix: "**" },
    { icon: faItalic, label: "Italic", prefix: "_", suffix: "_" },
    { icon: faListUl, label: "Bullet", linePrefix: "- " },
];

const StrategyEditorPanel: React.FC<StrategyEditorPanelProps> = ({
    content,
    onChange,
    onSendToChat,
    onSnippetComment,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const inputRef = useRef<TextInput>(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const [quickEditVisible, setQuickEditVisible] = useState(false);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const hasSelection = selection.start !== selection.end;
    const selectedText = hasSelection ? content.slice(selection.start, selection.end) : "";

    const handleSelectionChange = (
        e: NativeSyntheticEvent<TextInputSelectionChangeEventData>
    ) => {
        setSelection(e.nativeEvent.selection);
    };

    const applyInlineFormat = (prefix: string, suffix: string) => {
        if (!hasSelection) return;
        const before = content.slice(0, selection.start);
        const selected = content.slice(selection.start, selection.end);
        const after = content.slice(selection.end);
        onChange(`${before}${prefix}${selected}${suffix}${after}`);
    };

    const applyLinePrefix = (linePrefix: string) => {
        const before = content.slice(0, selection.start);
        const lineStart = before.lastIndexOf("\n") + 1;
        const newContent = content.slice(0, lineStart) + linePrefix + content.slice(lineStart);
        onChange(newContent);
    };

    const handleToolbarAction = (action: ToolbarAction) => {
        if (action.prefix && action.suffix) {
            applyInlineFormat(action.prefix, action.suffix);
        } else if (action.linePrefix) {
            applyLinePrefix(action.linePrefix);
        }
    };

    const handleQuickEditApply = (prompt: string) => {
        // Simulate applying the edit — in production this calls the AI API
        const simulatedResult = `[AI edited: "${prompt}" applied to selection]\n${selectedText}`;
        const before = content.slice(0, selection.start);
        const after = content.slice(selection.end);
        onChange(`${before}${simulatedResult}${after}`);
    };

    const handleSendToChat = () => {
        if (selectedText) {
            onSendToChat(selectedText);
        }
    };

    return (
        <View style={styles.container}>
            {/* Unified toolbar: formatting left, selection actions right */}
            <View style={styles.toolbar}>
                <View style={styles.toolbarLeft}>
                    {TOOLBAR_ACTIONS.map((action) => (
                        <Pressable
                            key={action.label}
                            style={({ pressed }) => [styles.toolbarBtn, pressed && styles.toolbarBtnPressed]}
                            onPress={() => handleToolbarAction(action)}
                        >
                            <FontAwesomeIcon icon={action.icon} size={14} color={colors.textSecondary} />
                        </Pressable>
                    ))}
                </View>

                {hasSelection && (
                    <>
                        <View style={styles.toolbarDivider} />
                        <View style={styles.toolbarRight}>
                            <Text style={styles.selectionHint}>{selectedText.length} characters </Text>
                            <Pressable
                                style={styles.selectionAction}
                                onPress={() => setQuickEditVisible(true)}
                            >
                                <FontAwesomeIcon icon={faPen} size={12} color={colors.secondaryText} />
                                <Text style={styles.selectionActionText}>Quick Edit</Text>
                            </Pressable>
                            <Pressable style={styles.selectionAction} onPress={handleSendToChat}>
                                <FontAwesomeIcon icon={faShareNodes} size={12} color={colors.secondaryText} />
                                <Text style={styles.selectionActionText}>Send to Chat</Text>
                            </Pressable>
                            {onSnippetComment && (
                                <Pressable
                                    style={styles.selectionAction}
                                    onPress={() =>
                                        onSnippetComment(selectedText, selection.start, selection.end)
                                    }
                                >
                                    <FontAwesomeIcon icon={faCommentDots} size={12} color={colors.secondaryText} />
                                    <Text style={styles.selectionActionText}>Comment</Text>
                                </Pressable>
                            )}
                        </View>
                    </>
                )}
            </View>

            <ScrollView style={styles.editorScroll} contentContainerStyle={styles.editorScrollContent}>
                <TextInput
                    ref={inputRef}
                    style={styles.editor}
                    value={content}
                    onChangeText={onChange}
                    onSelectionChange={handleSelectionChange}
                    multiline
                    textAlignVertical="top"
                    scrollEnabled={false}
                    autoCorrect={false}
                    autoCapitalize="none"
                    spellCheck={false}
                />
            </ScrollView>

            <QuickEditModal
                visible={quickEditVisible}
                selectedText={selectedText}
                onClose={() => setQuickEditVisible(false)}
                onApply={handleQuickEditApply}
            />
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                },
                toolbar: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: colors.card,
                    // Shadow below to lift toolbar above editor
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                toolbarLeft: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                },
                toolbarDivider: {
                    width: 1,
                    height: 20,
                    backgroundColor: colors.border,
                    marginHorizontal: 8,
                },
                toolbarRight: {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                },
                toolbarBtn: {
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.background,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.06,
                    elevation: 1,
                },
                toolbarBtnPressed: {
                    backgroundColor: colors.aliceBlue,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                selectionHint: {
                    fontSize: 11,
                    color: colors.textSecondary,
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
                    fontSize: 14,
                    lineHeight: 22,
                    color: colors.text,
                    fontFamily: "monospace",
                    backgroundColor: colors.background,
                    textAlignVertical: "top",
                },
            }),
        [colors]
    );
}

export default StrategyEditorPanel;
