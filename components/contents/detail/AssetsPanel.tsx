/**
 * AssetsPanel — the brand's media, in one picker.
 *
 * Every surface that offers the user something to pick used to have its own
 * idea of what existed: the media stage offered the device's photo roll, the
 * reference tray offered the same roll again, and nothing offered the stock
 * photo the AI placed in last week's post or the video that was uploaded for
 * another reel. So the same file was uploaded twice and a photographer's credit
 * was stranded on one content.
 *
 * This reads the library endpoint, which unions the stored rows with every
 * content attachment the brand has — so it is complete the first time it opens,
 * with nothing to migrate.
 *
 * ── What a tile has to say ──────────────────────────────────────────────────
 * A thumbnail alone is not enough to pick with, and each extra fact here earns
 * its place by preventing a specific mistake:
 *  - a length, so a 45s take is not dropped into a 10s slot;
 *  - a credit, because a stock photo's licence requires it to travel with the
 *    picture and the user has to see that it does;
 *  - what has been READ out of a video, because the difference between "I can
 *    cut this by its transcript" and "I can trim it by hand" is ingest having
 *    finished, and that takes a minute after upload.
 */
import { fs, lh } from "@/constants/Typography";
import { useBreakpoints } from "@/hooks";
import { AssetKind, IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import {
    faCheck,
    faCirclePlay,
    faClosedCaptioning,
    faImage,
    faRotateRight,
    faTrashCan,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { AssetTab, useAssetLibrary } from "@/hooks/use-asset-library";

const TABS: { key: AssetTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upload", label: "Uploads" },
    { key: "stock", label: "Stock" },
    { key: "generated", label: "Generated" },
    { key: "brand", label: "Brand" },
];

const EMPTY_COPY: Record<AssetTab, string> = {
    all: "Nothing here yet. Anything you upload or the AI makes shows up in this library.",
    upload: "No uploads yet. A file you pick on a post is filed here, so you can use it on another.",
    stock: "No stock photography yet. Ask the AI for a stock photo and the credit is kept with it.",
    generated: "Nothing generated yet. Images and clips the AI makes are kept here.",
    brand: "No brand assets yet — logos and product shots you want to reach for every time.",
};

const fmtSecs = (ms?: number) => (ms && ms > 0 ? `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}s` : null);

const thumbOf = (a: IAsset): string | null =>
    a.kind === "video" ? a.posterUrl || a.thumbUrl || null : a.thumbUrl || a.url || null;

interface Props {
    visible: boolean;
    onClose: () => void;
    /** Picked. The panel closes itself on a single pick. */
    onPick: (asset: IAsset) => void;
    /** Pick several at once — for a carousel, where one at a time is tedious. */
    onPickMany?: (assets: IAsset[]) => void;
    /** Only offer what the caller can use. Everything, when omitted. */
    kinds?: AssetKind[];
    title?: string;
}

const AssetsPanel: React.FC<Props> = ({
    visible,
    onClose,
    onPick,
    onPickMany,
    kinds,
    title = "Your media",
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);

    const { assets, loading, error, tab, setTab, reload, remove } = useAssetLibrary({
        kinds,
        enabled: visible,
    });

    const multi = !!onPickMany;
    const [chosen, setChosen] = useState<string[]>([]);
    // A fresh open is a fresh choice. Without this, re-opening the panel offers
    // an "Add 3" button for assets the user picked and then undid.
    useEffect(() => {
        if (!visible) setChosen([]);
    }, [visible]);

    const toggle = useCallback(
        (asset: IAsset) => {
            if (!multi) {
                onPick(asset);
                onClose();
                return;
            }
            setChosen((cur) =>
                cur.includes(asset.id) ? cur.filter((id) => id !== asset.id) : [...cur, asset.id]
            );
        },
        [multi, onPick, onClose]
    );

    const confirmMany = useCallback(() => {
        if (!onPickMany) return;
        // In the order they were chosen, not the order of the grid: on a
        // carousel that order becomes the slide order.
        const byId = new Map(assets.map((a) => [a.id, a]));
        const picked = chosen.map((id) => byId.get(id)).filter((a): a is IAsset => !!a);
        if (!picked.length) return;
        onPickMany(picked);
        onClose();
    }, [onPickMany, chosen, assets, onClose]);

    const tiles = useMemo(() => assets, [assets]);
    const tileStyle = xl ? styles.tileWide : styles.tile;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={() => {}}>
                    <View style={styles.head}>
                        <Text style={styles.title}>{title}</Text>
                        <Pressable
                            onPress={reload}
                            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Refresh the library"
                            hitSlop={8}
                        >
                            <FontAwesomeIcon icon={faRotateRight} size={13} color={colors.textSecondary} />
                        </Pressable>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            hitSlop={8}
                        >
                            <FontAwesomeIcon icon={faXmark} size={14} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabs}
                    >
                        {TABS.map((t) => {
                            const active = t.key === tab;
                            return (
                                <Pressable
                                    key={t.key}
                                    onPress={() => setTab(t.key)}
                                    style={({ pressed }) => [
                                        styles.tab,
                                        active && styles.tabActive,
                                        pressed && styles.pressed,
                                    ]}
                                    accessibilityRole="tab"
                                    accessibilityState={{ selected: active }}
                                    accessibilityLabel={t.label}
                                >
                                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                                        {t.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    <ScrollView style={styles.body} contentContainerStyle={styles.grid}>
                        {loading && !tiles.length ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        ) : null}

                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        {!loading && !tiles.length && !error ? (
                            <Text style={styles.empty}>{EMPTY_COPY[tab]}</Text>
                        ) : null}

                        {tiles.map((asset) => {
                            const picked = chosen.includes(asset.id);
                            const thumb = thumbOf(asset);
                            const secs = fmtSecs(asset.durationMs || asset.ingest?.durationMs);
                            const ingest = asset.ingest;
                            return (
                                <View key={asset.id} style={tileStyle}>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.thumbWrap,
                                            picked && styles.thumbPicked,
                                            pressed && styles.pressed,
                                        ]}
                                        onPress={() => toggle(asset)}
                                        accessibilityRole="button"
                                        accessibilityLabel={
                                            asset.alt || asset.title || `${asset.kind} from ${asset.source}`
                                        }
                                    >
                                        {thumb ? (
                                            <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
                                        ) : (
                                            <View style={styles.thumbFallback}>
                                                <FontAwesomeIcon
                                                    icon={asset.kind === "video" ? faCirclePlay : faImage}
                                                    size={16}
                                                    color={colors.textSecondary}
                                                />
                                            </View>
                                        )}

                                        {asset.kind === "video" ? (
                                            <View style={styles.playBadge}>
                                                <FontAwesomeIcon
                                                    icon={faCirclePlay}
                                                    size={12}
                                                    color={colors.white}
                                                />
                                            </View>
                                        ) : null}

                                        {secs ? (
                                            <View style={styles.durBadge}>
                                                <Text style={styles.durText}>{secs}</Text>
                                            </View>
                                        ) : null}

                                        {picked ? (
                                            <View style={styles.checkBadge}>
                                                <FontAwesomeIcon icon={faCheck} size={10} color={colors.onPrimary} />
                                            </View>
                                        ) : null}

                                        {/* A derived row is an attachment seen through the
                                            library — there is no document to delete. */}
                                        {!asset.derived ? (
                                            <Pressable
                                                style={({ pressed }) => [
                                                    styles.delBadge,
                                                    pressed && styles.pressed,
                                                ]}
                                                onPress={() => remove(asset)}
                                                accessibilityRole="button"
                                                accessibilityLabel="Remove from the library"
                                                hitSlop={6}
                                            >
                                                <FontAwesomeIcon icon={faTrashCan} size={9} color={colors.white} />
                                            </Pressable>
                                        ) : null}
                                    </Pressable>

                                    {/* Credit is not decoration: the licence requires it to
                                        travel with the picture, so it shows where the
                                        picture is chosen. */}
                                    {asset.attribution ? (
                                        <Text style={styles.credit} numberOfLines={1}>
                                            {asset.attribution}
                                        </Text>
                                    ) : asset.title || asset.alt ? (
                                        <Text style={styles.caption} numberOfLines={1}>
                                            {asset.title || asset.alt}
                                        </Text>
                                    ) : null}

                                    {ingest ? (
                                        <View style={styles.ingestRow}>
                                            <FontAwesomeIcon
                                                icon={faClosedCaptioning}
                                                size={9}
                                                color={
                                                    ingest.status === "done"
                                                        ? colors.primary
                                                        : colors.textSecondary
                                                }
                                            />
                                            <Text style={styles.ingestText} numberOfLines={1}>
                                                {ingest.status === "pending"
                                                    ? "Reading this video…"
                                                    : ingest.status === "failed"
                                                        ? "Couldn't read it — trim it by hand"
                                                        : ingest.words?.length
                                                            ? `${ingest.shots?.length ?? 0} shots · transcript`
                                                            : `${ingest.shots?.length ?? 0} shots`}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            );
                        })}
                    </ScrollView>

                    {multi ? (
                        <View style={styles.footer}>
                            <Text style={styles.footerHint}>
                                {chosen.length
                                    ? `${chosen.length} chosen — they're added in the order you picked them.`
                                    : "Pick as many as you need."}
                            </Text>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.primaryBtn,
                                    !chosen.length && styles.btnDisabled,
                                    pressed && styles.pressed,
                                ]}
                                onPress={confirmMany}
                                disabled={!chosen.length}
                                accessibilityRole="button"
                                accessibilityLabel={`Add ${chosen.length} to this post`}
                            >
                                <Text style={styles.primaryBtnText}>
                                    {chosen.length ? `Add ${chosen.length}` : "Add"}
                                </Text>
                            </Pressable>
                        </View>
                    ) : null}
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    React.useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: colors.backdrop,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                },
                sheet: {
                    width: "100%",
                    maxWidth: 620,
                    maxHeight: "86%",
                    gap: 10,
                    borderRadius: 16,
                    backgroundColor: colors.card,
                    padding: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowRadius: 28,
                    shadowOpacity: 0.22,
                    elevation: 12,
                },
                head: { flexDirection: "row", alignItems: "center", gap: 4 },
                title: {
                    flex: 1,
                    fontSize: fs(16),
                    lineHeight: lh(21),
                    fontWeight: "800",
                    color: colors.text,
                },
                close: { padding: 4 },
                tabs: { flexDirection: "row", gap: 4, paddingRight: 8 },
                tab: {
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 9,
                    backgroundColor: colors.tag,
                },
                tabActive: { backgroundColor: colors.primary },
                tabText: {
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                tabTextActive: { color: colors.onPrimary },
                body: { flexGrow: 0 },
                grid: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 10,
                    paddingVertical: 4,
                },
                center: { width: "100%", alignItems: "center", paddingVertical: 24 },
                tile: { width: 94, gap: 3 },
                tileWide: { width: 118, gap: 3 },
                thumbWrap: {
                    width: "100%",
                    aspectRatio: 1,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: colors.tag,
                },
                thumbPicked: {
                    // No border: the check badge and the tint carry the state.
                    backgroundColor: withAlpha(colors.primary, 0.16),
                },
                thumb: { ...StyleSheet.absoluteFillObject },
                thumbFallback: {
                    ...StyleSheet.absoluteFillObject,
                    alignItems: "center",
                    justifyContent: "center",
                },
                playBadge: {
                    position: "absolute",
                    left: 5,
                    bottom: 5,
                },
                durBadge: {
                    position: "absolute",
                    right: 5,
                    bottom: 5,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    borderRadius: 6,
                    backgroundColor: colors.backdropStrong,
                },
                durText: {
                    fontSize: fs(9),
                    lineHeight: lh(12),
                    fontWeight: "700",
                    color: colors.white,
                },
                checkBadge: {
                    position: "absolute",
                    left: 5,
                    top: 5,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                },
                delBadge: {
                    position: "absolute",
                    right: 5,
                    top: 5,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.backdropStrong,
                },
                credit: {
                    fontSize: fs(9),
                    lineHeight: lh(12),
                    color: colors.textSecondary,
                },
                caption: {
                    fontSize: fs(10),
                    lineHeight: lh(13),
                    color: colors.text,
                },
                ingestRow: { flexDirection: "row", alignItems: "center", gap: 4 },
                ingestText: {
                    flex: 1,
                    fontSize: fs(9),
                    lineHeight: lh(12),
                    color: colors.textSecondary,
                },
                empty: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.textSecondary,
                    paddingVertical: 10,
                },
                error: {
                    width: "100%",
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    color: colors.toastError,
                },
                footer: { flexDirection: "row", alignItems: "center", gap: 10 },
                footerHint: {
                    flex: 1,
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    color: colors.textSecondary,
                },
                primaryBtn: {
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 9,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                primaryBtnText: {
                    fontSize: fs(12.5),
                    lineHeight: lh(17),
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                btnDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
                pressed: { opacity: 0.75 },
            }),
        [colors]
    );

export default AssetsPanel;
