/**
 * PresenceAvatars
 *
 * Displays small overlapping avatar chips for every manager currently viewing
 * the same strategy. Reads from `brands/{brandId}/strategies/{strategyId}/presence`
 * via an onSnapshot listener and filters out stale heartbeats (> PRESENCE_TTL_MS old).
 *
 * Usage:
 *   <PresenceAvatars strategyId={strategy.id} />
 */
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { PRESENCE_TTL_MS } from "@/hooks/use-strategies";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface PresenceEntry {
    managerId: string;
    name: string;
    lastSeen: number;
}

interface PresenceAvatarsProps {
    strategyId: string;
}

const MAX_SHOWN = 4; // Show at most this many avatars before collapsing into "+N"

// A stable palette of accent colours for avatar backgrounds — assigned by index
const AVATAR_COLORS = ["#5A67D8", "#D97706", "#059669", "#DC2626", "#7C3AED"];

const PresenceAvatars: React.FC<PresenceAvatarsProps> = ({ strategyId }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    const [presenceList, setPresenceList] = useState<PresenceEntry[]>([]);

    useEffect(() => {
        const brandId = selectedBrand?.id;
        if (!brandId || !strategyId) return;

        const presenceRef = collection(
            FirestoreDB,
            "brands",
            brandId,
            "strategies",
            strategyId,
            "presence"
        );

        const unsubscribe = onSnapshot(presenceRef, (snap) => {
            const now = Date.now();
            const active = snap.docs
                .map((d) => d.data() as PresenceEntry)
                // Filter out stale entries and the current user themselves
                .filter(
                    (p) =>
                        now - p.lastSeen < PRESENCE_TTL_MS &&
                        p.managerId !== manager?.id
                );
            setPresenceList(active);
        });

        return () => unsubscribe();
    }, [selectedBrand?.id, strategyId, manager?.id]);

    if (presenceList.length === 0) return null;

    const shown = presenceList.slice(0, MAX_SHOWN);
    const overflow = presenceList.length - MAX_SHOWN;

    return (
        <View style={styles.row}>
            {shown.map((p, idx) => (
                <View
                    key={p.managerId}
                    style={[
                        styles.avatar,
                        { backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] },
                        idx > 0 && styles.avatarOverlap,
                    ]}
                >
                    <Text style={styles.avatarText}>
                        {p.name.charAt(0).toUpperCase()}
                    </Text>
                </View>
            ))}
            {overflow > 0 && (
                <View style={[styles.avatar, styles.overflowAvatar, shown.length > 0 && styles.avatarOverlap]}>
                    <Text style={styles.overflowText}>+{overflow}</Text>
                </View>
            )}
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        row: {
            flexDirection: "row",
            alignItems: "center",
        },
        avatar: {
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: colors.card,
        },
        avatarOverlap: {
            marginLeft: -8,
        },
        avatarText: {
            fontSize: 11,
            fontWeight: "700",
            color: "#fff",
        },
        overflowAvatar: {
            backgroundColor: colors.tag,
        },
        overflowText: {
            fontSize: 10,
            fontWeight: "700",
            color: colors.textSecondary,
        },
    });
}

export default PresenceAvatars;
