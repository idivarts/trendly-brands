export const convertToKUnits = (num: number) => {
  if (Number.isNaN(num)) {
    return 0;
  }

  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num;
};
