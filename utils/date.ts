import { DateArg, formatDistanceToNow } from "date-fns";

// Examples:
// For seconds: 1 second ago
// For minutes: 1m ago
// For hours: 1h ago
// For days: 1d ago
// For months: 1mon ago
// For years: 1y ago
export const formatTimeToNow = (date: DateArg<Date>): string => {
    return formatDistanceToNow(date, {
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
