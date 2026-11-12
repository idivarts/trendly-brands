/**
 * How a scene gets made — the four lanes, and which one a scene is already in.
 *
 * ── The hole this fills ────────────────────────────────────────────────────
 * An empty scene had no path to being filled by the AI at all. The Create tab
 * offered "Regenerate this scene", gated on the scene ALREADY being a motion or
 * composite design — so a scene that was nothing could not be made into
 * anything, and the only way forward was to pick a file by hand. The user's
 * words: "I was expecting that if a scene is empty, then I could select the
 * type of scene I want it to be and then give my prompt to generate it. It
 * doesn't seem to work like that right now."
 *
 * It didn't, and the reason is this: `regenerate` has always taken an
 * `approach` of `"motion"` or `"composite"`, and the UI never exposed it. Every
 * regeneration silently sent `"motion"`. So the backend could do this the whole
 * time; nothing asked it to.
 *
 * ── Why the lanes are exclusive ────────────────────────────────────────────
 * The Create tab used to show the AI-footage controls AND the regenerate
 * controls stacked, with no indication that they are different ways to make the
 * same scene and that doing both just overwrites the first. Making them
 * exclusive is the same shape as the content MediaStage, which was rebuilt into
 * three exclusive lanes for exactly this reason: a user choosing between
 * options needs to see that they ARE choosing.
 *
 * ── Why this is a module ───────────────────────────────────────────────────
 * Same reason as `inspector-tabs.ts` and `scene-progress.ts`: this repo has
 * jest but no react-native renderer, so logic left in the panel is logic
 * nothing checks. "Which lanes can this scene use" is a rule with four inputs
 * and a cost attached to getting it wrong — offering AI footage on a format
 * that cannot hold video would take someone's money for a clip that is then
 * dropped.
 */
import type { GenerateApproach } from "@/hooks/use-studio-generate";
import { IStudioScene } from "@/shared-libs/firestore/trendly-pro/models/studio";

export type SceneLane = "motion" | "composite" | "footage" | "own";

export interface SceneLaneDef {
    key: SceneLane;
    label: string;
    /** One line, in the second person, saying what you get. */
    blurb: string;
    /**
     * What to send `regenerate` for this lane.
     *
     * Only the two DESIGN lanes have one. `footage` is a different endpoint
     * entirely (its own model, its own per-second price) and `own` is not a
     * generation at all, which is exactly why they cannot share a prompt box.
     */
    approach?: GenerateApproach;
}

const ALL: SceneLaneDef[] = [
    {
        key: "motion",
        label: "Motion graphics",
        blurb: "Animated text and shapes, designed from your prompt.",
        approach: "motion",
    },
    {
        key: "composite",
        label: "Composed still",
        blurb: "One designed frame — words over a background, no movement.",
        approach: "composite",
    },
    {
        key: "footage",
        label: "AI footage",
        // The price belongs in the lane's own controls, where the length is
        // chosen, but the warning belongs here — this is where the choice is
        // actually made.
        blurb: "A generated video clip. Much the dearest option, priced per second.",
    },
    {
        key: "own",
        label: "Your own media",
        blurb: "Upload something, or pick what you already have.",
    },
];

/**
 * The lanes this scene can actually be made through.
 *
 * `canFootage` is passed in rather than derived here because it depends on the
 * studio's format and on whether the video controls were wired up at all —
 * neither of which is a property of the scene.
 */
export function sceneLanes(opts: { canFootage: boolean }): SceneLaneDef[] {
    return ALL.filter((l) => l.key !== "footage" || opts.canFootage);
}

export function laneDef(lane: SceneLane): SceneLaneDef | undefined {
    return ALL.find((l) => l.key === lane);
}

/**
 * The lane a scene is already in, which is the one to open on.
 *
 * A scene that has been generated before opens on how it was generated, so
 * "Create" shows the controls that made it rather than asking a question the
 * scene already answers. Only a genuinely empty scene gets no default — the
 * caller then shows the picker with nothing chosen, because guessing here
 * would put a prompt box in front of someone who has not said they want a
 * design.
 */
export function currentLane(scene: IStudioScene | null): SceneLane | null {
    if (!scene) return null;

    switch (scene.primaryKind) {
        case "motion":
            return "motion";
        case "composite":
            return "composite";
        case "video":
            // Generated footage vs a clip the user uploaded. `gen` is the only
            // thing that distinguishes them, and getting it backwards would
            // offer to re-generate media that was never generated.
            return scene.gen ? "footage" : "own";
        case "image":
            return scene.gen ? "composite" : "own";
        default:
            return null;
    }
}

/**
 * The lane to actually show, given what the user picked.
 *
 * `choice` is `null` until they pick one, so the scene's own lane is the
 * default and a selection change cannot carry scene 3's choice onto scene 4.
 *
 * The `available` check is the load-bearing part: a lane the scene is already
 * in may not be offerable any more — a generated video scene on a format that
 * cannot hold video, say — and returning it would render a tab with a chosen
 * lane and no controls under it, which looks exactly like the feature being
 * broken. Falling back to `null` shows the picker instead.
 */
export function resolveLane(
    choice: SceneLane | null,
    scene: IStudioScene | null,
    available: SceneLaneDef[]
): SceneLane | null {
    const wanted = choice ?? currentLane(scene);
    if (!wanted) return null;
    return available.some((l) => l.key === wanted) ? wanted : null;
}

/**
 * Is this scene empty — nothing in it, by the authority rather than the cache?
 *
 * `layers` is the authority and `primaryKind` is a cache of `layers[0]`
 * (the model says so). They can disagree: a generation that half-landed leaves
 * `primaryKind: "motion"` with no layers, and trusting the cache there would
 * hide the picker from the one scene that most needs it.
 */
export function isEmptyScene(scene: IStudioScene | null): boolean {
    return !!scene && (scene.layers?.length ?? 0) === 0;
}
