// Frontend mirror of the backend access vocabulary
// (backend-sls/internal/models/trendlymodels/permissions.go). Brand access is
// modelled as Features held by Teams: a team grants, per feature, a set of
// privileges. A member belongs to exactly one team and inherits its privileges —
// there are no member-level roles or overrides. Keep the string values in exact
// sync with Feature / Privilege in the backend.

// ── Features ─────────────────────────────────────────────────────────────────

export type FeatureKey =
    | "strategy"
    | "content_calendar"
    | "content"
    | "social_accounts"
    | "influencer_marketing"
    | "growth"
    | "brand_admin";

export interface PrivilegeDef {
    value: string; // privilege key (unique only within its feature)
    label: string;
    description: string;
}

export interface FeatureDef {
    key: FeatureKey;
    label: string;
    description: string;
    privileges: PrivilegeDef[];
}

// The canonical feature × privilege matrix. Single source of truth for the
// access-control UI and validation. Mirrors validFeaturePrivileges in the backend.
export const FEATURES: FeatureDef[] = [
    {
        key: "strategy",
        label: "Strategy",
        description: "Content strategy documents.",
        privileges: [
            { value: "admin", label: "Admin", description: "Create and edit strategies." },
            { value: "editor", label: "Editor", description: "Edit a strategy they're invited to." },
            { value: "approver", label: "Approver", description: "Comment & approve a strategy in Review." },
            { value: "viewer", label: "Viewer", description: "View and comment only." },
        ],
    },
    {
        key: "content_calendar",
        label: "Content Calendar",
        description: "The publishing calendar.",
        privileges: [
            { value: "editor", label: "Editor", description: "Change dates and edit on the calendar." },
            { value: "view", label: "View", description: "View and comment only." },
            { value: "publish", label: "Publish", description: "Publish / schedule a post." },
        ],
    },
    {
        key: "content",
        label: "Content",
        description: "Content drafts & posts.",
        privileges: [
            { value: "create_edit", label: "Create & Edit", description: "Create and edit content (needs Calendar editor to set a date)." },
            { value: "editor", label: "Editor", description: "Edit content only." },
            { value: "view", label: "View", description: "View and comment only." },
        ],
    },
    {
        key: "social_accounts",
        label: "Social Accounts",
        description: "Connected social accounts.",
        privileges: [
            { value: "admin", label: "Admin", description: "Add / remove social accounts." },
            { value: "inbox", label: "Inbox", description: "Access the connected-account inbox." },
            { value: "analytics", label: "Analytics", description: "View account analytics." },
            { value: "view", label: "View", description: "View connected accounts only." },
        ],
    },
    {
        key: "influencer_marketing",
        label: "Influencer Marketing",
        description: "Collaborations, contracts & discovery.",
        privileges: [
            { value: "admin", label: "Admin", description: "Full control, including funding contracts." },
            { value: "manage", label: "Manage", description: "Run collabs, contracts, discovery & messaging." },
            { value: "approver", label: "Approver", description: "Approve only." },
        ],
    },
    {
        key: "growth",
        label: "Growth",
        description: "Growth services pages.",
        privileges: [
            { value: "all_access", label: "All Access", description: "Unlock the growth pages." },
        ],
    },
    {
        key: "brand_admin",
        label: "Brand Admin",
        description: "Brand administration & settings.",
        privileges: [
            { value: "members", label: "Members", description: "Invite, edit and remove members." },
            { value: "teams", label: "Teams", description: "Create, edit and delete teams." },
            { value: "billing", label: "Billing", description: "View and manage billing." },
            { value: "delete_brand", label: "Delete Brand", description: "Delete the brand." },
        ],
    },
];

export const featureLabel = (key: string): string =>
    FEATURES.find((f) => f.key === key)?.label ?? key;

// ── Privilege resolution ─────────────────────────────────────────────────────

// A team's privilege map: feature key → granted privilege keys.
export type TeamPrivileges = Record<string, string[]>;

// Resolves whether a team's privilege map grants `priv` under `feature`.
export const resolvePrivilege = (
    privileges: TeamPrivileges | undefined,
    feature: FeatureKey,
    priv: string,
): boolean => {
    if (!privileges) return false;
    return (privileges[feature] ?? []).includes(priv);
};

// ── Legacy capability shim ───────────────────────────────────────────────────
// Existing call sites gate on the old capability strings. Map each to the
// feature/privilege pair(s) that should satisfy it; a capability is held when
// ANY mapped pair is granted. Prefer hasPrivilege(feature, priv) in new code.

