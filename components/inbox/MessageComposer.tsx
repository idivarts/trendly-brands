import { faClock, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { Text } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";

interface Props {
    /** When false, the composer is locked (e.g. expired 24h DM window). */
    enabled: boolean;
    /** Reason shown when disabled. */
    disabledReason?: string;
    placeholder: string;
    /** Public-reply hint shown above the input for comments. */
    hint?: string;
    onSend: (text: string) => Promise<void>;
}

const MessageComposer: React.FC<Props> = ({
    enabled,
    disabledReason,
    placeholder,
    hint,
    onSend,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);

    const canSend = enabled && text.trim().length > 0 && !sending;

    const handleSend = async () => {
        if (!canSend) return;
        const value = text.trim();
        setText("");
        setSending(true);
        try {
            await onSend(value);
        } finally {
            setSending(false);
        }
    };

    if (!enabled) {
        return (
            <View style={styles.disabledWrap}>
                <FontAwesomeIcon icon={faClock} size={14} color={colors.textSecondary} />
                <Text style={styles.disabledText}>
                    {disabledReason ?? "Replies are closed for this conversation."}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.wrap}>
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            <View style={styles.row}>
                <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    multiline
                    onSubmitEditing={handleSend}
                />
                <Pressable
                    onPress={handleSend}
                    disabled={!canSend}
                    style={[
                        styles.sendBtn,
                        { backgroundColor: canSend ? colors.primary : colors.tag },
                    ]}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                        <FontAwesomeIcon
                            icon={faPaperPlane}
                            size={16}
                            color={canSend ? colors.onPrimary : colors.textSecondary}
                        />
                    )}
                </Pressable>
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    paddingHorizontal: 14,
                    paddingTop: 10,
                    paddingBottom: 14,
                    backgroundColor: colors.background,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 4,
                },
                hint: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 8,
                    marginLeft: 4,
                },
                row: {
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 10,
                },
                input: {
                    flex: 1,
                    minHeight: 44,
                    maxHeight: 120,
                    borderRadius: 22,
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    paddingBottom: 12,
                    fontSize: 15,
                    color: colors.text,
                    backgroundColor: colors.tag,
                    ...(typeof document !== "undefined" ? { outlineStyle: "none" as any } : {}),
                },
                sendBtn: {
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: "center",
                    justifyContent: "center",
                },
                disabledWrap: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 18,
                    backgroundColor: colors.tag,
                },
                disabledText: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    textAlign: "center",
                    flexShrink: 1,
                },
            }),
        [colors]
    );
}

export default MessageComposer;
