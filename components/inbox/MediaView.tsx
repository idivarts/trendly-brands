import {
    faChevronLeft,
    faComment,
    faImages,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import { Text } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";

import MediaCommentsThread from "./MediaCommentsThread";
import ResyncButton from "./ResyncButton";
import ResyncInline from "./ResyncInline";
import { useInboxMedia } from "./data/use-inbox-media";
import { InboxMedia } from "./types";
import { channelColor, channelIcon, channelLabel } from "./utils";

const COMMENTS_WIDTH = 420;
const MIN_REFRESH_MS = 900;

const MediaView: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);

    const { loading, media, resyncMedia, refresh } = useInboxMedia();

    const [selected, setSelected] = useState<InboxMedia | undefined>(undefined);
    const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
    const [commentsReload, setCommentsReload] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // Look for new/updated media (pull-to-refresh on touch, button on desktop).
    const handleRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        await Promise.all([
            Promise.resolve(refresh()),
            new Promise((r) => setTimeout(r, MIN_REFRESH_MS)),
        ]);
        setRefreshing(false);
    };

    // Resync a post: refresh its stored counts/image AND re-pull its comment list.
    const resyncPost = (m: InboxMedia) => {
        setCommentsReload((n) => n + 1);
        return resyncMedia(m);
    };

    // Keep a post selected by default on desktop.
    useEffect(() => {
        if (xl && !selected && media.length > 0) setSelected(media[0]);
    }, [xl, selected, media]);

    const openMedia = (m: InboxMedia) => setSelected(m);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (media.length === 0) {
        return (
            <View style={styles.center}>
                <FontAwesomeIcon icon={faImages} size={40} color={colors.tag} />
                <Text style={styles.emptyText}>No published posts yet</Text>
                <Text style={styles.emptySub}>
                    Posts and reels from your connected accounts will appear here.
                </Text>
            </View>
        );
    }

    const grid = (
        <View style={styles.gridWrap}>
            {/* Web (any width) gets a button; native uses pull-to-refresh below. */}
            {Platform.OS === "web" ? (
                <View style={styles.gridToolbar}>
                    <ResyncButton onPress={handleRefresh} busy={refreshing} label="Refresh media" />
                </View>
            ) : null}
            <ScrollView
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                <View style={styles.grid}>
                {media.map((m) => {
                    const active = selected?.id === m.id;
                    return (
                        <Pressable
                            key={`${m.channel}_${m.id}`}
                            style={styles.tile}
                            onPress={() => openMedia(m)}
                            onHoverIn={() => setHoveredId(m.id)}
                            onHoverOut={() => setHoveredId((h) => (h === m.id ? undefined : h))}
                        >
                            <Image
                                source={{ uri: m.thumbnailUrl }}
                                style={styles.tileImage}
                                contentFit="cover"
                                transition={150}
                            />
                            <View
                                style={[
                                    styles.tileBadge,
                                    { backgroundColor: channelColor(m.channel, colors) },
                                ]}
                            >
                                <FontAwesomeIcon
                                    icon={channelIcon(m.channel)}
                                    size={11}
                                    color={colors.white}
                                />
                            </View>
                            <View style={styles.tileCount}>
                                <FontAwesomeIcon icon={faComment} size={11} color={colors.white} />
                                <Text style={styles.tileCountText}>{m.commentsCount}</Text>
                            </View>
                            {hoveredId === m.id ? (
                                <View style={styles.tileResync}>
                                    <ResyncInline
                                        watch={m.updatedAt}
                                        action={() => resyncMedia(m)}
                                        label="Resync media"
                                        color={colors.white}
                                        size={14}
                                    />
                                </View>
                            ) : null}
                            {active && xl ? <View style={styles.tileActive} /> : null}
                        </Pressable>
                    );
                })}
                </View>
            </ScrollView>
        </View>
    );

    const commentsPanel = selected ? (
        <View style={styles.commentsPane}>
            <View style={styles.postHeader}>
                {!xl ? (
                    <Pressable onPress={() => setSelected(undefined)} style={styles.backBtn} hitSlop={8}>
                        <FontAwesomeIcon icon={faChevronLeft} size={18} color={colors.text} />
                    </Pressable>
                ) : null}
                <Image
                    source={{ uri: selected.thumbnailUrl }}
                    style={styles.postThumb}
                    contentFit="cover"
                />
                <View style={styles.postMeta}>
                    <Text style={styles.postCaption} numberOfLines={2}>
                        {selected.caption || "(no caption)"}
                    </Text>
                    <Text style={styles.postSub}>
                        {channelLabel(selected.channel)} · {selected.commentsCount} comments
                    </Text>
                </View>
                <ResyncInline
                    watch={selected.updatedAt}
                    action={() => resyncPost(selected)}
                    label="Resync post & comments"
                />
            </View>

            <MediaCommentsThread media={selected} reloadKey={commentsReload} />
        </View>
    ) : null;

    // ---- Mobile (drill-down) ----
    if (!xl) {
        return <View style={styles.container}>{selected ? commentsPanel : grid}</View>;
    }

    // ---- Desktop (grid + comments) ----
    return (
        <View style={styles.row}>
            <View style={styles.gridPane}>{grid}</View>
            <View style={[styles.commentsPaneWrap, { width: COMMENTS_WIDTH }]}>
                {commentsPanel ?? (
                    <View style={styles.center}>
                        <Text style={styles.emptySub}>Select a post to see its comments.</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: { flex: 1, backgroundColor: colors.background },
                row: { flex: 1, flexDirection: "row", backgroundColor: colors.background },
                gridPane: { flex: 1, backgroundColor: colors.background },
                gridWrap: { flex: 1 },
                gridToolbar: {
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    paddingHorizontal: 12,
                    paddingTop: 8,
                },
                commentsPaneWrap: {
                    backgroundColor: colors.background,
                    // Shadow leftward to separate from the grid (no border).
                    shadowColor: "#000",
                    shadowOffset: { width: -6, height: 0 },
                    shadowRadius: 16,
                    shadowOpacity: 0.06,
                    elevation: 8,
                    zIndex: 2,
                },
                center: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: 24,
                },
                emptyText: { fontSize: 16, fontWeight: "600", color: colors.text },
                emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },

                // Grid
                gridContent: { padding: 12 },
                grid: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    rowGap: 10,
                },
                tile: {
                    width: "32%",
                    aspectRatio: 1,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: colors.tag,
                },
                tileImage: { width: "100%", height: "100%" },
                tileBadge: {
                    position: "absolute",
                    top: 6,
                    left: 6,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                },
                tileCount: {
                    position: "absolute",
                    bottom: 6,
                    right: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 11,
                    backgroundColor: "rgba(0,0,0,0.55)",
                },
                tileCountText: { color: colors.white, fontSize: 11, fontWeight: "600" },
                tileResync: {
                    position: "absolute",
                    top: 4,
                    right: 4,
                    borderRadius: 16,
                    backgroundColor: "rgba(0,0,0,0.55)",
                },
                tileActive: {
                    ...StyleSheet.absoluteFillObject,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    opacity: 0.18,
                },

                // Comments panel
                commentsPane: { flex: 1, backgroundColor: colors.background },
                postHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    backgroundColor: colors.background,
                    // Downward shadow over the comment list (sticky-header feel).
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                    zIndex: 2,
                },
                backBtn: { padding: 4 },
                postThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.tag },
                postMeta: { flex: 1, gap: 2 },
                postCaption: { fontSize: 14, fontWeight: "600", color: colors.text },
                postSub: { fontSize: 12, color: colors.textSecondary },
            }),
        [colors]
    );
}

export default MediaView;
