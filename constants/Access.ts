// Frontend mirror of the backend RBAC vocabulary
// (backend-sls/internal/models/trendlymodels/permissions.go). Keep the string
// values in exact sync with BrandRole and Capability there.

export type BrandRoleValue =
    | "owner"
    | "admin"
    | "campaign_manager"
    | "content_manager"
    | "content_creator"
    | "viewer";

export interface RoleDef {
    value: BrandRoleValue;
    label: string;
    pillar: "Both" | "Influencer" | "Content";
    description: string;
}

export const BRAND_ROLES: RoleDef[] = [
    { value: "owner", label: "Owner", pillar: "Both", description: "Full control including billing. One per brand." },
    { value: "admin", label: "Admin", pillar: "Both", description: "Everything operational, plus people & socials. No billing." },
    { value: "campaign_manager", label: "Campaign Manager", pillar: "Influencer", description: "Runs collaborations, contracts, discovery & messaging." },
    { value: "content_manager", label: "Content Manager", pillar: "Content", description: "Owns strategy, calendar & content. Can publish." },
    { value: "content_creator", label: "Content Creator", pillar: "Content", description: "Drafts & edits content. No publishing or strategy edits." },
    { value: "viewer", label: "Viewer", pillar: "Both", description: "Read-only across the brand." },
];

// Owner is granted via ownership transfer, not the role picker — keep it out of
// the assignable list to avoid accidental lockouts.
export const ASSIGNABLE_ROLES = BRAND_ROLES.filter((r) => r.value !== "owner");

export interface ToggleDef {
    value: string; // Capability string
    label: string;
    description: string;
}

// The overridable capability toggles (OverridableCapabilities in the backend).
export const OVERRIDE_TOGGLES: ToggleDef[] = [
    { value: "fund_contracts", label: "Fund contracts", description: "Pay for and fund influencer contracts." },
    { value: "publish_content", label: "Publish content", description: "Schedule & publish to the content calendar." },
    { value: "manage_members", label: "Manage members", description: "Invite, edit roles, and remove members." },
    { value: "connect_socials", label: "Connect socials", description: "Connect or disconnect social accounts." },
    { value: "manage_billing", label: "Manage billing", description: "View and manage subscription & billing." },
];

export const roleLabel = (value?: string): string =>
    BRAND_ROLES.find((r) => r.value === value)?.label ?? "Member";

export const rolePillar = (value?: string): string =>
    BRAND_ROLES.find((r) => r.value === value)?.pillar ?? "";

// ── Capability resolution (mirror of permissions.go) ─────────────────────────

export const CAPABILITIES = {
    manageCollaborations: "manage_collaborations",
    manageContracts: "manage_contracts",
    discoveryMessaging: "discovery_messaging",
    fundContracts: "fund_contracts",
    manageContentStrategy: "manage_content_strategy",
    manageContent: "manage_content",
    publishContent: "publish_content",
    deleteContent: "delete_content",
    manageMembers: "manage_members",
    manageTeams: "manage_teams",
    connectSocials: "connect_socials",
    manageBilling: "manage_billing",
    deleteBrand: "delete_brand",
} as const;

// Default capability set per role. Owner is granted everything implicitly.
const ROLE_CAPABILITIES: Record<string, string[]> = {
    admin: [
        "manage_collaborations", "manage_contracts", "discovery_messaging", "fund_contracts",
        "manage_content_strategy", "manage_content", "publish_content", "delete_content",
        "manage_members", "manage_teams", "connect_socials",
    ],
    campaign_manager: ["manage_collaborations", "manage_contracts", "discovery_messaging"],
    content_manager: ["manage_content_strategy", "manage_content", "publish_content", "delete_content"],
    content_creator: ["manage_content"],
    viewer: [],
};

const VALID_ROLES = new Set<string>([
    "owner", "admin", "campaign_manager", "content_manager", "content_creator", "viewer",
]);

// A member still carrying a pre-RBAC legacy role (e.g. "user", "manager").
export const isLegacyRole = (role?: string): boolean => !role || !VALID_ROLES.has(role);

// Resolves whether a member effectively holds cap: Owner→all, explicit override
// wins next, else the role default. Mirrors BrandMember.HasCapability in Go.
export const resolveCapability = (
    role: string | undefined,
    overrides: Record<string, boolean> | undefined,
    cap: string,
): boolean => {
    if (role === "owner") return true;
    if (overrides && Object.prototype.hasOwnProperty.call(overrides, cap)) {
        return overrides[cap] === true;
    }
    return (ROLE_CAPABILITIES[role ?? ""] ?? []).includes(cap);
};
