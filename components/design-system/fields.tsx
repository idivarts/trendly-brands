/**
 * Shared field primitives for the Design System editor.
 *
 * Every section composes these so the whole editor stays visually consistent and
 * obeys the app's styling rules (Colors(theme) tokens, shadows-not-borders,
 * no inline styles). Keep purely presentational logic here; section-specific
 * shape lives in each section component.
 */
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
    Chip,
    HelperText,
    IconButton,
    Text as PaperText,
    TextInput as PaperTextInput,
} from "react-native-paper";

type AppColors = ReturnType<typeof Colors>;

// ── Section intro (title + one-line description) ──────────────────────────────
export const SectionIntro: React.FC<{ title: string; subtitle?: string }> = ({
    title,
    subtitle,
}) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <View style={styles.introWrap}>
            <PaperText variant="titleMedium" style={styles.introTitle}>
                {title}
            </PaperText>
            {!!subtitle && <PaperText style={styles.introSubtitle}>{subtitle}</PaperText>}
        </View>
    );
};

// ── Vertical stack with consistent spacing between fields ─────────────────────
export const FieldStack: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    return <View style={styles.fieldStack}>{children}</View>;
};

// ── A small label above a group of fields ─────────────────────────────────────
export const FieldLabel: React.FC<{ children: React.ReactNode; hint?: string }> = ({
    children,
    hint,
}) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <View style={styles.fieldLabelWrap}>
            <PaperText style={styles.fieldLabel}>{children}</PaperText>
            {!!hint && <PaperText style={styles.fieldHint}>{hint}</PaperText>}
        </View>
    );
};

// ── Outlined text input (mirrors BrandMemory's input styling) ─────────────────
export const DSTextInput: React.FC<{
    label?: string;
    value?: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    multiline?: boolean;
    numberOfLines?: number;
    keyboardType?: "default" | "url" | "numeric";
    autoCapitalize?: "none" | "sentences" | "words";
    maxLength?: number;
}> = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline,
    numberOfLines,
    keyboardType = "default",
    autoCapitalize = "sentences",
    maxLength,
}) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <PaperTextInput
            mode="outlined"
            label={label}
            value={value ?? ""}
            onChangeText={onChangeText}
            placeholder={placeholder}
            multiline={multiline}
            numberOfLines={numberOfLines}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            maxLength={maxLength}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            outlineStyle={styles.inputOutline}
            style={styles.input}
        />
    );
};

// ── Chip list: add free-text tokens, remove by tapping the close icon ──────────
export const ChipInput: React.FC<{
    label?: string;
    hint?: string;
    values?: string[];
    onChange: (next: string[]) => void;
    placeholder?: string;
}> = ({ label, hint, values, onChange, placeholder }) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [text, setText] = useState("");

    const list = values ?? [];
    const commit = () => {
        const v = text.trim();
        if (!v) return;
        if (!list.includes(v)) onChange([...list, v]);
        setText("");
    };
    const remove = (item: string) => onChange(list.filter((x) => x !== item));

    return (
        <View style={styles.chipBlock}>
            {!!label && <FieldLabel hint={hint}>{label}</FieldLabel>}
            <PaperTextInput
                mode="outlined"
                value={text}
                onChangeText={setText}
                onSubmitEditing={commit}
                blurOnSubmit={false}
                returnKeyType="done"
                placeholder={placeholder}
                autoCapitalize="none"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                outlineStyle={styles.inputOutline}
                style={styles.input}
                right={
                    text.trim().length > 0 ? (
                        <PaperTextInput.Icon icon="plus" onPress={commit} forceTextInputFocus={false} />
                    ) : undefined
                }
            />
            {list.length > 0 && (
                <View style={styles.chipRow}>
                    {list.map((item) => (
                        <Chip
                            key={item}
                            onClose={() => remove(item)}
                            style={styles.chip}
                            textStyle={styles.chipText}
                        >
                            {item}
                        </Chip>
                    ))}
                </View>
            )}
        </View>
    );
};

