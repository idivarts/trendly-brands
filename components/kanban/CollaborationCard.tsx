import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { InfluencerItem } from "../discover/discover-types";

export type CollaborationCardData = {
    id: string;
    status: string;
    message: string;
    socialProfile?: InfluencerItem;
    timeStamp?: number;
    collaborationId?: string;
    brandId?: string;
};

type CollaborationCardProps = {
    id: string;
    card: CollaborationCardData;
    colId: string;
};

type BrandData = {
    name: string;
    image?: string;
};

export const CollaborationCard = ({
    id,
    card,
    colId,
}: CollaborationCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const [brandData, setBrandData] = useState<BrandData | null>(null);
    const [loadingBrand, setLoadingBrand] = useState(false);

    useEffect(() => {
        const fetchBrandData = async () => {
            if (!card.brandId) {
                console.log("[CollaborationCard] No brandId for collaboration:", card.id);
                return;
            }

            setLoadingBrand(true);
            try {
                const brandRef = doc(FirestoreDB, "brands", card.brandId);
                const brandSnap = await getDoc(brandRef);

                if (brandSnap.exists()) {
                    const data = brandSnap.data();
                    setBrandData({
                        name: data.name || "Unknown Brand",
                        image: data.image,
                    });
                    console.log("[CollaborationCard] Fetched brand:", data.name);
                } else {
                    console.warn("[CollaborationCard] Brand not found:", card.brandId);
                }
            } catch (err) {
                console.warn("[CollaborationCard] Failed to fetch brand:", err);
            } finally {
                setLoadingBrand(false);
            }
        };

        fetchBrandData();
    }, [card.brandId, card.id]);

    return (
        // @ts-ignore
        <View
            ref={setNodeRef as any}
            {...attributes}
            {...listeners}
            style={[
                styles.card,
                style,
                {
                    display: "flex",
                    flexDirection: "column",
                    marginBottom: 8,
                },
            ]}
        >
            {/* Brand Section */}
            {loadingBrand ? (
                <View style={styles.brandSection}>
                    <Text style={styles.cardDesc}>Loading brand...</Text>
                </View>
            ) : brandData ? (
                <View style={styles.brandSection}>
                    {brandData.image ? (
                        <Image
                            source={{ uri: brandData.image }}
                            style={styles.brandImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.brandImage, styles.brandImagePlaceholder]}>
                            <Text style={styles.brandInitial}>
                                {brandData.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.brandName} numberOfLines={1}>
                        {brandData.name}
                    </Text>
                </View>
            ) : (
                <View style={styles.brandSection}>
                    <Text style={styles.cardDesc}>No brand info</Text>
                </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Collaboration Info */}
            <Text style={styles.cardTitle}>
                {card.socialProfile?.name || "Unknown"}{" "}
                <Text style={{ fontWeight: "400", opacity: 0.7 }}>
                    @{card.socialProfile?.username || ""}
                </Text>
            </Text>
            <Text style={[styles.cardDesc, { marginBottom: 4 }]}>
                Status: {colId.charAt(0).toUpperCase() + colId.slice(1)}
            </Text>
            {card.collaborationId && (
                <Text style={[styles.cardDesc, { marginBottom: 4 }]}>
                    Collaboration: {card.collaborationId}
                </Text>
            )}
            <Text style={styles.cardDesc} numberOfLines={3} ellipsizeMode="tail">
                {card.message || "No message"}
            </Text>
            <Text style={[styles.cardDesc, { marginTop: 6 }]}>
                Followers: {card.socialProfile?.follower_count ?? "-"} | ER:{" "}
                {card.socialProfile?.engagement_rate?.toFixed?.(2) ?? "-"}%
            </Text>
            {card.timeStamp && (
                <Text style={[styles.cardDesc, { marginTop: 4, opacity: 0.7 }]}>
                    Invited: {new Date(card.timeStamp).toLocaleDateString()}
                </Text>
            )}
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        card: {
            backgroundColor: colors.white,
            borderRadius: 8,
            padding: 10,
            marginBottom: 8,
        },
        brandSection: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
        },
        brandImage: {
            width: 36,
            height: 36,
            borderRadius: 18,
            marginRight: 8,
        },
        brandImagePlaceholder: {
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
        },
        brandInitial: {
            color: colors.white,
            fontSize: 16,
            fontWeight: "700",
        },
        brandName: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
            flex: 1,
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
            marginBottom: 8,
        },
        cardTitle: {
            fontWeight: "600",
            paddingBottom: 4,
            marginBottom: 4,
        },
        cardDesc: {
            marginTop: 0,
            color: colors.text,
        },
    });
