import { DateArg, formatDistanceToNow } from "date-fns";

type TimestampLike = {
    seconds?: number;
    nanoseconds?: number;
    toDate?: () => Date;
};

const normalizeDateArg = (date: DateArg<Date> | TimestampLike) => {
    if (date instanceof Date) {
        return date;
    }

    if (typeof date === "number") {
        if (!Number.isFinite(date)) {
            return new Date(NaN);
        }
        const ms = date < 1_000_000_000_000 ? date * 1000 : date;
        return new Date(ms);
    }

    // @ts-ignore
    if (date && typeof date.toDate === "function") {
        // @ts-ignore
        return date.toDate();
    }

    // @ts-ignore
    if (date && typeof date.seconds === "number") {
        // @ts-ignore
        const ms = date.seconds * 1000 + Math.floor((date.nanoseconds ?? 0) / 1_000_000);
        return new Date(ms);
    }

    // A date string stays supported — `new Date(str)` parses the ISO strings
    // callers pass and yields an invalid Date for anything else, which the
    // guard below then catches.
    if (typeof date === "string") {
        return new Date(date);
    }

    // Anything else — undefined, null, an object that is not a Timestamp —
    // becomes an invalid Date so the NaN guard in every caller actually fires.
    // Returning the value untouched meant `date instanceof Date` was false, the
    // guard was skipped, and date-fns threw "RangeError: Invalid time value"
    // from inside a render — which does not degrade a label, it takes down the
    // screen that holds it.
    return new Date(NaN);
};

// Examples:
// For seconds: 1 second ago
// For minutes: 1m ago
// For hours: 1h ago
// For days: 1d ago
// For months: 1mon ago
// For years: 1y ago
export const formatTimeToNow = (date: DateArg<Date> | TimestampLike): string => {
    const normalizedDate = normalizeDateArg(date);
    if (normalizedDate instanceof Date && Number.isNaN(normalizedDate.getTime())) {
        return "-";
    }

    return formatDistanceToNow(normalizedDate, {
        addSuffix: true,
        locale: {
            formatDistance: (token, count, options) => {
                if (token === "lessThanXSeconds") {
                    return `${count} second ago`;
                }
                if (token === "xSeconds") {
                    return `${count} seconds ago`;
                }
                if (token === "halfAMinute") {
                    return `${count} seconds ago`;
                }
                if (token === "lessThanXMinutes") {
                    return `${count}m ago`;
                }
                if (token === "xMinutes") {
                    return `${count}m ago`;
                }
                if (token === "aboutXHours") {
                    return `${count}h ago`;
                }
                if (token === "xHours") {
                    return `${count}h ago`;
                }
                if (token === "xDays") {
                    return `${count}d ago`;
                }
                if (token === "aboutXMonths") {
                    return `${count}mon ago`;
                }
                if (token === "xMonths") {
                    return `${count}mon ago`;
                }
                if (token === "aboutXYears") {
                    return `${count}y ago`;
                }
                if (token === "xYears") {
                    return `${count}y ago`;
                }
                return "";
            },
        },
    });
};
