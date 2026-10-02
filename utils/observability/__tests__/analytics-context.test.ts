import {
    clearSinks,
    registerSink,
    reset,
    setSuperProperties,
    track,
    type AnalyticsSink,
} from "@/shared-libs/utils/analytics";
import { toPostHogContext } from "../posthog-context";

/**
 * The screen only reaches PostHog's "URL / Screen" column — and its replay and
 * $exception events — if the session context actually lands on the sink. These
 * lock in the two halves of that: the facade fanning context out, and the
 * PostHog mapping renaming `screen` to the key PostHog reads.
 */

type Call = [string, Record<string, any>];

const makeSink = () => {
    const contexts: Record<string, any>[] = [];
    const events: Call[] = [];
    const sink: AnalyticsSink = {
        name: "spy",
        track: (event, props) => events.push([event, props]),
        setContext: (props) => contexts.push({ ...props }),
        reset: () => undefined,
    };
    return { sink, contexts, events };
};

beforeEach(() => {
    clearSinks();
    reset();
});

describe("super-property fan-out", () => {
    it("pushes context to a sink whenever it changes", () => {
        const { sink, contexts } = makeSink();
        registerSink(sink);

        setSuperProperties({ screen: "/content-calendar" });

        expect(contexts).toHaveLength(1);
        expect(contexts[0].screen).toBe("/content-calendar");
    });

    it("merges rather than replaces, so each caller can set only its own slice", () => {
        const { sink, contexts } = makeSink();
        registerSink(sink);

        setSuperProperties({ platform: "ios" });
        setSuperProperties({ screen: "/contents" });

        expect(contexts[contexts.length - 1]).toMatchObject({
            platform: "ios",
            screen: "/contents",
        });
    });

    it("replays what is already known to a sink registered afterwards", () => {
        // Order is genuinely unpredictable: attribution resolves off a promise
        // and the org context mounts deeper in the tree than the sinks.
        setSuperProperties({ screen: "/billing", plan_key: "pro" });

        const { sink, contexts } = makeSink();
        registerSink(sink);

        expect(contexts).toHaveLength(1);
        expect(contexts[0]).toMatchObject({ screen: "/billing", plan_key: "pro" });
    });

    it("still spreads the context onto the events it does see", () => {
        const { sink, events } = makeSink();
        registerSink(sink);
        setSuperProperties({ screen: "/contents" });

        track("content_created", { source: "ai" });

        expect(events[0][0]).toBe("content_created");
        expect(events[0][1]).toMatchObject({ screen: "/contents", source: "ai" });
    });

    it("does not break a sink that has no setContext", () => {
        const events: Call[] = [];
        registerSink({ name: "plain", track: (e, p) => events.push([e, p]) });

        expect(() => setSuperProperties({ screen: "/menu" })).not.toThrow();
        track("logout", {});
        expect(events).toHaveLength(1);
    });
});

describe("toPostHogContext", () => {
    it("renames screen to the key PostHog's screen column reads", () => {
        expect(toPostHogContext({ screen: "/content-calendar" })).toEqual({
            $screen_name: "/content-calendar",
        });
    });

    it("does not emit screen under both names", () => {
        expect(toPostHogContext({ screen: "/x" })).not.toHaveProperty("screen");
    });

    it("passes our own dimensions through untouched", () => {
        expect(
            toPostHogContext({ org_id: "o1", plan_key: "team", is_paid: true })
        ).toEqual({ org_id: "o1", plan_key: "team", is_paid: true });
    });

    it("omits the key entirely when no screen is known yet", () => {
        expect(toPostHogContext({ platform: "web" })).toEqual({ platform: "web" });
    });
});
