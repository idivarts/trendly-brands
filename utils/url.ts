export const imageUrl = (image: string | NodeRequire | undefined) => {
  if (
    image &&
    typeof image === "string" &&
    (image.startsWith("http") || image.startsWith("ph://"))
  ) {
    return {
      uri: image,
    };
  } else if (image) {
    return image;
  } else {
    return require("@/assets/images/placeholder-image.jpg");
  }
};

export const queryParams = (
  params: Partial<Record<string, string | string[]>>
) => {
  let values: string[] = [];

  Object.entries(params).map(([key, value]) => {
    values.push(`${key}=${value}`);
  });

  return values.length === 0 ? "" : `?${values.join("&")}`;
};
