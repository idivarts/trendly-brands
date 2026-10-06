// ─── schedule-presets ─────────────────────────────────────────────────────────
// Date + time for a scheduled post, treated as ONE timestamp rather than two
// independent controls.
//
// The old UI asked "When?" (a date picker) and "What time?" (a chip row of five
// fixed wall-clock times) as separate questions, with no default selected on
// either. That had three failure modes:
//
//   1. The user had to assemble the timestamp in their head to know what they'd
//      actually chosen.
//   2. Nothing was selected by default, so an unset time silently fell back to
//      09:00 — invisible until it fired.
//   3. Today + an already-passed time produced a PAST timestamp, which the
//      backend used to clamp to "publish now" — an unconfirmed live post. (The
//      backend now rejects it; see SchedulePublish.)
//
// Presets here are *relative to now* and carry a full Date, so picking one sets
// both halves at once and can never land in the past.

/** How far ahead a slot must be to be worth offering, in minutes. */
const MIN_LEAD_MINUTES = 15;

/** Candidate times of day, as [hour, minute]. Mirrors POPULAR_POSTING_TIMES. */
const SLOTS: [number, number][] = [
    [7, 0],
    [12, 0],
    [17, 0],
    [19, 30],
    [21, 0],
];

export interface SchedulePreset {
    /** e.g. "Today 5:00 PM", "Tomorrow 9:00 AM". */
    label: string;
    /** The full timestamp this preset represents. */
    date: Date;
}

const atTime = (base: Date, hour: number, minute: number) => {
    const d = new Date(base);
    d.setHours(hour, minute, 0, 0);
    return d;
};

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

/** "9:00 AM" in the device locale. */
export const formatTimeLabel = (d: Date): string =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/** "Today" / "Tomorrow" / "Tue, 14 Oct", relative to `now`. */
export const formatDayLabel = (d: Date, now: Date = new Date()): string => {
    if (isSameDay(d, now)) return "Today";
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (isSameDay(d, tomorrow)) return "Tomorrow";
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
};

/** The full "Tue, 14 Oct at 9:00 AM" string the confirm button restates. */
export const formatScheduleSentence = (d: Date, now: Date = new Date()): string =>
    `${formatDayLabel(d, now)} at ${formatTimeLabel(d)}`;

/**
 * Up to `count` upcoming slots, earliest first, starting from the next SLOT at
 * least MIN_LEAD_MINUTES out. Walks forward day by day, so an evening user gets
 * tomorrow's slots instead of a row of dead chips.
 */
export function schedulePresets(now: Date = new Date(), count = 3): SchedulePreset[] {
    const floor = new Date(now.getTime() + MIN_LEAD_MINUTES * 60_000);
    const out: SchedulePreset[] = [];

    for (let dayOffset = 0; dayOffset < 7 && out.length < count; dayOffset++) {
        const day = new Date(now);
        day.setDate(day.getDate() + dayOffset);
        for (const [h, m] of SLOTS) {
            if (out.length >= count) break;
            const candidate = atTime(day, h, m);
            if (candidate <= floor) continue;
            out.push({
                label: `${formatDayLabel(candidate, now)} ${formatTimeLabel(candidate)}`,
                date: candidate,
            });
        }
    }

    return out;
}

/**
 * The default timestamp to open the schedule step on: the first upcoming preset.
 * Never today-at-a-passed-hour, which is what the old `new Date()` + "" default
 * produced.
 */
export function defaultScheduleAt(now: Date = new Date()): Date {
    const [first] = schedulePresets(now, 1);
    if (first) return first.date;
    // Belt-and-braces: a day with no remaining slots can't happen (the walk
    // spans a week), but never return a past date.
    const fallback = new Date(now);
    fallback.setDate(fallback.getDate() + 1);
    return atTime(fallback, 9, 0);
}

/**
 * Combine the date half and the `HH:MM` time half into one Date. Falls back to
 * 09:00 when the time string is unset or malformed — same fallback the publish
 * handler used, but now always surfaced in the UI rather than hidden.
 */
export function composeScheduledAt(date: Date, timeOfPosting: string): Date {
    const d = new Date(date);
    if (/^\d{1,2}:\d{2}$/.test(timeOfPosting)) {
        const [hh, mm] = timeOfPosting.split(":").map(Number);
        if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
            d.setHours(hh, mm, 0, 0);
            return d;
        }
    }
    d.setHours(9, 0, 0, 0);
    return d;
}

/** `HH:MM` for a Date — the storage format `timeOfPosting` uses. */
export const toTimeString = (d: Date): string =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** Whether a composed timestamp has already passed (with a small grace). */
export function isScheduleInPast(at: Date, now: Date = new Date()): boolean {
    return at.getTime() < now.getTime() - 60_000;
}

/** The device's timezone, named — e.g. "IST (GMT+5:30)". */
export function timezoneLabel(): string {
    const offsetMin = -new Date().getTimezoneOffset();
    const sign = offsetMin >= 0 ? "+" : "−";
    const abs = Math.abs(offsetMin);
    const hh = Math.floor(abs / 60);
    const mm = abs % 60;
    const gmt = `GMT${sign}${hh}${mm ? `:${String(mm).padStart(2, "0")}` : ""}`;
    // The short name ("IST", "PST") isn't available everywhere; fall back to the
    // IANA zone, then to the offset alone.
    let name = "";
    try {
        const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(
            new Date()
        );
        name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    } catch {
        name = "";
    }
    if (!name) {
        try {
            name = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
        } catch {
            name = "";
        }
    }
    // Some runtimes already return "GMT+5:30" as the short name — don't double it.
    if (!name || name.startsWith("GMT") || name.startsWith("UTC")) return gmt;
    return `${name} (${gmt})`;
}
