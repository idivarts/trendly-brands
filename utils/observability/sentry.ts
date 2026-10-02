import { hasValue, OBSERVABILITY } from "@/shared-constants/marketing";
import { APP_STAGE } from "@/shared-libs/utils/environment";
import { setErrorReporter } from "@/shared-libs/utils/error-reporter";
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

/**
 * Sentry wiring for the brand app, replacing the Crashlytics stubs that never
 * actually reported anything (`crashlytics.native.ts` was `const crashlytics =
 * null` with every method guarded behind `if (crashlytics)`).
 *
 * @sentry/react-native bundles @sentry/browser, so this one module covers web
 * and native — no platform split needed.
 *
 * The real leverage here is registering into shared-libs' error-reporter seam:
 * `Console.error` already has ~90 call sites across the app, so that single
 * registration instruments all of them without touching any of them.
 */

let started = false;

export const initSentry = (): void => {
    if (started) return;
    // No DSN configured ⇒ stay exactly as the app behaves today.
    if (!hasValue(OBSERVABILITY.SENTRY_DSN)) return;

    try {
        Sentry.init({
            dsn: OBSERVABILITY.SENTRY_DSN,
            // Sentry's `environment` is a first-class field, not a tag: it
            // drives the environment selector, alert scoping and release
            // health. So ONE project per app, segmented by this — not a
            // separate project (or DSN) per stage.
            //
            // Reported from dev too, rather than switched off, otherwise a bug
            // is only ever visible once it has already shipped to users.
            environment: APP_STAGE,
            // Ties an issue to the build it came from, and is what source-map
            // uploads are keyed on.
            release: Constants.expoConfig?.version,
            // Errors only. Tracing multiplies event volume for little benefit
            // at this stage, and matches the backend's pkg/mysentry choice.
            tracesSampleRate: 0,
            // Never let Sentry attach IPs / request bodies implicitly — the
            // user context below is set explicitly instead.
            sendDefaultPii: false,
        });
        started = true;
    } catch (error) {
        // Observability must never be the reason the app fails to boot.
        console.warn("[sentry] init failed, continuing without it", error);
        return;
    }

    setErrorReporter({
        captureException: (error, tag) => {
            Sentry.withScope((scope) => {
                if (tag) scope.setTag("area", tag);
                // Console.error is called with strings and plain objects as
                // well as Errors; normalise so Sentry can group them.
                scope.setLevel("error");
                Sentry.captureException(
                    error instanceof Error ? error : new Error(safeStringify(error))
                );
            });
        },
        addBreadcrumb: (message, data) => {
            Sentry.addBreadcrumb({
                category: "log",
                level: "info",
                message,
                data: data?.length ? { params: data.map(safeStringify).join(" ") } : undefined,
            });
        },
    });
};

/** Bind errors to a user. Called when auth resolves. */
export const setSentryUser = (id: string, email?: string | null): void => {
    if (!started) return;
    Sentry.setUser({ id, email: email || undefined });
};

/** Called on sign-out so the next user's errors aren't attributed to the last. */
export const clearSentryUser = (): void => {
    if (!started) return;
    Sentry.setUser(null);
};

const safeStringify = (value: unknown): string => {
    if (typeof value === "string") return value;
    try {
        return JSON.stringify(value) ?? String(value);
    } catch {
        return String(value);
    }
};
