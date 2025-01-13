import { DateArg, formatDistanceToNow } from "date-fns";

// Examples:
// For seconds: "sec ago"
// For minutes: "mins ago"
// For hours: "hrs ago"
// For days: "d ago"
// For weeks: "w ago"
// For months: "m ago"
// For years: "yrs ago"
export const formatTimeToNow = (date: DateArg<Date>): string => {
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: {
      formatDistance: (token, count, options) => {
        if (token === "lessThanXSeconds") {
          return `${count} sec ago`;
        }
        if (token === "xSeconds") {
          return `${count} sec ago`;
        }
        if (token === "halfAMinute") {
          return `${count} min ago`;
        }
        if (token === "lessThanXMinutes") {
          return `${count} mins ago`;
        }
        if (token === "xMinutes") {
          return `${count} mins ago`;
        }
        if (token === "aboutXHours") {
          return `${count} hrs ago`;
        }
        if (token === "xHours") {
          return `${count} hrs ago`;
        }
        if (token === "xDays") {
          return `${count} d ago`;
        }
        if (token === "aboutXMonths") {
          return `${count} m ago`;
        }
        if (token === "xMonths") {
          return `${count} m ago`;
        }
        if (token === "aboutXYears") {
          return `${count} yrs ago`;
        }
        if (token === "xYears") {
          return `${count} yrs ago`;
        }
        return "";
      },
    },
  });
};
