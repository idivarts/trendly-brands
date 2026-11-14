import {
    groupScript,
    lineBadge,
    lineEdit,
    sceneTitle,
    worthSendingLine,
    type ScriptLine,
} from "../script-lines";

const line = (p: Partial<ScriptLine> & { elementId: string }): ScriptLine => ({
    sceneId: "hook",
    kind: "text",
    tag: "h1",
    text: "Hit the 2 PM wall?",
    startMs: 0,
    ...p,
});

describe("groupScript", () => {
    it("is empty for a film nobody has written", () => {
        expect(groupScript(undefined)).toEqual([]);
        expect(groupScript([])).toEqual([]);
    });

    it("keeps the order the backend sent and groups by scene", () => {
        const scenes = groupScript([
            line({ elementId: "vo", kind: "voice", text: "Spoken first" }),
            line({ elementId: "a" }),
            line({ elementId: "b", sceneId: "end", text: "Fuel your focus", startMs: 3000 }),
        ]);
        expect(scenes.map((s) => s.sceneId)).toEqual(["hook", "end"]);
        expect(scenes[0].lines.map((l) => l.elementId)).toEqual(["vo", "a"]);
        expect(scenes[1].lines.map((l) => l.elementId)).toEqual(["b"]);
    });

    // Two moments in the film that happen to share a name are two scenes.
    // Merging them would show someone a scene that does not exist.
    it("does not merge two scenes with the same name", () => {
        const scenes = groupScript([
            line({ elementId: "a", sceneId: "beat" }),
            line({ elementId: "b", sceneId: "other", startMs: 1000 }),
            line({ elementId: "c", sceneId: "beat", startMs: 2000 }),
        ]);
        expect(scenes).toHaveLength(3);
        expect(scenes.map((s) => s.sceneId)).toEqual(["beat", "other", "beat"]);
    });
});

describe("sceneTitle", () => {
    it("uses the author's own name for the scene", () => {
        expect(sceneTitle("hook", 0)).toBe("Hook");
        expect(sceneTitle("sign-off", 2)).toBe("Sign-off");
    });

    it("numbers a scene that has no name, rather than calling it Untitled", () => {
        expect(sceneTitle("", 0)).toBe("Scene 1");
        expect(sceneTitle("   ", 4)).toBe("Scene 5");
    });
});

describe("lineEdit", () => {
    it("sends a voiceover as words to say and text as words to show", () => {
        expect(lineEdit(line({ elementId: "vo", kind: "voice" }), "New line")).toEqual({
            elementId: "vo",
            voice: "New line",
        });
        expect(lineEdit(line({ elementId: "t" }), "New line")).toEqual({
            elementId: "t",
            text: "New line",
        });
    });
});

describe("worthSendingLine", () => {
    it("ignores a line that did not change", () => {
        const l = line({ elementId: "t" });
        expect(worthSendingLine(l, l.text)).toBe(false);
        expect(worthSendingLine(l, `  ${l.text}  `)).toBe(false);
    });

    it("sends an emptied line of on-screen text, which is a real edit", () => {
        expect(worthSendingLine(line({ elementId: "t" }), "")).toBe(true);
    });

    it("refuses a voiceover emptied to nothing, which the backend would refuse anyway", () => {
        expect(worthSendingLine(line({ elementId: "vo", kind: "voice" }), "  ")).toBe(false);
    });
});

describe("lineBadge", () => {
    it("labels only what is spoken", () => {
        expect(lineBadge(line({ elementId: "vo", kind: "voice" }))).toBe("Voiceover");
        expect(lineBadge(line({ elementId: "t" }))).toBe("");
    });
});
