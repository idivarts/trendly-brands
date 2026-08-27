import { ClientPlatform, ITokenUsage } from "@/types/BrandUsage";

/** Short label for a client platform, for compact card chips. */
export const platformLabel = (platform?: ClientPlatform): string => {
    switch (platform) {
        case "ios":
            return "iOS";
        case "android":
            return "Android";
        case "web-desktop":
            return "Web";
        case "web-mobile":
            return "Web mobile";
        default:
            return "—";
    }
};

/** MaterialCommunityIcons name for a client platform. */
export const platformIcon = (platform?: ClientPlatform): string => {
    switch (platform) {
        case "ios":
            return "apple";
        case "android":
            return "android";
        case "web-desktop":
            return "monitor";
        case "web-mobile":
            return "cellphone";
        default:
            return "help-circle-outline";
    }
};

/**
 * Percentage of the monthly allotment consumed, 0–100. Returns null when there
 * is no allotment to measure against (no wallet, or a plan with none), so
 * callers can render "—" instead of a misleading 0%.
 */
export const tokenPercentUsed = (tokens?: ITokenUsage): number | null => {
    if (!tokens || tokens.monthlyAllotment <= 0) return null;
    const pct = (tokens.consumed / tokens.monthlyAllotment) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
};

/** Compact count formatting: 1500 -> "1.5K", 2_400_000 -> "2.4M". */
export const compactNumber = (value: number): string => {
    if (!Number.isFinite(value)) return "0";
    const abs = Math.abs(value);
    if (abs >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
    }
    if (abs >= 1_000) {
        return `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
    }
    return `${value}`;
};

/** "3 days ago" / "just now" for last-seen timestamps. Empty when never seen. */
export const relativeTime = (timestamp?: number): string => {
    if (!timestamp) return "";
    const diff = Date.now() - timestamp;
    if (diff < 0) return "just now";

    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;

    return `${Math.floor(months / 12)}y ago`;
};

/** Human label for a content lifecycle status key. */
export const contentStatusLabel = (status: string): string =>
    status
        .split(/[_\s-]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
