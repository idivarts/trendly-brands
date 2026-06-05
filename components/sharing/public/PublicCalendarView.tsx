import { IShareLink } from "@/shared-libs/firestore/trendly-pro/models/share-links";
import { BACKEND_URL } from "@/shared-libs/utils/http-wrapper";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface Props {
    share: IShareLink & { token: string };
}

interface PublicCalendarItem {
    id: string;
    title: string;
    contentFormat?: string;
    platform?: string;
    status?: string;
    postingTimeStamp?: number;
    imageUrl?: string;
}

interface PublicCalendarPayload {
    brand?: { name?: string; image?: string };
    month: string;
    items: PublicCalendarItem[];
}

function dayLabel(ts?: number): string {
    if (!ts) return "Unscheduled";
    return new Date(ts).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

const PublicCalendarView: React.FC<Props> = ({ share }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [payload, setPayload] = useState<PublicCalendarPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/public/shares/${share.token}`);
                if (!res.ok) throw new Error(String(res.status));
                const data = (await res.json()) as PublicCalendarPayload;
                if (!cancelled) {
                    setPayload(data);
                    setLoading(false);
                }
            } catch {
                if (!cancelled) {
                    setError(true);
                    setLoading(false);
                }
            }
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [share.token]);

    const monthTitle = useMemo(() => {
        const [y, m] = (payload?.month ?? share.month ?? "").split("-").map(Number);
        if (!y || !m) return "Content calendar";
        return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
        });
    }, [payload?.month, share.month]);

    const sortedItems = useMemo(
        () =>
            (payload?.items ?? [])
                .slice()
                .sort((a, b) => (a.postingTimeStamp ?? 0) - (b.postingTimeStamp ?? 0)),
        [payload?.items]
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }
    if (error || !payload) {
        return (
            <View style={styles.center}>
                <Text style={styles.notFound}>This calendar is no longer available.</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.doc}>
                <Text style={styles.title}>{monthTitle}</Text>
                {payload.brand?.name ? (
                    <Text style={styles.brandName}>{payload.brand.name}</Text>
                ) : null}

                {sortedItems.length === 0 ? (
                    <Text style={styles.empty}>No content planned for this month yet.</Text>
                ) : (
                    sortedItems.map((item) => (
                        <View key={item.id} style={styles.itemCard}>
                            {item.imageUrl ? (
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    style={styles.thumb}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.thumb, styles.thumbPlaceholder]} />
                            )}
                            <View style={styles.itemBody}>
                                <Text style={styles.itemDay}>{dayLabel(item.postingTimeStamp)}</Text>
                                <Text style={styles.itemTitle} numberOfLines={2}>
                                    {item.title}
                                </Text>
                                {(item.contentFormat || item.platform) && (
                                    <Text style={styles.itemMeta}>
                                        {[item.contentFormat, item.platform].filter(Boolean).join(" · ")}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        scroll: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            alignItems: "center",
            paddingVertical: 24,
            paddingHorizontal: 16,
        },
        doc: {
            width: "100%",
            maxWidth: 760,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 12,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        title: {
            fontSize: 24,
            fontWeight: "800",
            color: colors.text,
        },
        brandName: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
            marginTop: 4,
            marginBottom: 8,
        },
        empty: {
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 16,
        },
        itemCard: {
            flexDirection: "row",
            gap: 14,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.tag,
            marginTop: 12,
        },
        thumb: {
            width: 64,
            height: 64,
            borderRadius: 10,
            backgroundColor: colors.card,
        },
        thumbPlaceholder: {
            backgroundColor: colors.card,
        },
        itemBody: {
            flex: 1,
            minWidth: 0,
            justifyContent: "center",
        },
        itemDay: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.primary,
        },
        itemTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
            marginTop: 2,
        },
        itemMeta: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
        },
        center: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
        },
        notFound: {
            fontSize: 15,
            color: colors.textSecondary,
        },
    });
}

export default PublicCalendarView;
