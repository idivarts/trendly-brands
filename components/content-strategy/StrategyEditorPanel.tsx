import Colors from "@/shared-uis/constants/Colors";
import {
    faBold,
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
            <View style={styles.toolbar}>
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
                <View style={styles.selectionToolbar}>
                    <Text style={styles.selectionHint}>
                        {selectedText.length} chars selected
                    </Text>
                    <Pressable
                        style={styles.selectionAction}
                        onPress={() => setQuickEditVisible(true)}
                    >
                        <FontAwesomeIcon icon={faPen} size={12} color={colors.primary} />
                        <Text style={styles.selectionActionText}>Quick Edit</Text>
                    </Pressable>
                    <View style={styles.selectionDivider} />
                    <Pressable style={styles.selectionAction} onPress={handleSendToChat}>
                        <FontAwesomeIcon icon={faShareNodes} size={12} color={colors.primary} />
                        <Text style={styles.selectionActionText}>Send to Chatbot</Text>
                    </Pressable>
                </View>
            )}

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
                    borderRightWidth: 1,
                    borderRightColor: colors.border,
                },
                toolbar: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor: colors.card,
                },
                toolbarBtn: {
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                toolbarBtnPressed: {
                    backgroundColor: colors.aliceBlue,
                },
                selectionToolbar: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    backgroundColor: colors.aliceBlue,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                },
                selectionHint: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginRight: 4,
                },
                selectionAction: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 6,
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.primary,
                },
                selectionActionText: {
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.primary,
                },
                selectionDivider: {
                    width: 1,
                    height: 16,
                    backgroundColor: colors.border,
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
