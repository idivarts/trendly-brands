/**
 * Firebase Auth failures that are the USER's input, not our bug.
 *
 * A wrong password, a typo'd email address or an already-registered address are
 * the sign-in form working correctly. They were being handed to
 * `Console.error`, which reports to Sentry — so Sentry carried issues titled
 *
 *     FirebaseError: Firebase: Error (auth/invalid-credential).
 *     FirebaseError: Firebase: Error (auth/invalid-email).
 *
 * that no amount of code could ever fix, while the user was told only
 * "Error signing in. Please try again." — which does not tell them to check
 * their password. Both halves of that are wrong, and one map fixes both: these
 * get a specific message and stay out of Sentry.
 *
 * `auth/network-request-failed` is in here for the same reason as the Branch
 * `-113` filter in utils/observability/branch.native.ts: it describes the
 * device's connection, not the app.
 *
 * Codes NOT listed here still report. An unrecognised auth failure is exactly
 * the thing worth being told about.
 */
const EXPECTED_AUTH_ERRORS: Record<string, string> = {
    // Sign-in. Firebase collapses wrong-password and unknown-user into
    // invalid-credential when email enumeration protection is on (the default
    // for new projects), so the wording must not claim which one it was.
    "auth/invalid-credential": "That email and password don't match. Please try again.",
    "auth/wrong-password": "That email and password don't match. Please try again.",
    "auth/user-not-found": "That email and password don't match. Please try again.",
    "auth/invalid-email": "That doesn't look like a valid email address.",
    "auth/user-disabled": "This account has been disabled. Contact support if that's unexpected.",
    "auth/too-many-requests": "Too many attempts. Please wait a minute and try again.",
    // Sign-up.
    "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
    "auth/weak-password": "Please choose a password of at least 6 characters.",
    // The device, not the account.
    "auth/network-request-failed": "Can't reach Trendly. Check your connection and try again.",
};

/** Firebase errors carry `code`; nothing else we throw does. */
const authErrorCode = (error: unknown): string | undefined => {
    const code = (error as { code?: unknown } | null)?.code;
    return typeof code === "string" ? code : undefined;
};

/**
 * The message to show the user for an expected auth failure, or null when the
 * failure is not one of them — in which case the caller should report it and
 * fall back to its own generic wording.
 */
export const expectedAuthErrorMessage = (error: unknown): string | null => {
    const code = authErrorCode(error);
    return (code && EXPECTED_AUTH_ERRORS[code]) || null;
};
