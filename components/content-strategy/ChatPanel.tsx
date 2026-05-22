import Colors from "@/shared-uis/constants/Colors";
import { faPaperPlane, faRobot, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { ChatMessage } from "./types";

interface ChatPanelProps {
    messages: ChatMessage[];
    onSend: (text: string) => void;
    attachment: string | null;
    onClearAttachment: () => void;
    isCompact?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
    messages,
    onSend,
    attachment,
    onClearAttachment,
    isCompact = false,
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
        if (!trimmed) return;
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

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
            />

            {attachment && (
                <View style={styles.attachmentChip}>
                    <Text style={styles.attachmentLabel} numberOfLines={2}>
                        {attachment}
                    </Text>
                    <Pressable onPress={onClearAttachment} style={styles.attachmentClose}>
                        <FontAwesomeIcon icon={faXmark} size={12} color={colors.textSecondary} />
                    </Pressable>
                </View>
            )}

            <View style={styles.inputArea}>
                <TextInput
                    style={styles.input}
                    placeholder="Type your reply..."
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
                        !input.trim() && styles.sendBtnDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={!input.trim()}
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
                    borderLeftWidth: 1,
                    borderLeftColor: colors.border,
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
                    borderRadius: 12,
                    paddingHorizontal: isCompact ? 10 : 14,
                    paddingVertical: isCompact ? 8 : 10,
                },
                aiBubble: {
                    backgroundColor: colors.card,
                    borderTopLeftRadius: 4,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                userBubble: {
                    backgroundColor: colors.primary,
                    borderTopRightRadius: 4,
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
                attachmentChip: {
                    flexDirection: "row",
                    alignItems: "center",
                    marginHorizontal: 12,
                    marginBottom: 6,
                    backgroundColor: colors.aliceBlue,
                    borderRadius: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.primary,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    gap: 8,
                },
                attachmentLabel: {
                    flex: 1,
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                },
                attachmentClose: {
                    padding: 2,
                },
                inputArea: {
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 10,
                    padding: isCompact ? 10 : 14,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                },
                input: {
                    flex: 1,
                    minHeight: 40,
                    maxHeight: 120,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    textAlignVertical: "center",
                },
                sendBtn: {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                },
                sendBtnPressed: {
                    opacity: 0.75,
                },
                sendBtnDisabled: {
                    opacity: 0.4,
                },
            }),
        [colors, isCompact]
    );
}

export default ChatPanel;
