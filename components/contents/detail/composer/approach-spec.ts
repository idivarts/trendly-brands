/**
 * Approach specs — the single table the whole composer reads from.
 *
 * An "approach" is HOW the AI should make the media: a graphic layout, a
 * photoreal image, stock photography, animated scenes, a generative clip, or a
 * cut of the user's own footage. It is a TAB on the composer, not a page and
 * not a lane — switching approach keeps the prompt and everything attached,
 * because the choice is cheap and changing your mind about it should be too.
 *
 * Everything that differs per approach lives here: the tab label, the copy, the
 * reference slots, which settings appear in the strip, the CTA verb, the
 * starter pills and the defaults. Adding an approach later is a row in this
 * table, not a new component — which is the property that stops approaches
 * quietly becoming containers with their own screens.
 *
 * Approaches that are not built yet carry `comingSoon` instead of being hidden.
 * A tab that is missing teaches nothing; a tab that is present and honest about
 * its state sets the expectation AND tells us who wants it (see ComingSoonPanel).
 */
import { ContentType } from "@/components/content-calendar/types";
import { MEDIA_SPEC } from "../media-spec";

export type ApproachId =
    | "graphic"
    | "photoreal"
    | "stock"
    | "motion"
    | "genvideo"
    | "footage";

/**
 * A control in the settings strip. Only things with a sensible default belong
 * here — anything the user must supply gets space above, in the prompt or tray.
 */
export type SettingKey =
    | "aspect"
    | "slides"
    | "quality"
    | "orientation"
    | "scenes"
    | "length"
    | "music";

/** A slot in the reference tray: content the AI needs, not a preference. */
export interface RefSlot {
    key: "attachments" | "reference" | "startFrame" | "endFrame" | "sourceVideo";
    label: string;
    /** Stacks, with an "Add another" slot after the filled ones. */
    multi?: boolean;
    /** Send stays disabled until this slot is filled. */
    required?: boolean;
    /** Renders wide, as a file row rather than a square tile. */
    upload?: boolean;
}

export interface ComingSoon {
    /** The one-line pitch, in the same voice as `description`. */
    promo: string;
    /** A second line, for what makes it worth waiting for. */
    supporting: string;
}

export interface ApproachSpec {
    id: ApproachId;
    kind: "image" | "video";
    /** Short label for the tab itself. */
    tab: string;
    /** Full name, shown in the description line under the tabs. */
    title: string;
    description: string;
    /**
     * The opening line of the brief sent to the AI.
     *
     * It carries the approach in a verb the model maps cleanly onto one of its
     * tools — "design a graphic layout" to the design tool, "generate a
     * photoreal image" to the image tool. Until the backend takes the approach
     * as a real parameter, this sentence IS the routing, so keep it blunt and
     * do not soften the verb.
     */
    briefLead: string;
    placeholder: string;
    refs: RefSlot[];
    settings: SettingKey[];
    /** The verb on the send button's accessibility label and tooltip. */
    cta: string;
    starters: string[];
    defaults: Partial<Record<SettingKey, string>>;
    /** Present ⇒ the approach is a placeholder; absent ⇒ it is live. */
    comingSoon?: ComingSoon;
}

