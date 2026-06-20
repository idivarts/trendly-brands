import { faFacebookF, faInstagram } from "@fortawesome/free-brands-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import Colors from "@/shared-uis/constants/Colors";
import { InboxChannel, InboxConversation, InboxFilter } from "./types";

type ColorSet = ReturnType<typeof Colors>;

export const channelLabel = (channel: InboxChannel): string =>
    channel === "instagram" ? "Instagram" : "Facebook";

export const channelIcon = (channel: InboxChannel): IconDefinition =>
    channel === "instagram" ? faInstagram : faFacebookF;

export const channelColor = (channel: InboxChannel, colors: ColorSet): string =>
    channel === "instagram" ? colors.socialInstagram : colors.socialFacebook;

/** True when a DM's 24h reply window is still open (comments are always open). */
export const canReply = (c: InboxConversation, now: number = Date.now()): boolean => {
    if (c.kind === "comment") return true;
    if (!c.replyWindowExpiresAt) return true;
    return now < c.replyWindowExpiresAt;
};

/** Compact "time left in window" string, e.g. "5h left". null if no/closed window. */
export const replyWindowLeft = (
    c: InboxConversation,
    now: number = Date.now()
): string | null => {
    if (c.kind === "comment" || !c.replyWindowExpiresAt) return null;
    const ms = c.replyWindowExpiresAt - now;
    if (ms <= 0) return null;
    const hours = Math.floor(ms / (60 * 60 * 1000));
    if (hours >= 1) return `${hours}h left`;
    const mins = Math.max(1, Math.floor(ms / (60 * 1000)));
    return `${mins}m left`;
};

/** Relative timestamp like "now", "18m", "5h", "2d". */
export const relativeTime = (ts: number, now: number = Date.now()): string => {
    const diff = Math.max(0, now - ts);
    const mins = Math.floor(diff / (60 * 1000));
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w`;
};

export const formatFollowers = (n?: number): string | null => {
    if (n == null) return null;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${n}`;
};

export const matchesFilter = (
    c: InboxConversation,
    filter: InboxFilter
): boolean => {
    switch (filter) {
        case "unread":
            return c.unread;
        case "dm":
            return c.kind === "dm";
        case "comment":
            return c.kind === "comment";
        case "all":
        default:
            return true;
    }
};

export const sortByRecency = (a: InboxConversation, b: InboxConversation) =>
    b.lastActivityAt - a.lastActivityAt;
