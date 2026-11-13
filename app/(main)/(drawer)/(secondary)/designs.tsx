import PageHeader from "@/components/ui/page-header";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { fs, lh } from "@/constants/Typography";
import { designFormatLabel, designStatus, type DesignStatusFields } from "@/components/designs/design-status";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { faFilm, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Design Studio — the index.
 *
 * This screen is the point of Design Studio v3: a design is a FIRST-CLASS
 * OBJECT, so there is a place to see all of them that does not start from a
 * post. v1 and v2 had no such screen, because a design lived underneath the
 * content that owned it and could only be reached through it.
 *
 * A design may or may not be linked to a content. Both appear here; the link
 * is shown when it exists, and its absence is normal rather than a defect.
 */

/** A design as the list endpoint returns it. */
interface DesignRow extends DesignStatusFields {
    id: string;
    name: string;
    contentId?: string;
    updatedAt?: number;
}

const DesignStudioIndex = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    const [designs, setDesigns] = useState<DesignRow[] | null>(null);
    const [creating, setCreating] = useState(false);

    const load = useCallback(async () => {
        if (!brandId) return;
        try {
            const res = await HttpWrapper.fetch(`/api/design/brands/${brandId}/designs`, { method: "GET" });
            const data = await res.json();
            setDesigns(Array.isArray(data?.designs) ? data.designs : []);
        } catch {
            // An empty list and a failed read look identical on screen
            // otherwise, and "you have no designs" is the more damaging of
            // the two to say wrongly.
            setDesigns([]);
            Toaster.error("Couldn't load your designs", "Check your connection and try again.");
        }
    }, [brandId]);

    useEffect(() => {
        load();
    }, [load]);

    const createDesign = useCallback(async () => {
        if (!brandId || creating) return;
        setCreating(true);
        try {
            const res = await HttpWrapper.fetch(`/api/design/brands/${brandId}/designs`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                // A vertical canvas by default: it is what most social video
                // is, and the user can change it rather than having to choose
                // before they have made anything.
                body: JSON.stringify({ name: "Untitled design", width: 1080, height: 1920, fps: 30 }),
            });
            const data = await res.json();
            const id = data?.design?.id;
            if (id) router.push(`/designs/${id}`);
        } catch {
            Toaster.error("Couldn't create a design", "Please try again.");
        } finally {
            setCreating(false);
        }
    }, [brandId, creating]);

    const actionButtons = useMemo(
        () => [
            <Pressable
                key="new"
                onPress={createDesign}
                disabled={creating}
                style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
                accessibilityRole="button"
                accessibilityLabel="New design"
            >
                <FontAwesomeIcon icon={faPlus} size={16} color={colors.text} />
            </Pressable>,
        ],
        [createDesign, creating, styles, colors]
    );

    const renderRow = useCallback(
        ({ item }: { item: DesignRow }) => {
            const status = designStatus(item);
            return (
                <Pressable
                    onPress={() => router.push(`/designs/${item.id}`)}
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${item.name}`}
                >
                    <View style={styles.cardIcon}>
                        <FontAwesomeIcon icon={faFilm} size={16} color={colors.primary} />
                    </View>
                    <View style={styles.cardBody}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                            {item.name || "Untitled design"}
                        </Text>
                        <Text style={styles.cardMeta} numberOfLines={1}>
                            {designFormatLabel(item)}
                            {item.contentId ? " · linked to a post" : ""}
                        </Text>
                    </View>
                    <View style={styles.statusWrap}>
                        {status.busy && <ActivityIndicator size="small" color={colors.primary} />}
                        <Text
                            style={[styles.status, status.bad && styles.statusBad]}
                            numberOfLines={1}
                        >
                            {status.text}
                        </Text>
                    </View>
                </Pressable>
            );
        },
        [styles, colors]
    );

    return (
        <AppLayout>
            <PageHeader
                title="Design Studio"
                subtitle="Every design you've made, linked to a post or standing on its own"
                showBackButton={!xl}
                mobileActions="all"
                actionButtons={actionButtons}
            />
            {designs === null ? (
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : designs.length === 0 ? (
                <View style={styles.centered}>
                    <FontAwesomeIcon icon={faFilm} size={28} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>No designs yet</Text>
                    <Text style={styles.emptyBody}>
                        Make one here, or press Design with AI on any post to start from its script.
                    </Text>
                    <Pressable
                        onPress={createDesign}
                        disabled={creating}
                        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                        accessibilityRole="button"
                    >
                        <Text style={styles.ctaLabel}>{creating ? "Creating…" : "New design"}</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={designs}
                    keyExtractor={(d) => d.id}
                    renderItem={renderRow}
                    contentContainerStyle={styles.list}
                    onRefresh={load}
                    refreshing={false}
                />
            )}
        </AppLayout>
    );
};

export default DesignStudioIndex;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                list: { padding: 16, gap: 10 },
                centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
                emptyTitle: {
                    fontSize: fs(16),
                    lineHeight: lh(22),
                    fontWeight: "700",
                    color: colors.text,
                    marginTop: 6,
                },
                emptyBody: {
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    color: colors.textSecondary,
                    textAlign: "center",
                    maxWidth: 340,
                },
                cta: {
                    marginTop: 8,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                ctaPressed: { opacity: 0.85 },
                ctaLabel: { fontSize: fs(14), lineHeight: lh(20), fontWeight: "700", color: colors.onPrimary },
                card: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                cardPressed: { opacity: 0.85 },
                cardIcon: {
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                cardBody: { flex: 1, gap: 2 },
                cardTitle: { fontSize: fs(14), lineHeight: lh(20), fontWeight: "600", color: colors.text },
                cardMeta: { fontSize: fs(11), lineHeight: lh(16), color: colors.textSecondary },
                statusWrap: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: 150 },
                status: { fontSize: fs(11), lineHeight: lh(16), color: colors.textSecondary },
                statusBad: { color: colors.red },
                iconButton: {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                iconButtonPressed: { opacity: 0.7 },
            }),
        [colors]
    );
}
