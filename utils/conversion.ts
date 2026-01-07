// E.g. 1000 -> 1k
// E.g. 100 -> 100
// E.g. 10000 -> 10k
// E.g. 100000 -> 100k
// E.g. 4500 -> 4.5k
// E.g. 45000 -> 45k
// E.g. 999 -> 999
export const convertToKUnits = (num: number) => {
    if (Number.isNaN(num)) {
        return 0;
    }

    if (num < 1000) {
        return num;
    }

    if (num >= 1000) {
        return num % 1000 === 0 ? `${num / 1000}k` : `${(num / 1000).toFixed(1)}k`;
    }

    return num;
};