export const APPROACHES: Record<ApproachId, ApproachSpec> = {
    graphic: {
        id: "graphic",
        kind: "image",
        tab: "Graphic design",
        title: "Graphic design with AI",
        description:
            "A composed layout. The AI writes the copy and lays it out on brand. Attach your own images and it works them in.",
        briefLead: "Design a graphic layout for this {noun}, on brand.",
        placeholder:
            "Describe what this should say and feel like — the message, the mood, who it's for.",
        refs: [{ key: "attachments", label: "Attach images", multi: true }],
        settings: ["aspect", "slides"],
        cta: "Lay it out",
        starters: [
            "A quote card from a customer review",
            "Three stats over a photo",
            "An announcement with a big headline",
        ],
        defaults: {},
    },

    photoreal: {
        id: "photoreal",
        kind: "image",
        tab: "Photoreal",
        title: "Photoreal AI image",
        description:
            "Describe a shot and a model creates it from scratch. Add a headline afterwards on the canvas.",
        briefLead: "Generate a photoreal image for this {noun}.",
        placeholder:
            "Describe the photograph — the subject, the light, the framing, the depth of field.",
        refs: [{ key: "reference", label: "Reference" }],
        settings: ["aspect", "quality", "slides"],
        cta: "Generate",
        starters: [
            "An overhead flat lay on a wooden desk",
            "A studio shot on seamless white",
            "Hands holding the product, natural light",
        ],
        defaults: { quality: "High" },
    },

    stock: {
        id: "stock",
        kind: "image",
        tab: "Stock photo",
        title: "Stock photography",
        description:
            "Real photography, searched and captioned. Credit travels with the photo and shows on publish.",
        briefLead: "Find stock photography for this {noun} and lay it out.",
        placeholder:
            "Describe the photograph you need — the subject, and any space you want left for a headline.",
        refs: [],
        settings: ["orientation", "slides"],
        cta: "Search",
        starters: [
            "Something with negative space on the left",
            "A workspace, natural light",
            "A minimal flat lay",
        ],
        defaults: { orientation: "Portrait" },
    },

    motion: {
        id: "motion",
        kind: "video",
        tab: "Motion graphics",
        title: "Motion graphics with AI",
        description:
            "Animated on-brand scenes. Attach images and the AI places them inside the scenes that fit.",
        briefLead: "Design an animated video for this {noun}, on brand.",
        placeholder:
            "Describe the video — the message, the pacing, how it should open and what it should end on.",
        refs: [{ key: "attachments", label: "Attach images", multi: true }],
        settings: ["scenes", "length", "music"],
        cta: "Write the script",
        starters: [
            "Three myths about what we do",
            "Count up our best number",
            "A launch teaser that ends on the offer",
        ],
        defaults: { scenes: "3", length: "10s", music: "Auto" },
    },

    genvideo: {
        id: "genvideo",
        kind: "video",
        tab: "AI video",
        title: "Generative AI video",
        description:
            "Describe a shot, or pin a start and end frame, and a video model creates the clip.",
        briefLead: "Generate a video clip for this {noun}.",
        placeholder: "Describe the shot — the subject, the camera move, the light.",
        refs: [
            { key: "startFrame", label: "Start frame" },
            { key: "endFrame", label: "End frame" },
        ],
        settings: ["length"],
        cta: "Generate",
        starters: [
            "A slow push onto the product on a marble counter, morning light",
            "Hands lifting the cup, steam catching the light",
            "The bottle turning slowly on seamless white",
        ],
        // Every declared setting needs a value: the strip renders a setting only
        // when it HAS one, so a missing default is a control that silently
        // vanishes. Locked in by approach-spec.test.ts. The LENGTH offered is
        // the chosen model's own min/max, not this table's list — see SETTINGS.
        defaults: { length: "8s" },
    },

    footage: {
        id: "footage",
        kind: "video",
        tab: "My footage",
        title: "Edit my footage",
        description:
            "Upload a video and the AI reads it, finds the best takes and cuts it for you.",
        briefLead: "Cut the attached footage into this {noun}.",
        placeholder:
            "Say what to do with it — what to cut, what to keep, what the hook should be.",
        refs: [{ key: "sourceVideo", label: "Your video", upload: true, required: true }],
        settings: ["length", "music"],
        cta: "Read the footage",
        starters: [
            "Cut the dead air and keep the three best lines",
            "Open on the strongest moment, then the product",
            "Tighten it to 15 seconds without losing the pricing line",
        ],
        defaults: { length: "15s", music: "Auto" },
    },
};

