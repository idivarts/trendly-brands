import { Href } from "expo-router";

export const APP_NAME = "Trendly Brands";

export const WEBSITE_URL = "https://www.trendly.now";
export const PRIVACY_URL = `${WEBSITE_URL}/privacy-policy`;
export const TERMS_URL = `${WEBSITE_URL}/terms-and-condition`;
export const CONTACT_URL = `${WEBSITE_URL}/contact`;

export const DEFAULT_MEMBER_LANDING_PAGE: Href = "/content-strategies";

// Where a manager lands after completing brand onboarding (AI chat or the form
// fallback). Pulled out as a constant so the post-onboarding destination can be
// changed in one place.
export const ONBOARDING_COMPLETE_LANDING_PAGE: Href = "/content-strategies";