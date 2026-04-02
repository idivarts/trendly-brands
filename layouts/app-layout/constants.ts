export const WEB_PADDING = {
    small: 120,
    large: 60,
    "no-padding": 24,
} as const;

export type WebPaddingType = keyof typeof WEB_PADDING;
