import Colors from "@/shared-uis/constants/Colors";
import { faChevronRight, faPaperPlane, faRobot, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export interface ChatMessage {
    id: string;
    sender: "ai" | "user";
    text: string;
    timestamp: number;
}

export interface FocusItem {
    id: string;
    label: string;
}

interface AIChatPanelProps {
    messages: ChatMessage[];
    onSend: (text: string) => void;
    focusItems?: FocusItem[];
    onRemoveFocusItem?: (id: string) => void;
    isCompact?: boolean;
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    placeholder?: string;
    isAITyping?: boolean;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({
    messages,
    onSend,
    focusItems = [],
    onRemoveFocusItem,
    isCompact = false,
    isCollapsible = false,
    isCollapsed = false,
    onToggleCollapse,
    placeholder = "Ask the AI Expert...",
    isAITyping = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [input, setInput] = useState("");
    const listRef = useRef<FlatList>(null);
    const styles = useMemo(() => useStyles(colors, isCompact), [colors, isCompact]);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages.length]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || isAITyping) return;
        onSend(trimmed);
        setInput("");
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isAI = item.sender === "ai";
        return (
            <View style={[styles.messageRow, isAI ? styles.aiRow : styles.userRow]}>
                {isAI && (
                    <View style={styles.avatarContainer}>
                        <FontAwesomeIcon icon={faRobot} size={14} color={colors.onPrimary} />
                    </View>
                )}
                <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
                    <Text style={[styles.bubbleText, isAI ? styles.aiText : styles.userText]}>
                        {item.text}
                    </Text>
                </View>
            </View>
        );
    };

    if (isCollapsible && isCollapsed) {
        return (
            <Pressable style={styles.collapsedTab} onPress={onToggleCollapse}>
                <FontAwesomeIcon icon={faRobot} size={15} color={colors.primary} />
                <Text style={styles.collapsedTabLabel}>AI</Text>
            </Pressable>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {isCollapsible && (
                <Pressable style={styles.panelHeader} onPress={onToggleCollapse}>
                    <FontAwesomeIcon icon={faRobot} size={14} color={colors.primary} />
                    <Text style={styles.panelHeaderLabel}>AI Content Expert</Text>
                    <FontAwesomeIcon icon={faChevronRight} size={12} color={colors.textSecondary} />
                </Pressable>
            )}

            <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
            />

            {isAITyping && (
                <View style={styles.typingRow}>
                    <View style={styles.avatarContainer}>
                        <FontAwesomeIcon icon={faRobot} size={14} color={colors.onPrimary} />
                    </View>
                    <View style={styles.typingBubble}>
                        <Text style={styles.typingText}>Thinking…</Text>
                    </View>
                </View>
            )}

            {focusItems.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.focusBar}
                    contentContainerStyle={styles.focusBarContent}
                >
                    {focusItems.map((item) => (
                        <View key={item.id} style={styles.focusChip}>
                            <View style={styles.focusChipAccent} />
                            <Text style={styles.focusChipText} numberOfLines={1}>
                                {item.label}
                            </Text>
                            {onRemoveFocusItem && (
                                <Pressable
                                    onPress={() => onRemoveFocusItem(item.id)}
                                    style={styles.focusChipClose}
                                >
                                    <FontAwesomeIcon icon={faXmark} size={10} color={colors.textSecondary} />
                                </Pressable>
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}

            <View style={styles.inputArea}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    value={input}
                    onChangeText={setInput}
                    multiline
                    maxLength={1000}
                />
                <Pressable
                    style={({ pressed }) => [
                        styles.sendBtn,
                        pressed && styles.sendBtnPressed,
                        (!input.trim() || isAITyping) && styles.sendBtnDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={!input.trim() || isAITyping}
                >
                    <FontAwesomeIcon icon={faPaperPlane} size={16} color={colors.onPrimary} />
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, isCompact: boolean) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: -6, height: 0 },
                    shadowRadius: 16,
                    shadowOpacity: 0.07,
                    elevation: 8,
                },
                collapsedTab: {
                    width: 40,
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: -4, height: 0 },
                    shadowRadius: 8,
                    shadowOpacity: 0.06,
                    elevation: 4,
                },
                collapsedTabLabel: {
                    fontSize: 10,
                    fontWeight: "700",
                    color: colors.primary,
                    letterSpacing: 0.5,
                },
                panelHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: isCompact ? 10 : 14,
                    paddingVertical: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 2,
                },
                panelHeaderLabel: {
                    flex: 1,
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.text,
                },
                messageList: {
                    padding: isCompact ? 12 : 16,
                    gap: 12,
                    flexGrow: 1,
                    justifyContent: "flex-end",
                },
                messageRow: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 8,
                },
                aiRow: {
                    justifyContent: "flex-start",
                },
                userRow: {
                    justifyContent: "flex-end",
                },
                avatarContainer: {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                },
                bubble: {
                    maxWidth: "80%",
                    borderRadius: 14,
                    paddingHorizontal: isCompact ? 10 : 14,
                    paddingVertical: isCompact ? 8 : 10,
                },
                aiBubble: {
                    backgroundColor: colors.background,
                    borderTopLeftRadius: 4,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.06,
                    elevation: 2,
                },
                userBubble: {
                    backgroundColor: colors.primary,
                    borderTopRightRadius: 4,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                bubbleText: {
                    fontSize: isCompact ? 13 : 14,
                    lineHeight: isCompact ? 19 : 21,
                },
                aiText: {
                    color: colors.text,
                },
                userText: {
                    color: colors.onPrimary,
                },
                typingRow: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 8,
                    paddingHorizontal: isCompact ? 12 : 16,
                    paddingBottom: 8,
                },
                typingBubble: {
                    backgroundColor: colors.background,
                    borderRadius: 14,
                    borderTopLeftRadius: 4,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.06,
                    elevation: 2,
                },
                typingText: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                },
                focusBar: {
                    flexShrink: 0,
                    maxHeight: 44,
                    marginHorizontal: 12,
                    marginBottom: 6,
                },
                focusBarContent: {
                    gap: 8,
                    alignItems: "center",
                },
                focusChip: {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.aliceBlue,
                    borderRadius: 10,
                    overflow: "hidden",
                    maxWidth: 200,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 4,
                    shadowOpacity: 0.06,
                    elevation: 1,
                },
                focusChipAccent: {
                    width: 4,
                    alignSelf: "stretch",
                    backgroundColor: colors.primary,
                },
                focusChipText: {
                    flex: 1,
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                },
                focusChipClose: {
                    padding: 8,
                },
                inputArea: {
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 10,
                    padding: isCompact ? 10 : 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 4,
                    backgroundColor: colors.card,
                },
                input: {
                    flex: 1,
                    minHeight: 40,
                    maxHeight: 120,
                    borderRadius: 20,
                    backgroundColor: colors.tag,
                    color: colors.text,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    textAlignVertical: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                sendBtn: {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                sendBtnPressed: {
                    opacity: 0.75,
                },
                sendBtnDisabled: {
                    opacity: 0.4,
                    shadowOpacity: 0,
                    elevation: 0,
                },
            }),
        [colors, isCompact]
    );
}

export default AIChatPanel;
