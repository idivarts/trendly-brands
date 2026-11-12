/**
 * Which tab of the inspector the user can be on, and what it should be
 * advertising.
 *
 * ── Why the inspector needed splitting at all ───────────────────────────────
 * It was one scroll of nine sections, and the sections did not belong to the
 * same thing. "Length", "How it arrives" and the layer list are properties of
 * the SELECTED SCENE. "Sound" is the voice and the music bed for the WHOLE
 * VIDEO. They sat four pixels apart under a panel whose heading named a scene,
 * so changing the music looked like changing this scene's music — and a user
 * who believes that has no reason to ever look for it again.
 *
 * So the tabs are not a tidier arrangement of the same list. They are a split
 * by SCOPE: three tabs that act on the selected scene, one that acts on the
 * document. `scope` below is the load-bearing field; the labels just say it out
 * loud.
 *
 * ── Why this is a module and not just state in the panel ────────────────────
 * Two reasons. The panel cannot be rendered in a test (this app has jest but no
 * react-native renderer), so logic left inside it is logic nothing can check.
 * And the same questions get asked in two places — the strip asks "is this tab
 * reachable, does it need a dot", the body asks "what am I showing" — which is
 * exactly the shape that drifts. `scene-progress.ts` exists for the same
 * reason, after the rail and the screen disagreed about which scenes were
 * being worked on.
 */
import { IStudioScene } from "@/shared-libs/firestore/trendly-pro/models/studio";
import { beingMade } from "@/components/studio/scene-progress";

export type InspectorTab = "scene" | "create" | "narration" | "video";

export interface InspectorTabDef {
    key: InspectorTab;
    label: string;
    /**
     * Whose settings this tab holds.
     *
     * `"document"` means the controls apply to the whole video regardless of
     * what is selected — which is why such a tab stays reachable with no scene
     * selected, and why its body says so in words.
     */
    scope: "scene" | "document";
}

/** Left to right, narrow enough to sit in a docked panel without scrolling. */
export const INSPECTOR_TABS: InspectorTabDef[] = [
    { key: "scene", label: "Scene", scope: "scene" },
    { key: "create", label: "Create", scope: "scene" },
    { key: "narration", label: "Narration", scope: "scene" },
    // Named for its SUBJECT — the video — rather than its contents. "Sound"
    // would have re-created the exact ambiguity the split exists to remove,
    // and "Whole video" is the honest label but does not fit the 320px docked
    // panel, where it truncates to "Whole vi…". The scope is carried by the
    // sentence at the top of the tab's body instead, which is a better place
    // for it than a label nobody reads twice.
    { key: "video", label: "Video", scope: "document" },
];

function defOf(tab: InspectorTab): InspectorTabDef | undefined {
    return INSPECTOR_TABS.find((t) => t.key === tab);
}

/**
 * Can the user be on this tab right now?
 *
 * With nothing selected the three scene tabs have no subject, but the
 * document-scoped one still does — the voice and the music bed belong to the
 * video, and making them unreachable because no scene happens to be selected
 * was its own small bug.
 */
export function tabAvailable(tab: InspectorTab, scene: IStudioScene | null): boolean {
    if (scene) return true;
    return defOf(tab)?.scope === "document";
}

/**
 * The tab to actually render, given the one the user last chose.
 *
 * The choice is kept across selection changes on purpose: comparing scene 3's
 * narration with scene 4's is a thing people do, and being thrown back to the
 * first tab on every click would make it impossible.
 */
export function resolveTab(wanted: InspectorTab, scene: IStudioScene | null): InspectorTab {
    return tabAvailable(wanted, scene) ? wanted : "video";
}

/**
 * What the tab's dot should say.
 *
 * `"alert"` is for something the user has to deal with, `"quiet"` for something
 * that merely exists. Nothing gets a dot for being in a normal state — a strip
 * where every tab is marked marks nothing.
 */
export type TabFlag = "none" | "quiet" | "alert";

export function tabFlag(tab: InspectorTab, scene: IStudioScene | null): TabFlag {
    if (!scene) return "none";

    switch (tab) {
        case "scene":
            // An empty scene is the one state the panel used to say nothing
            // about: it rendered a layer list with no rows and left the user to
            // notice. It is only the user's problem when nothing is making it.
            if ((scene.layers?.length ?? 0) === 0 && !beingMade(scene)) return "alert";
            return "none";

        case "create":
            // A failed generation is the single most important thing this panel
            // can tell anyone, and it used to be a line of red text eight
            // sections down a scroll.
            if (scene.gen?.status === "failed") return "alert";
            if (beingMade(scene)) return "quiet";
            // An empty scene's way forward lives in this tab, so the dot that
            // marks it belongs here too — not only on Scene, where the only
            // offer is picking a file by hand.
            if ((scene.layers?.length ?? 0) === 0) return "alert";
            return "none";

        case "narration":
            return scene.narration?.line?.trim() ? "quiet" : "none";

        default:
            // The document tab's state does not depend on the selection, and a
            // dot that is always on is noise.
            return "none";
    }
}