// ── Segmented enum selector (single choice, clearable) ────────────────────────
export const OptionSelect: React.FC<{
    label?: string;
    options: { value: string; label: string }[];
    value?: string;
    onChange: (v: string | undefined) => void;
    /** When true, tapping the active option clears the selection. */
    clearable?: boolean;
}> = ({ label, options, value, onChange, clearable = true }) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <View style={styles.chipBlock}>
            {!!label && <FieldLabel>{label}</FieldLabel>}
            <View style={styles.optionRow}>
                {options.map((opt) => {
                    const active = value === opt.value;
                    return (
                        <Pressable
                            key={opt.value}
                            onPress={() => onChange(clearable && active ? undefined : opt.value)}
                            style={[styles.optionPill, active && styles.optionPillActive]}
                        >
                            <View>
                                <PaperText
                                    style={[
                                        styles.optionPillText,
                                        active && styles.optionPillTextActive,
                                    ]}
                                >
                                    {opt.label}
                                </PaperText>
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

// ── Tone dial: five steps between two poles, mapped to 0..100 ─────────────────
const TONE_STEPS = [0, 25, 50, 75, 100];
const TONE_HIT_SLOP = { top: 14, bottom: 14, left: 8, right: 8 };

/** Words for the currently-selected step, so the dial reads back its value. */
function toneStepLabel(step: number | undefined, low: string, high: string): string {
    switch (step) {
        case 0:
            return `Very ${low.toLowerCase()}`;
        case 25:
            return low;
        case 50:
            return "Balanced";
        case 75:
            return high;
        case 100:
            return `Very ${high.toLowerCase()}`;
        default:
            return "Not set";
    }
}

export const ToneDial: React.FC<{
    low: string;
    high: string;
    value?: number;
    onChange: (v: number | undefined) => void;
}> = ({ low, high, value, onChange }) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    // Snap the stored 0..100 value to the nearest step for highlighting.
    const activeStep =
        typeof value === "number"
            ? TONE_STEPS.reduce((a, b) => (Math.abs(b - value) < Math.abs(a - value) ? b : a))
            : undefined;
    return (
        <View style={styles.toneBlock}>
            <View style={styles.toneRow}>
                <PaperText style={styles.tonePole}>{low}</PaperText>
                <View style={styles.toneTrack}>
                    {TONE_STEPS.map((step) => {
                        const active = activeStep === step;
                        return (
                            <Pressable
                                key={step}
                                onPress={() => onChange(active ? undefined : step)}
                                hitSlop={TONE_HIT_SLOP}
                                style={styles.toneDotHit}
                            >
                                <View style={[styles.toneDot, active && styles.toneDotActive]} />
                            </Pressable>
                        );
                    })}
                </View>
                <PaperText style={[styles.tonePole, styles.tonePoleRight]}>{high}</PaperText>
            </View>
            <PaperText style={[styles.toneValue, activeStep === undefined && styles.toneValueMuted]}>
                {toneStepLabel(activeStep, low, high)}
            </PaperText>
        </View>
    );
};

// ── A single hex color row: swatch + name + hex + remove ──────────────────────
export const HexSwatch: React.FC<{ hex?: string; size?: number }> = ({ hex, size = 34 }) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const valid = isValidHex(hex);
    return (
        <View
            style={[
                styles.swatch,
                { width: size, height: size, backgroundColor: valid ? (hex as string) : colors.tag },
            ]}
        >
            {!valid && <PaperText style={styles.swatchQ}>?</PaperText>}
        </View>
    );
};

// ── A row that can be removed (used by repeated color/font/logo rows) ─────────
export const RemovableRow: React.FC<{ onRemove: () => void; children: React.ReactNode }> = ({
    onRemove,
    children,
}) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <View style={styles.removableRow}>
            <View style={styles.removableBody}>{children}</View>
            <IconButton icon="close" size={18} onPress={onRemove} iconColor={colors.textSecondary} />
        </View>
    );
};

// ── An "add another" ghost button used to append rows ─────────────────────────
export const AddRowButton: React.FC<{ label: string; onPress: () => void }> = ({
    label,
    onPress,
}) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <Pressable onPress={onPress} style={styles.addRow}>
            <PaperText style={styles.addRowText}>＋ {label}</PaperText>
        </Pressable>
    );
};

export const InlineHelp: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <HelperText type="info">{children}</HelperText>
);

export function isValidHex(hex?: string): boolean {
    return !!hex && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

function createStyles(colors: AppColors) {
    return StyleSheet.create({
        fieldStack: {
            gap: 14,
        },
        introWrap: {
            marginBottom: 16,
        },
        introTitle: {
            fontWeight: "800",
            color: colors.text,
        },
        introSubtitle: {
            color: colors.textSecondary,
            marginTop: 4,
            fontSize: 13,
            lineHeight: 18,
        },
        fieldLabelWrap: {
            marginBottom: 6,
        },
        fieldLabel: {
            color: colors.text,
            fontWeight: "700",
            fontSize: 13,
        },
        fieldHint: {
            color: colors.textSecondary,
            fontSize: 12,
            marginTop: 1,
        },
        inputOutline: {
            borderRadius: 12,
        },
        input: {
            backgroundColor: colors.background,
        },
        chipBlock: {
            marginTop: 4,
        },
        chipRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 10,
        },
        chip: {
            backgroundColor: colors.tag,
        },
        chipText: {
            color: colors.text,
            fontSize: 13,
        },
        optionRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        optionPill: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: colors.tag,
        },
        optionPillActive: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        optionPillText: {
            color: colors.text,
            fontSize: 13,
            fontWeight: "600",
            textTransform: "capitalize",
        },
        optionPillTextActive: {
            color: colors.onPrimary,
        },
        toneBlock: {
            marginVertical: 6,
        },
        toneRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        tonePole: {
            color: colors.textSecondary,
            fontSize: 12,
            width: 78,
        },
        tonePoleRight: {
            textAlign: "right",
        },
        toneTrack: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        toneDotHit: {
            paddingVertical: 6,
        },
        toneDot: {
            width: 16,
            height: 16,
            borderRadius: 999,
            backgroundColor: colors.tag,
        },
        toneDotActive: {
            backgroundColor: colors.primary,
            transform: [{ scale: 1.25 }],
        },
        toneValue: {
            textAlign: "center",
            color: colors.primary,
            fontSize: 12,
            fontWeight: "700",
            marginTop: 4,
        },
        toneValueMuted: {
            color: colors.textSecondary,
            fontWeight: "500",
        },
        swatch: {
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.12,
            elevation: 1,
        },
        swatchQ: {
            color: colors.textSecondary,
            fontWeight: "700",
        },
        removableRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 4,
        },
        removableBody: {
            flex: 1,
        },
        addRow: {
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: colors.tag,
            alignItems: "center",
            marginTop: 10,
        },
        addRowText: {
            color: colors.primary,
            fontWeight: "700",
            fontSize: 14,
        },
    });
}
