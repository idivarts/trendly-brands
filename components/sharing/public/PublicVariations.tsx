import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import { Platform as SocialPlatform } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import {
    EffectiveContentFields,
    IContentVariation,
    effectiveContentForPlatform,
    isFieldOverridden,
} from "@/shared-libs/firestore/trendly-pro/models/variations";
import { IContent } from "@/shared-libs/firestore/trendly-pro/models/contents";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import PublicMediaGallery from "./PublicMediaGallery";
import PublicPlatformOptions, { getPlatformOptionRows } from "./PublicPlatformOptions";

interface Props {
    brandId: string;
    contentId: string;
    content: IContent;
}

/** A targeted platform whose published output differs from the generic content. */
interface ResolvedVariation {
    platform: SocialPlatform;
    effective: EffectiveContentFields;
    captionOverridden: boolean;
    hashtagsOverridden: boolean;
    attachmentsOverridden: boolean;
    optionRows: ReturnType<typeof getPlatformOptionRows>;
}

/**
 * Read-only, per-platform "what actually publishes" section. For every targeted
 * platform it merges the generic content with that platform's variation
 * (`effectiveContentForPlatform`, the same resolver the publish path uses) and
 * surfaces only what's platform-specific — an overridden caption/hashtags/media
 * or any platform publishing options. Platforms identical to the generic content
 * are skipped, so this stays empty for simple single-copy posts.
 */
const PublicVariations: React.FC<Props> = ({ brandId, contentId, content }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const [variations, setVariations] = useState<Record<string, IContentVariation>>({});

    useEffect(() => {
        if (!brandId || !contentId) return;
        const ref = collection(FirestoreDB, "brands", brandId, "contents", contentId, "variations");
        const unsub = onSnapshot(
            ref,
            (snap) => {
                const map: Record<string, IContentVariation> = {};
                snap.forEach((d) => {
                    map[d.id] = d.data() as IContentVariation;
                });
                setVariations(map);
            },
            () => setVariations({})
        );
        return () => unsub();
    }, [brandId, contentId]);

    const resolved = useMemo<ResolvedVariation[]>(() => {
        const generic: EffectiveContentFields = {
            caption: content.caption ?? "",
            hashtags: content.hashtags ?? "",
            attachments: content.attachments ?? [],
            platformOptions: content.platformOptions,
        };

        const out: ResolvedVariation[] = [];
        for (const platform of content.platforms ?? []) {
            const variation = variations[platform];
            const effective = effectiveContentForPlatform(generic, variation);

            const captionOverridden =
                isFieldOverridden(variation, "caption") && effective.caption !== generic.caption;
            const hashtagsOverridden =
                isFieldOverridden(variation, "hashtags") && effective.hashtags !== generic.hashtags;
            const attachmentsOverridden = isFieldOverridden(variation, "attachments");
            const optionRows = getPlatformOptionRows(platform, effective.platformOptions);

            // Nothing platform-specific → identical to the generic content; skip.
            if (
                !captionOverridden &&
                !hashtagsOverridden &&
                !attachmentsOverridden &&
                optionRows.length === 0
            ) {
                continue;
            }

            out.push({
                platform,
                effective,
                captionOverridden,
                hashtagsOverridden,
                attachmentsOverridden,
                optionRows,
            });
        }
        return out;
    }, [content, variations]);

    if (!resolved.length) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Per-platform versions</Text>
            {resolved.map((rv) => {
                const meta = SOCIAL_PLATFORM_MAP[rv.platform];
                const accent = meta ? colors[meta.colorKey] : colors.primary;
                return (
                    <View key={rv.platform} style={styles.card}>
                        <View style={styles.cardHead}>
                            {meta ? (
                                <View style={[styles.platformDot, { backgroundColor: accent }]}>
                                    <FontAwesomeIcon icon={meta.icon} size={13} color={colors.white} />
                                </View>
                            ) : null}
                            <Text style={styles.platformLabel}>{meta?.label ?? rv.platform}</Text>
                        </View>

                        {rv.captionOverridden ? (
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Caption</Text>
                                <Text style={styles.fieldValue}>{rv.effective.caption}</Text>
                            </View>
                        ) : null}

                        {rv.hashtagsOverridden && rv.effective.hashtags ? (
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Hashtags</Text>
                                <Text style={[styles.fieldValue, { color: accent }]}>
                                    {rv.effective.hashtags}
                                </Text>
                            </View>
                        ) : null}

                        {rv.attachmentsOverridden && rv.effective.attachments.length ? (
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Media</Text>
                                <PublicMediaGallery attachments={rv.effective.attachments} />
                            </View>
                        ) : null}

                        {rv.optionRows.length ? (
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Options</Text>
                                <PublicPlatformOptions rows={rv.optionRows} />
                            </View>
                        ) : null}
                    </View>
                );
            })}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        section: {
            marginTop: 26,
            gap: 12,
        },
        sectionTitle: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.4,
        },
        card: {
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 16,
            gap: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 4,
            shadowOpacity: 0.05,
            elevation: 1,
        },
        cardHead: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        platformDot: {
            width: 26,
            height: 26,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
        },
        platformLabel: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
        },
        field: {
            gap: 6,
        },
        fieldLabel: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.4,
        },
        fieldValue: {
            fontSize: 14,
            lineHeight: 21,
            color: colors.text,
        },
    });
}

export default PublicVariations;
