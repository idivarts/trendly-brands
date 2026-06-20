/**
 * Country dial-code dataset + helpers for the phone-number input.
 *
 * We deliberately avoid a native phone library (libphonenumber et al.) — the
 * data we need is small and static: ISO-3166 alpha-2 code, display name and the
 * E.164 calling code. Flag glyphs are derived from the ISO code at runtime via
 * regional-indicator symbols, so there is nothing to keep in sync.
 *
 * The default country is detected silently from the device locale/timezone via
 * `detectCountryCode()` (see ./country.ts), so most users never touch the
 * country picker — they just type their local number.
 */

import { detectCountryCode } from "./country";

export interface Country {
    /** ISO-3166 alpha-2 code, e.g. "IN", "US". */
    iso2: string;
    /** Display name, e.g. "India". */
    name: string;
    /** E.164 calling code without the leading "+", e.g. "91", "1". */
    dialCode: string;
}

/**
 * Curated list of countries with their calling codes. Ordered roughly by
 * relevance to the product (India + US first), then alphabetically. The picker
 * is searchable, so ordering only affects the initial scroll position.
 */
export const COUNTRIES: Country[] = [
    { iso2: "IN", name: "India", dialCode: "91" },
    { iso2: "US", name: "United States", dialCode: "1" },
    { iso2: "GB", name: "United Kingdom", dialCode: "44" },
    { iso2: "CA", name: "Canada", dialCode: "1" },
    { iso2: "AU", name: "Australia", dialCode: "61" },
    { iso2: "AE", name: "United Arab Emirates", dialCode: "971" },
    { iso2: "SG", name: "Singapore", dialCode: "65" },
    { iso2: "AF", name: "Afghanistan", dialCode: "93" },
    { iso2: "AL", name: "Albania", dialCode: "355" },
    { iso2: "DZ", name: "Algeria", dialCode: "213" },
    { iso2: "AR", name: "Argentina", dialCode: "54" },
    { iso2: "AM", name: "Armenia", dialCode: "374" },
    { iso2: "AT", name: "Austria", dialCode: "43" },
    { iso2: "AZ", name: "Azerbaijan", dialCode: "994" },
    { iso2: "BH", name: "Bahrain", dialCode: "973" },
    { iso2: "BD", name: "Bangladesh", dialCode: "880" },
    { iso2: "BY", name: "Belarus", dialCode: "375" },
    { iso2: "BE", name: "Belgium", dialCode: "32" },
    { iso2: "BO", name: "Bolivia", dialCode: "591" },
    { iso2: "BA", name: "Bosnia and Herzegovina", dialCode: "387" },
    { iso2: "BR", name: "Brazil", dialCode: "55" },
    { iso2: "BG", name: "Bulgaria", dialCode: "359" },
    { iso2: "KH", name: "Cambodia", dialCode: "855" },
    { iso2: "CM", name: "Cameroon", dialCode: "237" },
    { iso2: "CL", name: "Chile", dialCode: "56" },
    { iso2: "CN", name: "China", dialCode: "86" },
    { iso2: "CO", name: "Colombia", dialCode: "57" },
    { iso2: "CR", name: "Costa Rica", dialCode: "506" },
    { iso2: "HR", name: "Croatia", dialCode: "385" },
    { iso2: "CY", name: "Cyprus", dialCode: "357" },
    { iso2: "CZ", name: "Czech Republic", dialCode: "420" },
    { iso2: "DK", name: "Denmark", dialCode: "45" },
    { iso2: "DO", name: "Dominican Republic", dialCode: "1" },
    { iso2: "EC", name: "Ecuador", dialCode: "593" },
    { iso2: "EG", name: "Egypt", dialCode: "20" },
    { iso2: "SV", name: "El Salvador", dialCode: "503" },
    { iso2: "EE", name: "Estonia", dialCode: "372" },
    { iso2: "ET", name: "Ethiopia", dialCode: "251" },
    { iso2: "FI", name: "Finland", dialCode: "358" },
    { iso2: "FR", name: "France", dialCode: "33" },
    { iso2: "GE", name: "Georgia", dialCode: "995" },
    { iso2: "DE", name: "Germany", dialCode: "49" },
    { iso2: "GH", name: "Ghana", dialCode: "233" },
    { iso2: "GR", name: "Greece", dialCode: "30" },
    { iso2: "GT", name: "Guatemala", dialCode: "502" },
    { iso2: "HK", name: "Hong Kong", dialCode: "852" },
    { iso2: "HU", name: "Hungary", dialCode: "36" },
    { iso2: "IS", name: "Iceland", dialCode: "354" },
    { iso2: "ID", name: "Indonesia", dialCode: "62" },
    { iso2: "IQ", name: "Iraq", dialCode: "964" },
    { iso2: "IE", name: "Ireland", dialCode: "353" },
    { iso2: "IL", name: "Israel", dialCode: "972" },
    { iso2: "IT", name: "Italy", dialCode: "39" },
    { iso2: "JM", name: "Jamaica", dialCode: "1" },
    { iso2: "JP", name: "Japan", dialCode: "81" },
    { iso2: "JO", name: "Jordan", dialCode: "962" },
    { iso2: "KZ", name: "Kazakhstan", dialCode: "7" },
    { iso2: "KE", name: "Kenya", dialCode: "254" },
    { iso2: "KW", name: "Kuwait", dialCode: "965" },
    { iso2: "LV", name: "Latvia", dialCode: "371" },
    { iso2: "LB", name: "Lebanon", dialCode: "961" },
    { iso2: "LT", name: "Lithuania", dialCode: "370" },
    { iso2: "LU", name: "Luxembourg", dialCode: "352" },
    { iso2: "MY", name: "Malaysia", dialCode: "60" },
    { iso2: "MV", name: "Maldives", dialCode: "960" },
    { iso2: "MT", name: "Malta", dialCode: "356" },
    { iso2: "MX", name: "Mexico", dialCode: "52" },
    { iso2: "MA", name: "Morocco", dialCode: "212" },
    { iso2: "NP", name: "Nepal", dialCode: "977" },
    { iso2: "NL", name: "Netherlands", dialCode: "31" },
    { iso2: "NZ", name: "New Zealand", dialCode: "64" },
    { iso2: "NG", name: "Nigeria", dialCode: "234" },
    { iso2: "NO", name: "Norway", dialCode: "47" },
    { iso2: "OM", name: "Oman", dialCode: "968" },
    { iso2: "PK", name: "Pakistan", dialCode: "92" },
    { iso2: "PA", name: "Panama", dialCode: "507" },
    { iso2: "PY", name: "Paraguay", dialCode: "595" },
    { iso2: "PE", name: "Peru", dialCode: "51" },
    { iso2: "PH", name: "Philippines", dialCode: "63" },
    { iso2: "PL", name: "Poland", dialCode: "48" },
    { iso2: "PT", name: "Portugal", dialCode: "351" },
    { iso2: "QA", name: "Qatar", dialCode: "974" },
    { iso2: "RO", name: "Romania", dialCode: "40" },
    { iso2: "RU", name: "Russia", dialCode: "7" },
    { iso2: "SA", name: "Saudi Arabia", dialCode: "966" },
    { iso2: "RS", name: "Serbia", dialCode: "381" },
    { iso2: "ZA", name: "South Africa", dialCode: "27" },
    { iso2: "KR", name: "South Korea", dialCode: "82" },
    { iso2: "ES", name: "Spain", dialCode: "34" },
    { iso2: "LK", name: "Sri Lanka", dialCode: "94" },
    { iso2: "SE", name: "Sweden", dialCode: "46" },
    { iso2: "CH", name: "Switzerland", dialCode: "41" },
    { iso2: "TW", name: "Taiwan", dialCode: "886" },
    { iso2: "TZ", name: "Tanzania", dialCode: "255" },
    { iso2: "TH", name: "Thailand", dialCode: "66" },
    { iso2: "TN", name: "Tunisia", dialCode: "216" },
    { iso2: "TR", name: "Turkey", dialCode: "90" },
    { iso2: "UG", name: "Uganda", dialCode: "256" },
    { iso2: "UA", name: "Ukraine", dialCode: "380" },
    { iso2: "UY", name: "Uruguay", dialCode: "598" },
    { iso2: "UZ", name: "Uzbekistan", dialCode: "998" },
    { iso2: "VE", name: "Venezuela", dialCode: "58" },
    { iso2: "VN", name: "Vietnam", dialCode: "84" },
    { iso2: "ZM", name: "Zambia", dialCode: "260" },
    { iso2: "ZW", name: "Zimbabwe", dialCode: "263" },
];

