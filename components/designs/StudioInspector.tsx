/**
 * The properties of whatever is selected, and the controls that change it.
 *
 * ── What this is for ──────────────────────────────────────────────────────
 * The edits that should never cost a model call: a headline's words, its
 * colour, its size and weight, how it is aligned, when it starts and how
 * long it lasts. None of those needs a sentence of English and a four
 * second wait.
 *
 * ── One write per settled change ──────────────────────────────────────────
 * Every write is a revision, and the retention cap is ten, so a colour
 * dragged across the spectrum must not spend someone's entire history on a
 * gesture they have not finished making. The draft is local and immediate;
 * the write happens once the user stops. The rules live in
 * inspector-edit.ts, where they are tested.
 *
 * ── Why the panel shows computed values ───────────────────────────────────
 * Most elements carry no inline style at all — the brand kit styles them
 * from a class — so the bridge reports what the element LOOKS like and the
 * panel writes changes back inline. Which means it must send only what the
 * user actually touched: writing the whole draft back would freeze every
 * element they merely looked at against the brand kit.
 */
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
    EDIT_DEBOUNCE_MS,
    draftFrom,
    editBetween,
    worthSending,
    type ElementDraft,
    type ElementEdit,
} from "./inspector-edit";
import { selectionLabel, type Selection } from "./selection";

export interface StudioInspectorProps {
    selection: Selection | null;
    /**
     * Sends a settled change, and says whether it landed.
     *
     * The answer is load-bearing: a caller that refuses an edit while
     * another is in flight must say so, or the panel would move its
     * baseline past a change the film never received and no later edit
     * would ever re-send it.
     */
    onEdit: (edit: ElementEdit) => boolean | void | Promise<boolean | void>;
    /** True while one is in flight, so the panel can say so. */
    saving?: boolean;
    /** Why the last edit was refused, if it was. */
    error?: string | null;
}

const WEIGHTS = ["400", "600", "700", "800"];
const ALIGNMENTS = ["left", "center", "right"];

const StudioInspector: React.FC<StudioInspectorProps> = ({ selection, onEdit, saving, error }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    // What the element was when it was selected, and what the user has made
    // of it since. The difference between the two IS the edit.
    const [committed, setCommitted] = useState<ElementDraft | null>(null);
    const [draft, setDraft] = useState<ElementDraft | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // What a pending debounce would send. Held in a ref so that changing
    // the selection can FIRE it rather than lose it.
    const pending = useRef<(() => void) | null>(null);
    // Which element the panel is showing right now, read inside the
    // debounce's callback — which may run after the user has clicked
    // something else.
    const showing = useRef<string | null>(null);

    const flush = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
        const run = pending.current;
        pending.current = null;
        run?.();
    }, []);

    // A new selection replaces the draft outright. Keeping a half-typed
    // headline and applying it to the next element clicked would be a
    // genuinely destructive surprise — but the edit to the element they
    // were ON is theirs and has to land, so it is sent now rather than
    // cancelled.
    useEffect(() => {
        flush();
        showing.current = selection?.elementId ?? null;
        if (!selection) {
            setCommitted(null);
            setDraft(null);
            return;
        }
        const next = draftFrom(selection.text, selection.style, selection.startMs, selection.durationMs);
        setCommitted(next);
        setDraft(next);
    }, [selection, flush]);

    // On the way out, the same: send what is waiting rather than drop it.
    useEffect(() => () => flush(), [flush]);

    const change = useCallback(
        (patch: Partial<ElementDraft>) => {
            if (!selection || !draft || !committed) return;
            const next = { ...draft, ...patch };
            setDraft(next);
            if (timer.current) clearTimeout(timer.current);

            const send = async () => {
                pending.current = null;
                const edit = editBetween(selection.elementId, committed, next);
                if (!worthSending(edit)) return;
                const landed = await Promise.resolve(onEdit(edit as ElementEdit));
                // ── Two reasons not to move the baseline ─────────────────
                // A caller that refused the edit — one already in flight —
                // returns false, and moving on would mean the change is
                // never sent by anything: the panel would show a value the
                // film does not have, with no error to explain it.
                //
                // And a debounce that fires AFTER the user clicked
                // something else belongs to the element they left. Its edit
                // still goes, but writing its values in as the new
                // element's baseline would have the next touch of any
                // control send the old element's styling to this one.
                if (landed === false) return;
                if (showing.current !== selection.elementId) return;
                setCommitted(next);
            };
            pending.current = () => void send();
            timer.current = setTimeout(() => void send(), EDIT_DEBOUNCE_MS);
        },
        [selection, draft, committed, onEdit]
    );

    if (!selection || !draft) {
        return (
            <View style={styles.root}>
                <Text style={styles.head}>Nothing selected</Text>
                <Text style={styles.label}>Click something in the player.</Text>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <View style={styles.headRow}>
                <Text style={styles.head}>{saving ? "Saving…" : "Selected"}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                    {[selection.tag && `<${selection.tag}>`, selection.elementId].filter(Boolean).join(" · ")}
                </Text>
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <TextInput
                value={draft.text}
                onChangeText={(text) => change({ text })}
                style={styles.textField}
                multiline
                placeholder={selectionLabel(selection)}
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="The element's words"
            />

            <View style={styles.row}>
                <Swatch
                    label="Colour"
                    value={draft.color}
                    onChange={(color) => change({ color })}
                    colors={colors}
                    styles={styles}
                />
                <Swatch
                    label="Background"
                    value={draft.backgroundColor}
                    onChange={(backgroundColor) => change({ backgroundColor })}
                    colors={colors}
                    styles={styles}
                />
            </View>

            <View style={styles.row}>
                <Stepper
                    label="Size"
                    value={draft.fontSizePx}
                    suffix="px"
                    step={4}
                    min={8}
                    onChange={(fontSizePx) => change({ fontSizePx })}
                    styles={styles}
                />
            </View>

            <Segmented
                label="Weight"
                options={WEIGHTS}
                value={draft.fontWeight}
                onChange={(fontWeight) => change({ fontWeight })}
                styles={styles}
            />
            <Segmented
                label="Align"
                options={ALIGNMENTS}
                value={draft.textAlign}
                onChange={(textAlign) => change({ textAlign })}
                styles={styles}
            />

            <View style={styles.row}>
                <Stepper
                    label="Starts"
                    value={draft.startMs}
                    suffix="s"
                    step={100}
                    min={0}
                    scale={1000}
                    onChange={(startMs) => change({ startMs })}
                    styles={styles}
                />
                <Stepper
                    label="Lasts"
                    value={draft.durationMs}
                    suffix="s"
                    step={100}
                    min={100}
                    scale={1000}
                    onChange={(durationMs) => change({ durationMs })}
                    styles={styles}
                />
            </View>
        </View>
    );
};

