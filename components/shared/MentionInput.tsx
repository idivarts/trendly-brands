/**
 * MentionInput
 *
 * A multiline text input with @-mention autocomplete. When the user types "@"
 * followed by a (partial) name, a suggestion list of brand members appears;
 * picking one inserts "@Name " at the caret. Used by the comment composer and
 * the "Comment on selection" modal across the brand content modules.
 *
 * UI rules: theme tokens only, shadows for depth (no structural borders).
 */
import { MentionMember } from "@/hooks/use-brand-members";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    Image,
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextInputSelectionChangeEventData,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";

interface MentionInputProps {
    value: string;
    onChangeText: (text: string) => void;
    members: MentionMember[];
    placeholder?: string;
    placeholderTextColor?: string;
    maxLength?: number;
    multiline?: boolean;
    autoFocus?: boolean;
    inputStyle?: StyleProp<TextStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    /** Anchor the suggestion list above ("top") or below ("bottom") the input. */
    dropdownPlacement?: "top" | "bottom";
}

interface ActiveMention {
    /** Index of the triggering "@" in `value`. */
    atIndex: number;
    /** Caret position (end of the partial query). */
    caret: number;
    /** The partial text typed after "@". */
    query: string;
}

const MAX_SUGGESTIONS = 6;

/**
 * Detects whether the caret currently sits inside an "@mention" token — i.e. an
 * "@" preceded by start-of-text or whitespace, with no whitespace between it and
 * the caret. Returns the token details, or null when no mention is active.
 */
function getActiveMention(text: string, caret: number): ActiveMention | null {
    const uptoCaret = text.slice(0, caret);
    const match = uptoCaret.match(/(?:^|\s)@([^\s@]*)$/);
    if (!match) return null;
    const query = match[1];
    const atIndex = caret - query.length - 1;
    return { atIndex, caret, query };
}

const MentionInput: React.FC<MentionInputProps> = ({
    value,
    onChangeText,
    members,
    placeholder,
    placeholderTextColor,
    maxLength,
    multiline = true,
    autoFocus,
    inputStyle,
    containerStyle,
    dropdownPlacement = "top",
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const [caret, setCaret] = useState(0);
    // When set, forces the TextInput caret once (after a mention insert) and is
    // then cleared so the platform manages the caret normally afterwards.
    const [pendingSelection, setPendingSelection] = useState<
        { start: number; end: number } | undefined
    >(undefined);

    const active = useMemo(() => getActiveMention(value, caret), [value, caret]);

    const suggestions = useMemo(() => {
        if (!active) return [];
        const q = active.query.toLowerCase();
        return members
            .filter((m) => (q ? m.name.toLowerCase().includes(q) : true))
            .slice(0, MAX_SUGGESTIONS);
    }, [active, members]);

    const showDropdown = !!active && suggestions.length > 0;

    const handleSelectionChange = (
        e: NativeSyntheticEvent<TextInputSelectionChangeEventData>
    ) => {
        setCaret(e.nativeEvent.selection.start);
        // Clear the one-shot forced selection once it has been applied.
        if (pendingSelection) setPendingSelection(undefined);
    };

    const insertMention = (member: MentionMember) => {
        if (!active) return;
        const before = value.slice(0, active.atIndex);
        const after = value.slice(active.caret);
        const insert = `@${member.name} `;
        const next = before + insert + after;
        const newCaret = (before + insert).length;
        onChangeText(next);
        setCaret(newCaret);
        setPendingSelection({ start: newCaret, end: newCaret });
    };

    const dropdown = showDropdown ? (
        <View
            style={[
                styles.dropdown,
                dropdownPlacement === "top" ? styles.dropdownTop : styles.dropdownBottom,
            ]}
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {suggestions.map((m) => (
                    <Pressable
                        key={m.id}
                        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                        onPress={() => insertMention(m)}
                    >
                        {m.avatar ? (
                            <Image source={{ uri: m.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <Text style={styles.avatarFallbackText}>
                                    {m.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <Text style={styles.rowName} numberOfLines={1}>
                            {m.name}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    ) : null;

    return (
        <View
            style={[
                styles.container,
                containerStyle,
                // While the suggestion list is open, lift the whole input subtree
                // above sibling elements (e.g. a modal's footer buttons) so the
                // absolutely-positioned dropdown isn't painted over.
                showDropdown && styles.containerActive,
            ]}
        >
            {dropdownPlacement === "top" && dropdown}
            <TextInput
                style={inputStyle}
                placeholder={placeholder}
                placeholderTextColor={placeholderTextColor ?? colors.textSecondary}
                value={value}
                onChangeText={onChangeText}
                onSelectionChange={handleSelectionChange}
                selection={pendingSelection}
                multiline={multiline}
                maxLength={maxLength}
                autoFocus={autoFocus}
                textAlignVertical={multiline ? "top" : "center"}
            />
            {dropdownPlacement === "bottom" && dropdown}
        </View>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        container: {
            position: "relative",
        },
        containerActive: {
            zIndex: 100,
            elevation: 24,
        },
        dropdown: {
            position: "absolute",
            left: 0,
            right: 0,
            maxHeight: 196,
            backgroundColor: colors.card,
            borderRadius: 12,
            paddingVertical: 4,
            zIndex: 100,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 18,
            shadowOpacity: 0.18,
            elevation: 12,
        },
        dropdownTop: {
            bottom: "100%",
            marginBottom: 6,
        },
        dropdownBottom: {
            top: "100%",
            marginTop: 6,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 8,
        },
        rowPressed: {
            backgroundColor: colors.tag,
        },
        avatar: {
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.tag,
        },
        avatarFallback: {
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.aliceBlue,
            alignItems: "center",
            justifyContent: "center",
        },
        avatarFallbackText: {
            fontSize: 11,
            fontWeight: "700",
            color: colors.primary,
        },
        rowName: {
            flex: 1,
            fontSize: 13,
            fontWeight: "500",
            color: colors.text,
        },
    });
}

export default MentionInput;
