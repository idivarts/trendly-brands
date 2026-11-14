/**
 * Remembering the studio's layout between visits.
 *
 * Split from studio-panes.ts on purpose: PersistentStorage pulls in
 * AsyncStorage, whose native module is null under jest, so importing it
 * would make the pane ARITHMETIC untestable — and the arithmetic is the
 * part that fails quietly. This file is the thin edge that touches
 * storage; everything worth testing is next door.
 */
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";

import { DEFAULT_LAYOUT, STUDIO_LAYOUT_KEY, parseLayout, type StudioLayout } from "./studio-panes";

/** The remembered layout, or the defaults. Never throws. */
export async function loadLayout(): Promise<StudioLayout> {
    try {
        const raw = await PersistentStorage.get(STUDIO_LAYOUT_KEY);
        return raw ? parseLayout(raw) : DEFAULT_LAYOUT;
    } catch {
        // A remembered width is a convenience. Losing it must never stop
        // the studio opening.
        return DEFAULT_LAYOUT;
    }
}

/** Remember it. Deliberately not awaited by the UI. */
export function saveLayout(layout: StudioLayout): void {
    void PersistentStorage.set(STUDIO_LAYOUT_KEY, JSON.stringify(layout)).catch(() => {});
}
