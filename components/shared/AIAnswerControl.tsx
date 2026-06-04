import type { AIControl } from "@/hooks/use-ai-chat";
import Colors, { ColorsStatic } from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// Validation mirrors the brand form + backend (BrandDetailsForm / onboarding_tools.go)
// so the chat, the fallback form, and the server all agree on what is valid.
const PHONE_RE =
    /^\+?[1-9]\d{0,2}[\s-]?(\(?\d{1,4}\)?[\s-]?)?\d{1,4}([\s-]?\d{1,4}){1,3}$/;
const URL_RE = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(inputType: AIControl["inputType"], value: string): string | null {
    const v = value.trim();
    if (!v) return "Please enter a value";
    switch (inputType) {
        case "phone":
            return PHONE_RE.test(v) ? null : "Enter a valid phone number";
        case "url":
            return URL_RE.test(v) ? null : "Enter a valid website URL";
        case "email":
            return EMAIL_RE.test(v) ? null : "Enter a valid email address";
        default:
            return null;
    }
}

function keyboardFor(inputType: AIControl["inputType"]) {
    switch (inputType) {
        case "phone":
            return "phone-pad" as const;
        case "url":
            return "url" as const;
        case "email":
            return "email-address" as const;
        default:
            return "default" as const;
    }
}

interface AIAnswerControlProps {
    control: AIControl;
    /** Disabled while the AI is responding. */
    disabled?: boolean;
    /** Called with the human-readable answer to send as the next user message. */
    onSubmit: (text: string) => void;
}

/**
 * Renders the structured answer control attached to an assistant message:
 *  - options (single): tap a chip to answer immediately.
 *  - options (multi): toggle chips, then Continue.
 *  - options + allowCustom: also type your own answer.
 *  - input: a validated field (phone / url / email / text), optionally skippable.
 *
 * The submitted text is sent back through the normal chat path as a user turn,
 * so streaming + persistence stay unchanged.
 */
const AIAnswerControl: React.FC<AIAnswerControlProps> = ({ control, disabled, onSubmit }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const [selected, setSelected] = useState<string[]>([]);
    const [custom, setCustom] = useState("");
    const [text, setText] = useState("");
    const [error, setError] = useState<string | null>(null);

    const submit = (value: string) => {
        if (disabled) return;
        onSubmit(value);
    };

    // ── Typed input control ──────────────────────────────────────────────────
    if (control.kind === "input") {
        const onSend = () => {
            const err = validate(control.inputType, text);
            if (err) {
                setError(err);
                return;
            }
            submit(text.trim());
        };
        return (
            <View style={styles.container}>
                <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
                    <TextInput
                        style={styles.input}
                        value={text}
                        onChangeText={(t) => {
                            setText(t);
                            if (error) setError(null);
                        }}
                        placeholder={control.placeholder || "Type your answer…"}
                        placeholderTextColor={colors.textSecondary}
                        keyboardType={keyboardFor(control.inputType)}
                        autoCapitalize="none"
                        editable={!disabled}
                        onSubmitEditing={onSend}
                        returnKeyType="send"
                    />
                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryBtn,
                            pressed && styles.pressed,
                            (disabled || !text.trim()) && styles.btnDisabled,
                        ]}
                        onPress={onSend}
                        disabled={disabled || !text.trim()}
                    >
                        <Text style={styles.primaryBtnText}>Send</Text>
                    </Pressable>
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {control.optional ? (
                    <Pressable
                        style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
                        onPress={() => submit("Skip this question")}
                        disabled={disabled}
                    >
                        <Text style={styles.skipText}>Skip</Text>
                    </Pressable>
                ) : null}
            </View>
        );
    }

    // ── Options control ──────────────────────────────────────────────────────
    const isMulti = control.selectionType === "multi";
    const options = control.options ?? [];

    const toggle = (value: string) => {
        if (disabled) return;
        if (!isMulti) {
            submit(value);
            return;
        }
        setSelected((prev) =>
            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
    };

    const onContinue = () => {
        const all = [...selected];
        const c = custom.trim();
        if (c) all.push(c);
        if (all.length === 0) return;
        submit(all.join(", "));
    };

    return (
        <View style={styles.container}>
            <View style={styles.chipWrap}>
                {options.map((opt) => {
                    const active = selected.includes(opt.value);
                    return (
                        <Pressable
                            key={opt.value}
                            style={({ pressed }) => [
                                styles.chip,
                                active && styles.chipActive,
                                pressed && styles.pressed,
                                disabled && styles.btnDisabled,
                            ]}
                            onPress={() => toggle(opt.value)}
                            disabled={disabled}
                        >
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                {opt.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {control.allowCustom ? (
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        value={custom}
                        onChangeText={setCustom}
                        placeholder="Or type your own…"
                        placeholderTextColor={colors.textSecondary}
                        editable={!disabled}
                        onSubmitEditing={isMulti ? undefined : () => custom.trim() && submit(custom.trim())}
                        returnKeyType={isMulti ? "done" : "send"}
                    />
                    {!isMulti ? (
                        <Pressable
                            style={({ pressed }) => [
                                styles.primaryBtn,
                                pressed && styles.pressed,
                                (disabled || !custom.trim()) && styles.btnDisabled,
                            ]}
                            onPress={() => custom.trim() && submit(custom.trim())}
                            disabled={disabled || !custom.trim()}
                        >
                            <Text style={styles.primaryBtnText}>Send</Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}

            {isMulti ? (
                <Pressable
                    style={({ pressed }) => [
                        styles.continueBtn,
                        pressed && styles.pressed,
                        (disabled || (selected.length === 0 && !custom.trim())) && styles.btnDisabled,
                    ]}
                    onPress={onContinue}
                    disabled={disabled || (selected.length === 0 && !custom.trim())}
                >
                    <Text style={styles.primaryBtnText}>Continue</Text>
                </Pressable>
            ) : null}
        </View>
    );
};

export default AIAnswerControl;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: { marginTop: 8, gap: 8 },
                chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
                chip: {
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 18,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.06,
                    elevation: 1,
                },
                chipActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                chipText: { fontSize: 13, fontWeight: "600", color: colors.text },
                chipTextActive: { color: colors.onPrimary },
                inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
                // Validation-error border is an allowed exception to the no-border rule.
                inputRowError: { borderRadius: 12, borderWidth: 1.5, borderColor: ColorsStatic.red },
                input: {
                    flex: 1,
                    minHeight: 40,
                    borderRadius: 12,
                    backgroundColor: colors.tag,
                    color: colors.text,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                primaryBtn: {
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                primaryBtnText: { color: colors.onPrimary, fontWeight: "700", fontSize: 13 },
                continueBtn: {
                    alignSelf: "flex-start",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                skipBtn: { alignSelf: "flex-start", paddingHorizontal: 4, paddingVertical: 6 },
                skipText: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
                errorText: { color: ColorsStatic.red, fontSize: 12 },
                pressed: { opacity: 0.75 },
                btnDisabled: { opacity: 0.4 },
            }),
        [colors]
    );
}
