import { useCallback, useRef, useState } from "react";
import { LayoutChangeEvent, ScrollView } from "react-native";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { contentPublishGates, PublishGateSection, PublishReadinessInput } from "./publish-readiness";

// ─── usePublishGate ───────────────────────────────────────────────────────────
// Stops the publish modal from opening while a required field is still empty,
// and sends the user to the field instead.
//
// The requirements themselves are enforced by the backend at publish time — but
// that happens AFTER the job is queued, so the failure surfaces minutes later as
// a `partially_failed` status, long after the user could have fixed it. This
// runs the same rules at the moment of the click.
//
// On a failed gate: scroll to the first offending section, flash a highlight on
// it, and toast what's missing. The publish button stays ENABLED — a disabled
// button with no hover tooltip (i.e. on every phone) teaches the user nothing.

/** How long the highlight ring stays on the offending section. */
const HIGHLIGHT_MS = 2200;

export interface PublishGateResult {
    /** Attach to the scrolling container that holds the editor sections. */
    scrollRef: React.RefObject<ScrollView | null>;
    /** `onLayout` for each gateable section, so we know where to scroll. */
    onSectionLayout: (section: PublishGateSection) => (e: LayoutChangeEvent) => void;
    /** The section currently flashing, if any. */
    highlighted: PublishGateSection | null;
    /**
     * Run the gate. Returns true when the content is ready and the caller
     * should proceed to open the publish modal; false when it handled the
     * failure (scrolled, highlighted, toasted).
     */
    checkBeforePublish: (input: PublishReadinessInput) => boolean;
}

export function usePublishGate(): PublishGateResult {
    const scrollRef = useRef<ScrollView | null>(null);
    const offsets = useRef<Partial<Record<PublishGateSection, number>>>({});
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [highlighted, setHighlighted] = useState<PublishGateSection | null>(null);

    const onSectionLayout = useCallback(
        (section: PublishGateSection) => (e: LayoutChangeEvent) => {
            offsets.current[section] = e.nativeEvent.layout.y;
        },
        []
    );

    const checkBeforePublish = useCallback((input: PublishReadinessInput) => {
        const gates = contentPublishGates(input);
        if (gates.length === 0) return true;

        const [first] = gates;

        // Scroll a little above the section so its label is visible too.
        const y = offsets.current[first.section];
        if (y !== undefined) {
            scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
        }

        setHighlighted(first.section);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setHighlighted(null), HIGHLIGHT_MS);

        // One toast, naming the first fix. Listing every gap at once would bury
        // the one the user is now looking at.
        Toaster.error(
            first.message,
            gates.length > 1 ? `${gates.length - 1} more to fix after this.` : ""
        );
        return false;
    }, []);

    return { scrollRef, onSectionLayout, highlighted, checkBeforePublish };
}
