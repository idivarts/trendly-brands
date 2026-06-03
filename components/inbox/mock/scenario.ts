/**
 * MOCK ONLY — delete this file when removing the mock layer.
 *
 * The three demo states the dev state-switcher cycles through.
 */
export type InboxScenario = "no-socials" | "no-messages" | "populated";

export const INBOX_SCENARIOS: {
    key: InboxScenario;
    label: string;
    description: string;
}[] = [
    {
        key: "no-socials",
        label: "No socials",
        description: "Empty state — nothing connected yet",
    },
    {
        key: "no-messages",
        label: "Connected",
        description: "Socials connected, but no messages/comments",
    },
    {
        key: "populated",
        label: "Populated",
        description: "Messages + comments you can reply to",
    },
];

/** The scenario the app boots into. */
export const DEFAULT_INBOX_SCENARIO: InboxScenario = "populated";