/** Approaches offered for a content type, in tab order. Live ones come first. */
export function approachesFor(type: ContentType): ApproachSpec[] {
    const kind = MEDIA_SPEC[type].kind;
    if (kind === "none") return [];
    return Object.values(APPROACHES).filter((a) => a.kind === kind);
}

/** The approach a freshly opened composer starts on — always a live one. */
export function defaultApproachFor(type: ContentType): ApproachId | null {
    const live = approachesFor(type).find((a) => !a.comingSoon);
    return live?.id ?? approachesFor(type)[0]?.id ?? null;
}

/**
 * Which strip settings actually apply to this content type.
 *
 * The approach says what it *could* offer; the content type says what is a real
 * choice. A reel is always 9:16, so an Aspect control on it is a control with
 * one option — worse than no control, because it implies a decision that does
 * not exist. Slides are the same: only a carousel has more than one.
 */
export function settingsFor(approach: ApproachSpec, type: ContentType): SettingKey[] {
    const spec = MEDIA_SPEC[type];
    return approach.settings.filter((key) => {
        if (key === "slides") return spec.multi;
        if (key === "aspect") return spec.aspectRatios.length > 1;
        return true;
    });
}

export interface SettingOption {
    value: string;
    name: string;
    detail?: string;
}

export interface SettingSpec {
    label: string;
    /** One line under the sheet title, when the choice needs explaining. */
    sub?: string;
    options: (type: ContentType) => SettingOption[];
}

export const SETTINGS: Record<SettingKey, SettingSpec> = {
    aspect: {
        label: "Aspect",
        options: (type) => MEDIA_SPEC[type].aspectRatios.map((v) => ({ value: v, name: v })),
    },
    slides: {
        label: "Slides",
        sub: "How many slides to make. You can add or remove them afterwards.",
        options: () => ["3", "4", "5", "6", "8", "10"].map((v) => ({ value: v, name: v })),
    },
    quality: {
        label: "Quality",
        sub: "Higher quality costs more and takes longer.",
        options: () => [
            { value: "Standard", name: "Standard" },
            { value: "High", name: "High" },
        ],
    },
    orientation: {
        label: "Orientation",
        options: () =>
            ["Portrait", "Landscape", "Any"].map((v) => ({ value: v, name: v })),
    },
    scenes: {
        label: "Scenes",
        sub: "How many scenes the video is cut into.",
        options: () => ["3", "4", "5", "6"].map((v) => ({ value: v, name: v })),
    },
    length: {
        label: "Length",
        // ⚠️ For the AI-video approach these are NOT the options offered: the
        // chosen model's own min/max bounds are, read from the registry by the
        // composer (`durationOptionsFor`). Asking a model that caps at 8s for 30
        // is refused, and a control whose value is always rejected is worse than
        // one with three that work. This list stays for motion graphics, where
        // the length is ours to choose.
        options: () => ["5s", "8s", "10s", "15s", "30s"].map((v) => ({ value: v, name: v })),
    },
    music: {
        label: "Music",
        options: () => [
            { value: "Auto", name: "Auto", detail: "The AI picks a track that fits." },
            { value: "From library", name: "From library", detail: "Choose it yourself afterwards." },
            { value: "None", name: "None" },
        ],
    },
};

/** Label shown on the strip button — the value, made readable. */
export function settingLabel(key: SettingKey, value: string): string {
    if (key === "slides") return `${value} slides`;
    if (key === "scenes") return `${value} scenes`;
    return value;
}

/** Defaults for an approach, with the content type's own answers filled in. */
export function defaultSettings(
    approach: ApproachSpec,
    type: ContentType
): Partial<Record<SettingKey, string>> {
    const spec = MEDIA_SPEC[type];
    const next: Partial<Record<SettingKey, string>> = { ...approach.defaults };
    if (spec.aspectRatios.length > 1 && !next.aspect) next.aspect = spec.aspectRatios[0];
    if (spec.multi && !next.slides) next.slides = "4";
    return next;
}