const FALLBACK_COUNTRY: Country =
    COUNTRIES.find((c) => c.iso2 === "IN") ?? COUNTRIES[0];

/** Look up a country by ISO-3166 alpha-2 code (case-insensitive). */
export function getCountryByIso(iso?: string | null): Country | undefined {
    if (!iso) return undefined;
    const upper = iso.trim().toUpperCase();
    return COUNTRIES.find((c) => c.iso2 === upper);
}

/**
 * The country to pre-select on first render — detected from the device locale /
 * timezone, falling back to India so detection failure degrades gracefully.
 * Note: several ISO codes share a dial code (e.g. CA/US => "1"); detection may
 * resolve to a neighbour, but the dial code is still correct.
 */
export function getDefaultCountry(): Country {
    return getCountryByIso(detectCountryCode()) ?? FALLBACK_COUNTRY;
}

/**
 * Convert an ISO-3166 alpha-2 code into its flag emoji using Unicode regional
 * indicator symbols. Falls back to a generic globe if the code is malformed.
 */
export function isoToFlag(iso2: string): string {
    if (!iso2 || iso2.length !== 2) return "🌐";
    const base = 0x1f1e6; // regional indicator "A"
    const upper = iso2.toUpperCase();
    const a = upper.charCodeAt(0) - 65;
    const b = upper.charCodeAt(1) - 65;
    if (a < 0 || a > 25 || b < 0 || b > 25) return "🌐";
    return String.fromCodePoint(base + a) + String.fromCodePoint(base + b);
}