export type FeaturePriv = { feature: FeatureKey; priv: string };

export const CAPABILITY_MAP: Record<string, FeaturePriv[]> = {
    manage_collaborations: [{ feature: "influencer_marketing", priv: "manage" }, { feature: "influencer_marketing", priv: "admin" }],
    manage_contracts: [{ feature: "influencer_marketing", priv: "manage" }, { feature: "influencer_marketing", priv: "admin" }],
    discovery_messaging: [{ feature: "influencer_marketing", priv: "manage" }, { feature: "influencer_marketing", priv: "admin" }],
    fund_contracts: [{ feature: "influencer_marketing", priv: "admin" }],
    manage_content_strategy: [{ feature: "strategy", priv: "admin" }, { feature: "strategy", priv: "editor" }],
    manage_content: [{ feature: "content", priv: "create_edit" }, { feature: "content", priv: "editor" }],
    publish_content: [{ feature: "content_calendar", priv: "publish" }],
    delete_content: [{ feature: "content", priv: "create_edit" }],
    manage_members: [{ feature: "brand_admin", priv: "members" }],
    manage_teams: [{ feature: "brand_admin", priv: "teams" }],
    connect_socials: [{ feature: "social_accounts", priv: "admin" }],
    manage_billing: [{ feature: "brand_admin", priv: "billing" }],
    delete_brand: [{ feature: "brand_admin", priv: "delete_brand" }],
};

// Resolves an old capability string against a team's privilege map.
export const resolveCapability = (
    privileges: TeamPrivileges | undefined,
    cap: string,
): boolean => {
    const pairs = CAPABILITY_MAP[cap];
    if (!pairs) return false;
    return pairs.some((p) => resolvePrivilege(privileges, p.feature, p.priv));
};

// ── Navigation gating ────────────────────────────────────────────────────────
// Maps a route (href) to the feature/privilege required to see its nav entry.
// `priv` omitted → any privilege under the feature is enough (feature-level).
// Used by BOTH the desktop sidebar and the mobile menu page. Unmapped routes
// (e.g. /profile, /settings, /notifications) are always visible.
export const NAV_ACCESS: Record<string, { feature: FeatureKey; priv?: string }> = {
    // Content pillar
    "/content-strategies": { feature: "strategy" },
    "/content-calendar": { feature: "content_calendar" },
    "/contents": { feature: "content" },
    // Social accounts (Inbox & Analytics are distinct privileges, NOT growth)
    "/connected-accounts": { feature: "social_accounts" },
    "/inbox": { feature: "social_accounts", priv: "inbox" },
    "/analytics": { feature: "social_accounts", priv: "analytics" },
    // Growth
    "/organic-growth": { feature: "growth", priv: "all_access" },
    "/paid-growth": { feature: "growth", priv: "all_access" },
    "/performance-marketing": { feature: "growth", priv: "all_access" },
    "/hire-us": { feature: "growth", priv: "all_access" },
    // Influencer marketing
    "/discover": { feature: "influencer_marketing" },
    "/explore-influencers": { feature: "influencer_marketing" },
    "/collaborations": { feature: "influencer_marketing" },
    "/messages": { feature: "influencer_marketing" },
    "/contracts": { feature: "influencer_marketing" },
    "/affiliate-purchase": { feature: "influencer_marketing" },
    "/partnership-ads": { feature: "influencer_marketing" },
    // Brand admin
    "/billing": { feature: "brand_admin", priv: "billing" },
    "/members": { feature: "brand_admin", priv: "members" },
    "/brand-profile": { feature: "brand_admin" },
    // NOTE: Admin-Portal ops (admin-invites, brand-crm, collaboration-cms,
    // applications, admin-escalations) are intentionally NOT listed here. They
    // are Trendly platform-admin tooling, gated solely by `manager.isAdmin` at
    // the section/hub level — not by any brand feature/privilege.
};

// Resolves whether a nav entry for `href` should be visible, given the current
// member's feature/privilege predicates. Unmapped routes are always visible.
export const canAccessNav = (
    href: string | undefined,
    hasFeature: (f: FeatureKey) => boolean,
    hasPrivilege: (f: FeatureKey, p: string) => boolean,
): boolean => {
    if (!href) return true;
    const rule = NAV_ACCESS[href];
    if (!rule) return true;
    return rule.priv ? hasPrivilege(rule.feature, rule.priv) : hasFeature(rule.feature);
};
