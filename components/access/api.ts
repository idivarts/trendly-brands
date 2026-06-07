// Typed API helpers for the privilege-control (Access) feature. All calls go
// through HttpWrapper, which attaches the Firebase bearer token automatically.

import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { TeamPrivileges } from "@/constants/Access";

export interface Team {
    id: string;
    name: string;
    isDefault: boolean;
    createdBy?: string;
    creationTime?: number;
    privileges?: TeamPrivileges;
}

export interface BrandMemberRecord {
    managerId: string;
    status: number;
    teamId?: string;
}

export interface MemberAccessPayload {
    teamId?: string;
}

const json = async (res: Response) => {
    try {
        return await res.json();
    } catch {
        return {};
    }
};

// ── Teams ────────────────────────────────────────────────────────────────────

export const listTeams = async (brandId: string): Promise<Team[]> => {
    const res = await HttpWrapper.fetch(`/api/v2/brands/${brandId}/teams`, { method: "GET" });
    const data = await json(res);
    return (data.teams ?? []) as Team[];
};

export const createTeam = async (
    brandId: string,
    name: string,
    privileges?: TeamPrivileges,
): Promise<Team> => {
    const res = await HttpWrapper.fetch(`/api/v2/brands/${brandId}/teams`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, privileges: privileges ?? {} }),
    });
    const data = await json(res);
    return data.team as Team;
};

export const updateTeam = async (
    brandId: string,
    teamId: string,
    payload: { name: string; privileges?: TeamPrivileges },
): Promise<void> => {
    await HttpWrapper.fetch(`/api/v2/brands/${brandId}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });
};

export const deleteTeam = async (brandId: string, teamId: string): Promise<void> => {
    await HttpWrapper.fetch(`/api/v2/brands/${brandId}/teams/${teamId}`, { method: "DELETE" });
};

// ── Members ──────────────────────────────────────────────────────────────────

export const inviteMember = async (
    brandId: string,
    payload: { email: string; name: string } & MemberAccessPayload,
): Promise<void> => {
    await HttpWrapper.fetch(`/api/v2/brands/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandId, ...payload }),
    });
};

export const updateMemberAccess = async (
    brandId: string,
    managerId: string,
    payload: MemberAccessPayload,
): Promise<void> => {
    await HttpWrapper.fetch(`/api/v2/brands/${brandId}/members/${managerId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });
};

export const removeMember = async (brandId: string, managerId: string): Promise<void> => {
    await HttpWrapper.fetch(`/api/v2/brands/${brandId}/members/${managerId}`, { method: "DELETE" });
};
