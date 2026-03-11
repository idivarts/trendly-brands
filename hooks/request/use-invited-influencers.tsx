import type { InfluencerInviteUnit } from "@/components/discover/discover-types";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { IInvitations } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

interface UseInvitedInfluencersProps {
    collaborationId: string;
    limit?: number;
}

const useInvitedInfluencers = ({
    collaborationId,
}: UseInvitedInfluencersProps) => {
    const { selectedBrand } = useBrandContext();
    const [influencers, setInfluencers] = useState<InfluencerInviteUnit[]>([]);
    const [loading, setLoading] = useState(false);
    const [nextAvailable, setNextAvailable] = useState(false);
    const [filter, setFilter] = useState<string | undefined>(undefined);

    const fetchFromFirestore = useCallback(
        async (reset: boolean) => {
            if (!collaborationId) return;
            setLoading(true);
            try {
                const invitationsRef = collection(
                    FirestoreDB,
                    "collaborations",
                    collaborationId,
                    "invitations"
                );
                const invitationsQuery = filter
                    ? query(invitationsRef, where("status", "==", filter))
                    : query(invitationsRef);
                const invitationsSnap = await getDocs(invitationsQuery);
                const invitations = invitationsSnap.docs.map((d) => ({
                    ...d.data(),
                    id: d.id,
                })) as (IInvitations & { id: string })[];

                const units: InfluencerInviteUnit[] = await Promise.all(
                    invitations.map(async (inv) => {
                        const userId = inv.userId || inv.id;
                        const invData = inv as IInvitations & { timeStamp?: number };
                        const status = inv.status || "pending";
                        const invitedAt = invData.timeStamp ?? 0;

                        // Prefer discovery API for full profile (profile_pic, followers, etc.)
                        if (selectedBrand?.id) {
                            try {
                                const res = await HttpWrapper.fetch(
                                    `/discovery/brands/${selectedBrand.id}/influencers/${userId}`,
                                    { method: "GET" }
                                );
                                const body = await res.json();
                                const inf = body?.influencer;
                                const social = body?.social;
                                const user = inf?.user;
                                if (inf || social || body?.id) {
                                    return {
                                        id: userId,
                                        name: user?.name ?? social?.name ?? body?.name ?? "Unknown",
                                        username: social?.username ?? body?.username ?? "unknown",
                                        profile_pic: user?.profileImage ?? social?.profile_pic ?? body?.profile_pic ?? "",
                                        follower_count: social?.follower_count ?? body?.follower_count ?? 0,
                                        engagement_count: social?.engagement_count ?? body?.engagement_count ?? 0,
                                        views_count: social?.views_count ?? body?.views_count ?? 0,
                                        engagement_rate: social?.engagement_rate ?? body?.engagement_rate ?? 0,
                                        status,
                                        invitedAt,
                                    } as InfluencerInviteUnit;
                                }
                            } catch (_) {
                                // Fall through to Firestore
                            }
                        }

                        // Fallback: Firestore user + socials
                        const userRef = doc(FirestoreDB, "users", userId);
                        const userSnap = await getDoc(userRef);
                        const userData = userSnap.data() as IUsers | undefined;

                        let profile_pic = userData?.profileImage ?? (userData as any)?.profile_image ?? "";
                        let name = userData?.name ?? "";
                        let username = "";
                        let follower_count = 0;
                        let engagement_count = 0;
                        let engagement_rate = 0;
                        let views_count = 0;

                        const socialsRef = collection(FirestoreDB, "users", userId, "socials");
                        const socialsSnap = await getDocs(query(socialsRef, limit(5)));
                        for (const socialDoc of socialsSnap.docs) {
                            const socialData = socialDoc.data() as {
                                instaProfile?: {
                                    profilePictureUrl?: string;
                                    name?: string;
                                    username?: string;
                                    followersCount?: number;
                                    approxMetrics?: { views?: string; interactions?: string; followers?: string };
                                };
                                fbProfile?: {
                                    picture?: { data?: { url?: string } };
                                    name?: string;
                                    followersCount?: number;
                                };
                            };
                            const insta = socialData.instaProfile;
                            const fb = socialData.fbProfile;
                            if (insta && (insta.profilePictureUrl || insta.username)) {
                                profile_pic = profile_pic || insta.profilePictureUrl || "";
                                name = name || insta.name || "";
                                username = username || insta.username || "";
                                follower_count = follower_count || (insta.followersCount ?? 0);
                                if (insta.approxMetrics?.views) views_count = parseInt(insta.approxMetrics.views.replace(/\D/g, ""), 10) || views_count;
                                if (insta.approxMetrics?.interactions) engagement_count = parseInt(insta.approxMetrics.interactions.replace(/\D/g, ""), 10) || engagement_count;
                                break;
                            }
                            if (fb && (fb.picture?.data?.url || fb.name)) {
                                profile_pic = profile_pic || fb.picture?.data?.url || "";
                                name = name || fb.name || "";
                                username = username || fb.name || "";
                                follower_count = follower_count || (fb.followersCount ?? 0);
                                break;
                            }
                        }

                        return {
                            id: userId,
                            name: name || "Unknown",
                            username: username || name || "—",
                            profile_pic,
                            follower_count,
                            engagement_count,
                            engagement_rate,
                            views_count,
                            status,
                            invitedAt,
                        } as InfluencerInviteUnit;
                    })
                );

                setInfluencers(reset ? units : units);
                setNextAvailable(false);
            } catch (e) {
                console.warn("Failed to fetch invited influencers from Firestore", e);
                setInfluencers((prev) => (reset ? [] : prev));
                setNextAvailable(false);
            } finally {
                setLoading(false);
            }
        },
        [collaborationId, filter, selectedBrand?.id]
    );

    useEffect(() => {
        fetchFromFirestore(true);
    }, [fetchFromFirestore]);

    const loadMore = useCallback(() => {
        // Firestore fetch is single-page; no pagination for now
    }, []);

    const refresh = useCallback(() => {
        fetchFromFirestore(true);
    }, [fetchFromFirestore]);

    const setStatusFilter = useCallback((f?: string) => {
        setFilter(f || undefined);
    }, []);

    return {
        influencers,
        loading,
        refresh,
        loadMore,
        nextAvailable,
        setStatusFilter,
    };
};

export default useInvitedInfluencers;
