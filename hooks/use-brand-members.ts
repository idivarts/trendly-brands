/**
 * useBrandMembers
 *
 * Returns the selected brand's team members in a lightweight shape suitable for
 * @-mention autocomplete in comments. Mirrors the existing members-fetch pattern
 * (brands/{brandId}/members + managers/{id} profile) used by MembersTab, so it
 * relies only on access patterns the Firestore rules already permit — no new
 * collection or composite-index query is introduced.
 */
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export interface MentionMember {
    id: string;
    name: string;
    avatar?: string;
}

export function useBrandMembers(): MentionMember[] {
    const { selectedBrand } = useBrandContext();
    const [members, setMembers] = useState<MentionMember[]>([]);

    useEffect(() => {
        const brandId = selectedBrand?.id;
        if (!brandId) {
            setMembers([]);
            return;
        }
        const ref = collection(FirestoreDB, "brands", brandId, "members");
        const unsubscribe = onSnapshot(
            ref,
            async (snap) => {
                try {
                    const rows = await Promise.all(
                        snap.docs.map(async (m) => {
                            const profileSnap = await getDoc(doc(FirestoreDB, "managers", m.id));
                            const profile = (profileSnap.data() as any) || {};
                            return {
                                id: m.id,
                                name: (profile.name || profile.email || "").trim(),
                                avatar: profile.profileImage,
                            } as MentionMember;
                        })
                    );
                    setMembers(rows.filter((r) => r.name.length > 0));
                } catch (e) {
                    Console.error(e);
                }
            },
            (err) => Console.error(err)
        );
        return () => unsubscribe();
    }, [selectedBrand?.id]);

    return members;
}
