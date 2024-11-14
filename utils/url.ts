export const queryParams = (
  params: Partial<Record<string, string | string[]>>
) => {
  let values: string[] = [];

  Object.entries(params).map(([key, value]) => {
    values.push(`${key}=${value}`);
  });

  return values.length === 0 ? "" : `?${values.join("&")}`;
};
