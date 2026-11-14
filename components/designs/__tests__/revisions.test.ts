import { NO_REVISIONS, relativeTime, revisionRows, type DesignRevision } from "../revisions";

const at = (minutesAgo: number) => Date.now() - minutesAgo * 60_000;

function rev(partial: Partial<DesignRevision> & { n: number }): DesignRevision {
    return {
        prefix: `design-projects/b/d/revisions/${partial.n}`,
        at: at(10),
        by: "authoring",
        ...partial,
    };
}

describe("revisionRows", () => {
    it("is empty for a design nobody has written", () => {
        expect(revisionRows(undefined, undefined)).toEqual([]);
        expect(revisionRows([], "design-projects/b/d")).toEqual([]);
        // And the panel has something to say about it.
        expect(NO_REVISIONS).toMatch(/every version/i);
    });

    it("puts the newest first, whatever order the document had", () => {
        const rows = revisionRows([rev({ n: 1 }), rev({ n: 3 }), rev({ n: 2 })], undefined);
        expect(rows.map((r) => r.n)).toEqual([3, 2, 1]);
    });

    it("names what made each one", () => {
        const rows = revisionRows(
            [
                rev({ n: 1, by: "authoring" }),
                rev({ n: 2, by: "ai-edit" }),
                rev({ n: 3, by: "inspector" }),
                rev({ n: 4, by: "restore" }),
            ],
            undefined
        );
        expect(rows.map((r) => r.title)).toEqual([
            "Restored",
            "Edited by hand",
            "Edited by AI",
            "Written by AI",
        ]);
    });

    it("still offers a row it does not recognise", () => {
        // A later backend adding a source must not produce a blank,
        // unrestorable row in an older build.
        const rows = revisionRows([rev({ n: 1, by: "teleported" as never })], undefined);
        expect(rows[0].title).toBe("Changed");
        expect(rows[0].n).toBe(1);
    });

    it("marks the revision the design is actually pointing at", () => {
        const rows = revisionRows([rev({ n: 1 }), rev({ n: 2 })], "design-projects/b/d/revisions/1");
        expect(rows.find((r) => r.n === 1)?.current).toBe(true);
        expect(rows.find((r) => r.n === 2)?.current).toBe(false);
    });

    // After a restore, two entries name the same files. Both are "what is
    // playing" — marking only the newest would invite someone to restore the
    // film they are already watching and wonder why nothing happened.
    it("marks every entry that points at the current files, not just the newest", () => {
        const shared = "design-projects/b/d/revisions/1";
        const rows = revisionRows(
            [rev({ n: 1, prefix: shared }), rev({ n: 2 }), rev({ n: 3, prefix: shared, by: "restore" })],
            shared
        );
        expect(rows.find((r) => r.n === 3)?.current).toBe(true);
        expect(rows.find((r) => r.n === 1)?.current).toBe(true);
        expect(rows.find((r) => r.n === 2)?.current).toBe(false);
    });

    it("carries the note through, trimmed", () => {
        const rows = revisionRows([rev({ n: 1, note: "  a reel for cold brew  " })], undefined);
        expect(rows[0].note).toBe("a reel for cold brew");
        expect(revisionRows([rev({ n: 2 })], undefined)[0].note).toBe("");
    });
});

describe("relativeTime", () => {
    const now = 1_700_000_000_000;

    it("rounds down rather than up", () => {
        // 119 seconds is one minute ago, not two.
        expect(relativeTime(now - 119_000, now)).toBe("1 minute ago");
        expect(relativeTime(now - 120_000, now)).toBe("2 minutes ago");
    });

    it("counts in the largest honest unit", () => {
        expect(relativeTime(now - 10_000, now)).toBe("just now");
        expect(relativeTime(now - 90 * 60_000, now)).toBe("1 hour ago");
        expect(relativeTime(now - 50 * 3_600_000, now)).toBe("2 days ago");
        expect(relativeTime(now - 75 * 86_400_000, now)).toBe("2 months ago");
    });

    it("does not print a negative age when a clock is skewed", () => {
        // A phone a minute ahead of the Lambda that wrote the revision.
        expect(relativeTime(now + 60_000, now)).toBe("just now");
    });

    it("says nothing for a timestamp that is not one", () => {
        expect(relativeTime(0, now)).toBe("");
        expect(relativeTime(NaN, now)).toBe("");
    });
});