/** A colour, typed as hex, with what it looks like beside it. */
const Swatch: React.FC<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof useStyles>;
}> = ({ label, value, onChange, colors, styles }) => (
    <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.swatchRow}>
            <View
                style={[
                    styles.chip,
                    // An empty value is "no background", drawn as nothing
                    // rather than as black — which is what an empty colour
                    // string would otherwise render as.
                    value ? { backgroundColor: value } : styles.chipEmpty,
                ]}
            />
            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="—"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.hexField}
                accessibilityLabel={label}
            />
        </View>
    </View>
);

/** A number with − and + beside it, in whatever unit the caller names. */
const Stepper: React.FC<{
    label: string;
    value: number | null;
    suffix: string;
    step: number;
    min: number;
    /** Divide by this to display: 1000 turns milliseconds into seconds. */
    scale?: number;
    onChange: (v: number) => void;
    styles: ReturnType<typeof useStyles>;
}> = ({ label, value, suffix, step, min, scale = 1, onChange, styles }) => {
    const shown = value === null ? "—" : `${round(value / scale)}${suffix}`;
    const bump = (by: number) => onChange(Math.max(min, (value ?? min) + by));
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.stepper}>
                <Pressable onPress={() => bump(-step)} style={styles.stepButton} accessibilityLabel={`${label} down`}>
                    <Text style={styles.stepLabel}>−</Text>
                </Pressable>
                <Text style={styles.stepValue}>{shown}</Text>
                <Pressable onPress={() => bump(step)} style={styles.stepButton} accessibilityLabel={`${label} up`}>
                    <Text style={styles.stepLabel}>+</Text>
                </Pressable>
            </View>
        </View>
    );
};

/** One of a few choices. */
const Segmented: React.FC<{
    label: string;
    options: string[];
    value: string;
    onChange: (v: string) => void;
    styles: ReturnType<typeof useStyles>;
}> = ({ label, options, value, onChange, styles }) => (
    <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.segments}>
            {options.map((o) => (
                <Pressable
                    key={o}
                    onPress={() => onChange(o)}
                    style={[styles.segment, value === o && styles.segmentOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: value === o }}
                >
                    <Text style={[styles.segmentLabel, value === o && styles.segmentLabelOn]}>{o}</Text>
                </Pressable>
            ))}
        </View>
    </View>
);

/** 1.5 stays 1.5; 3.0 prints as 3. */
function round(n: number): string {
    return String(Math.round(n * 100) / 100);
}

const useStyles = (colors: ReturnType<typeof Colors>) =>
    React.useMemo(
        () =>
            StyleSheet.create({
                root: { padding: 10, gap: 8, backgroundColor: colors.background },
                headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
                head: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: withAlpha(colors.text, 0.5),
                },
                meta: { fontSize: fs(10), lineHeight: lh(14), color: withAlpha(colors.text, 0.45), flexShrink: 1 },
                label: { fontSize: fs(12), lineHeight: lh(17), color: colors.text },
                error: { fontSize: fs(10), lineHeight: lh(15), color: colors.errorBannerText },

                textField: {
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    color: colors.text,
                    backgroundColor: colors.tag,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    minHeight: 46,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },

                row: { flexDirection: "row", gap: 8 },
                field: { flex: 1, gap: 4 },
                fieldLabel: {
                    fontSize: fs(9),
                    lineHeight: lh(13),
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: withAlpha(colors.text, 0.45),
                },

                swatchRow: { flexDirection: "row", alignItems: "center", gap: 6 },
                chip: { width: 18, height: 18, borderRadius: 5 },
                chipEmpty: { backgroundColor: withAlpha(colors.text, 0.08) },
                hexField: {
                    flex: 1,
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    color: colors.text,
                    backgroundColor: colors.tag,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                },

                stepper: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: colors.tag,
                    borderRadius: 8,
                    paddingHorizontal: 4,
                },
                stepButton: { paddingHorizontal: 8, paddingVertical: 4 },
                stepLabel: { fontSize: fs(13), lineHeight: lh(18), color: colors.text },
                stepValue: { fontSize: fs(11), lineHeight: lh(16), color: colors.text },

                segments: { flexDirection: "row", gap: 4 },
                segment: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 5,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                segmentOn: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.3,
                    elevation: 2,
                },
                segmentLabel: { fontSize: fs(10), lineHeight: lh(14), color: colors.text },
                segmentLabelOn: { color: colors.white, fontWeight: "700" },
            }),
        [colors]
    );

export default StudioInspector;
