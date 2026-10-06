import {
    composeScheduledAt,
    defaultScheduleAt,
    isScheduleInPast,
    schedulePresets,
    toTimeString,
} from "../schedule-presets";

describe("schedulePresets", () => {
    it("never offers a slot in the past", () => {
        // 8:30 PM — only the 9:00 PM slot is left today.
        const now = new Date(2026, 9, 7, 20, 30);
        const presets = schedulePresets(now, 3);
        expect(presets).toHaveLength(3);
        presets.forEach((p) => expect(p.date.getTime()).toBeGreaterThan(now.getTime()));
        expect(presets[0].label).toMatch(/^Today/);
        expect(presets[1].label).toMatch(/^Tomorrow/);
    });

    it("rolls entirely to tomorrow after the last slot", () => {
        const now = new Date(2026, 9, 7, 23, 45);
        const presets = schedulePresets(now, 3);
        presets.forEach((p) => expect(p.label).toMatch(/^Tomorrow/));
    });

    it("respects the 15-minute lead time", () => {
        // 6:55 PM — the 7:30 PM slot is 35 min out, so it qualifies.
        const now = new Date(2026, 9, 7, 18, 55);
        expect(schedulePresets(now, 1)[0].date.getHours()).toBe(19);
        // 7:20 PM — 7:30 PM is only 10 min out, so skip to 9:00 PM.
        const late = new Date(2026, 9, 7, 19, 20);
        expect(schedulePresets(late, 1)[0].date.getHours()).toBe(21);
    });
});

describe("defaultScheduleAt", () => {
    it("is always in the future, including late at night", () => {
        [0, 8, 13, 20, 23].forEach((h) => {
            const now = new Date(2026, 9, 7, h, 59);
            expect(defaultScheduleAt(now).getTime()).toBeGreaterThan(now.getTime());
        });
    });
});

describe("composeScheduledAt", () => {
    it("merges the date and HH:MM halves", () => {
        const d = composeScheduledAt(new Date(2026, 9, 8), "19:30");
        expect([d.getHours(), d.getMinutes()]).toEqual([19, 30]);
    });
    it("falls back to 09:00 on unset or malformed time", () => {
        expect(composeScheduledAt(new Date(2026, 9, 8), "").getHours()).toBe(9);
        expect(composeScheduledAt(new Date(2026, 9, 8), "99:99").getHours()).toBe(9);
    });
    it("round-trips through toTimeString", () => {
        const d = composeScheduledAt(new Date(2026, 9, 8), "07:05");
        expect(toTimeString(d)).toBe("07:05");
    });
});

describe("isScheduleInPast", () => {
    it("catches the old today-plus-passed-hour bug", () => {
        // The exact failure: opened at 3 PM, date defaults to today, time
        // unset -> 09:00 -> six hours in the past.
        const now = new Date(2026, 9, 7, 15, 0);
        expect(isScheduleInPast(composeScheduledAt(now, ""), now)).toBe(true);
    });
    it("allows a near-future time", () => {
        const now = new Date(2026, 9, 7, 15, 0);
        expect(isScheduleInPast(new Date(now.getTime() + 60 * 60_000), now)).toBe(false);
    });
});
