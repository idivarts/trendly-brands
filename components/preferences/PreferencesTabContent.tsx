import {
    INFLUENCER_CATEGORIES,
    INITIAL_INFLUENCER_CATEGORIES,
    INITIAL_LANGUAGES,
    LANGUAGES,
    PLATFORMS,
} from "@/constants/ItemsList";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { COLLABORATION_TYPES } from "@/shared-constants/preferences/collab-type";
import { CITIES, POPULAR_CITIES } from "@/shared-constants/preferences/locations";
import { POST_TYPES } from "@/shared-constants/preferences/post-types";
import {
    TIME_COMMITMENT_DESCRIPTIONS,
    TIME_COMMITMENTS,
} from "@/shared-constants/preferences/time-commitment";
import { VIDEO_TYPE } from "@/shared-constants/preferences/video-type";
import { Console } from "@/shared-libs/utils/console";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors, { ColorsStatic } from "@/shared-uis/constants/Colors";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { Brand } from "@/types/Brand";
import {
    faFacebook,
    faInstagram,
    faLinkedin,
    faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import {
    faCheck,
    faLightbulb,
    faPlus,
    faStar,
    faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { FC, useEffect, useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Button from "../ui/button";
import PageHeader from "../ui/page-header";
import { Text } from "../theme/Themed";

interface PreferencesTabContentProps {
    collaborationId?: string;
}

const PLATFORM_ICONS: Record<string, typeof faInstagram> = {
    Instagram: faInstagram,
    Facebook: faFacebook,
    YouTube: faYoutube,
    LinkedIn: faLinkedin,
};

const PLATFORM_COLORS: Record<string, string> = {
    Instagram: ColorsStatic.socialInstagram,
    Facebook: ColorsStatic.socialFacebook,
    YouTube: ColorsStatic.socialYoutube,
    LinkedIn: ColorsStatic.socialLinkedin,
};

const PROMOTION_LABELS: Record<string, string> = {
    Barter: "Barter",
    PAID: "Paid",
};

const PreferencesTabContent: FC<PreferencesTabContentProps> = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const {
        updateBrand,
        selectedBrand,
    } = useBrandContext();

    const isOnFreeTrial = false;
    const [loading, setLoading] = useState(false);
    const { openModal } = useConfirmationModel();
    const router = useMyNavigation();

    const defaultPreferences = {
        promotionType: [] as string[],
        influencerCategories: [] as string[],
        platforms: [] as string[],
        timeCommitments: [] as string[],
        collaborationPostTypes: [] as string[],
        contentVideoType: [] as string[],
        locations: [] as string[],
        languages: [] as string[],
    };
    const [preferences, setPreferences] = useState<Brand["preferences"]>(
        defaultPreferences
    );

    useEffect(() => {
        if (selectedBrand) {
            Console.log("Selected Data", selectedBrand.preferences);
            setPreferences({
                ...defaultPreferences,
                ...selectedBrand.preferences,
            });
        }
    }, [selectedBrand]);

    const notifyUpgrade = () => {
        openModal({
            title: "Upgrade to Paid Plan!",
            description:
                "Setting Brand Preferences is just member only functionality. Please upgrade the plan now to not lose any data",
            confirmAction: () => {
                router.push("/billing");
            },
            confirmText: "Upgrade Now",
        });
    };

    const updatePreference = async () => {
        if (!selectedBrand) return;
        if (isOnFreeTrial) {
            notifyUpgrade();
            return;
        }
        try {
            setLoading(true);
            Console.log("All preferences", preferences);
            await updateBrand(selectedBrand.id, {
                ...selectedBrand,
                preferences,
            });
            PersistentStorage.clear("matchmaking_influencers-" + selectedBrand?.id);
            Toaster.success("Preference Saved");
        } catch (error) {
            Toaster.error("Error saving Preferences");
            Console.error(error, "Error updating Firestore");
        } finally {
            setLoading(false);
        }
    };

    const expoRouter = useRouter();
    const styles = useStyles(colors, xl);

    const handleCancel = () => {
        if (selectedBrand?.preferences) {
            setPreferences({
                ...defaultPreferences,
                ...selectedBrand.preferences,
            });
        }
        expoRouter.back();
    };

    if (!selectedBrand || !preferences)
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator />
            </View>
        );

    const PreferenceCard: FC<{
        title: string;
        description: string;
        children: React.ReactNode;
    }> = ({ title, description, children }) => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
            <View style={styles.cardContent}>{children}</View>
        </View>
    );

    const selectedTimeCommitment =
        preferences.timeCommitments?.[0] ?? TIME_COMMITMENTS[1];
    const selectedVideoType =
        preferences.contentVideoType?.[0] ?? VIDEO_TYPE[1];
    const selectedPromotionType =
        preferences.promotionType?.[0] ?? COLLABORATION_TYPES[1];

    return (
        <>
            <PageHeader
                title="Brand Preferences"
                subtitle="SETTINGS & CONFIGURATION"
                actionButtons={[
                    <Button
                        key="cancel"
                        mode="outlined"
                        onPress={handleCancel}
                        style={styles.cancelButton}
                        labelStyle={styles.cancelButtonLabel}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="save"
                        mode="contained"
                        onPress={updatePreference}
                        loading={loading}
                        style={styles.saveButton}
                    >
                        Save Changes
                    </Button>,
                ]}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.columns}>
                    <View style={styles.leftColumn}>
                        <PreferenceCard
                            title="Influencer's Location"
                            description="Select the regions where you want your influencers to be located. Leave blank if you have no preference."
                        >
                            <MultiSelectExtendable
                                buttonIcon={
                                    <FontAwesomeIcon
                                        icon={faPlus}
                                        color={colors.primary}
                                        size={14}
                                    />
                                }
                                buttonLabel="Add Region +"
                                initialItemsList={includeSelectedItems(
                                    CITIES,
                                    preferences.locations ?? []
                                )}
                                initialMultiselectItemsList={includeSelectedItems(
                                    POPULAR_CITIES,
                                    preferences.locations ?? []
                                )}
                                onSelectedItemsChange={(values) => {
                                    setPreferences({
                                        ...preferences,
                                        locations: values,
                                    });
                                }}
                                selectedItems={preferences.locations ?? []}
                                theme={theme}
                            />
                        </PreferenceCard>

                        <PreferenceCard
                            title="Content Language"
                            description="Language preference for creation."
                        >
                            <MultiSelectExtendable
                                buttonIcon={
                                    <FontAwesomeIcon
                                        icon={faPlus}
                                        color={colors.primary}
                                        size={14}
                                    />
                                }
                                buttonLabel="Add"
                                initialItemsList={includeSelectedItems(
                                    LANGUAGES,
                                    preferences.languages ?? []
                                )}
                                initialMultiselectItemsList={includeSelectedItems(
                                    INITIAL_LANGUAGES,
                                    preferences.languages ?? []
                                )}
                                onSelectedItemsChange={(values) => {
                                    setPreferences({
                                        ...preferences,
                                        languages: values,
                                    });
                                }}
                                selectedItems={preferences.languages ?? []}
                                theme={theme}
                            />
                        </PreferenceCard>

                        <PreferenceCard
                            title="Influencer's Content Niche"
                            description="Which content format are you willing to post on your social media account for promotions."
                        >
                            <MultiSelectExtendable
                                buttonIcon={
                                    <FontAwesomeIcon
                                        icon={faPlus}
                                        color={colors.primary}
                                        size={14}
                                    />
                                }
                                buttonLabel="Add"
                                initialItemsList={includeSelectedItems(
                                    INFLUENCER_CATEGORIES,
                                    preferences.influencerCategories ?? []
                                )}
                                initialMultiselectItemsList={includeSelectedItems(
                                    INITIAL_INFLUENCER_CATEGORIES,
                                    preferences.influencerCategories ?? []
                                )}
                                onSelectedItemsChange={(values) => {
                                    setPreferences({
                                        ...preferences,
                                        influencerCategories: values,
                                    });
                                }}
                                selectedItems={
                                    preferences.influencerCategories ?? []
                                }
                                theme={theme}
                            />
                        </PreferenceCard>

                        <PreferenceCard
                            title="Promotion Type"
                            description="Deals offered by your brand."
                        >
                            <View style={styles.toggleRow}>
                                {COLLABORATION_TYPES.map((value) => {
                                    const isSelected =
                                        selectedPromotionType === value;
                                    return (
                                        <Pressable
                                            key={value}
                                            style={[
                                                styles.toggleOption,
                                                isSelected &&
                                                    styles.toggleOptionSelected,
                                            ]}
                                            onPress={() => {
                                                setPreferences({
                                                    ...preferences,
                                                    promotionType: [value],
                                                });
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.toggleOptionText,
                                                    isSelected &&
                                                        styles.toggleOptionTextSelected,
                                                ]}
                                            >
                                                {PROMOTION_LABELS[value] ??
                                                    value}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </PreferenceCard>

                        <PreferenceCard
                            title="Collaboration Post Types"
                            description="Select the formats you want influencers to post during your campaign."
                        >
                            <View style={styles.chipRow}>
                                {POST_TYPES.map((value) => {
                                    const isSelected = (
                                        preferences.collaborationPostTypes ?? []
                                    ).includes(value);
                                    return (
                                        <Pressable
                                            key={value}
                                            onPress={() => {
                                                const current =
                                                    preferences.collaborationPostTypes ??
                                                    [];
                                                const next = isSelected
                                                    ? current.filter((v) => v !== value)
                                                    : [...current, value];
                                                setPreferences({
                                                    ...preferences,
                                                    collaborationPostTypes: next,
                                                });
                                            }}
                                        >
                                            <View
                                                style={[
                                                    styles.chip,
                                                    isSelected &&
                                                        styles.chipSelected,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        isSelected &&
                                                            styles.chipTextSelected,
                                                    ]}
                                                >
                                                    {value}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </PreferenceCard>

                        <PreferenceCard
                            title="Video Types"
                            description="Do you want the content to be integrated into a larger video or a dedicated shout-out?"
                        >
                            <View style={styles.toggleRow}>
                                {VIDEO_TYPE.map((value) => {
                                    const isSelected =
                                        selectedVideoType === value;
                                    return (
                                        <Pressable
                                            key={value}
                                            style={[
                                                styles.videoToggleOption,
                                                isSelected &&
                                                    styles.toggleOptionSelected,
                                            ]}
                                            onPress={() => {
                                                setPreferences({
                                                    ...preferences,
                                                    contentVideoType: [value],
                                                });
                                            }}
                                        >
                                            <FontAwesomeIcon
                                                icon={
                                                    value === "Integrated Video"
                                                        ? faVideo
                                                        : faStar
                                                }
                                                size={18}
                                                color={
                                                    isSelected
                                                        ? colors.white
                                                        : colors.text
                                                }
                                            />
                                            <Text
                                                style={[
                                                    styles.toggleOptionText,
                                                    isSelected &&
                                                        styles.toggleOptionTextSelected,
                                                ]}
                                            >
                                                {value}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </PreferenceCard>
                    </View>

                    <View style={styles.rightColumn}>
                        <PreferenceCard
                            title="Social Platforms"
                            description="Primary channels for promotion."
                        >
                            <View style={styles.platformList}>
                                {PLATFORMS.map((platform) => {
                                    const isSelected = (
                                        preferences.platforms ?? []
                                    ).includes(platform);
                                    const iconColor =
                                        PLATFORM_COLORS[platform] ??
                                        colors.text;
                                    return (
                                        <Pressable
                                            key={platform}
                                            style={[
                                                styles.platformItem,
                                                isSelected &&
                                                    styles.platformItemSelected,
                                            ]}
                                            onPress={() => {
                                                const current =
                                                    preferences.platforms ?? [];
                                                const next = isSelected
                                                    ? current.filter(
                                                          (p) => p !== platform
                                                      )
                                                    : [...current, platform];
                                                setPreferences({
                                                    ...preferences,
                                                    platforms: next,
                                                });
                                            }}
                                        >
                                            <View
                                                style={[
                                                    styles.platformIconBox,
                                                    {
                                                        backgroundColor:
                                                            iconColor,
                                                    },
                                                ]}
                                            >
                                                <FontAwesomeIcon
                                                    icon={
                                                        PLATFORM_ICONS[
                                                            platform
                                                        ] ?? faInstagram
                                                    }
                                                    size={20}
                                                    color={colors.white}
                                                />
                                            </View>
                                            <Text style={styles.platformName}>
                                                {platform}
                                            </Text>
                                            <View
                                                style={[
                                                    styles.checkCircle,
                                                    isSelected &&
                                                        styles.checkCircleSelected,
                                                ]}
                                            >
                                                {isSelected && (
                                                    <FontAwesomeIcon
                                                        icon={faCheck}
                                                        size={12}
                                                        color={colors.white}
                                                    />
                                                )}
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </PreferenceCard>

                        <PreferenceCard
                            title="Time Commitment"
                            description="Influence professional status."
                        >
                            <View style={styles.radioList}>
                                {TIME_COMMITMENTS.map((value) => {
                                    const isSelected =
                                        selectedTimeCommitment === value;
                                    const desc =
                                        TIME_COMMITMENT_DESCRIPTIONS[value];
                                    return (
                                        <Pressable
                                            key={value}
                                            style={[
                                                styles.radioItem,
                                                isSelected &&
                                                    styles.radioItemSelected,
                                            ]}
                                            onPress={() => {
                                                setPreferences({
                                                    ...preferences,
                                                    timeCommitments: [value],
                                                });
                                            }}
                                        >
                                            <View
                                                style={[
                                                    styles.radioCircle,
                                                    isSelected &&
                                                        styles.radioCircleSelected,
                                                ]}
                                            >
                                                {isSelected && (
                                                    <View
                                                        style={
                                                            styles.radioCircleInner
                                                        }
                                                    />
                                                )}
                                            </View>
                                            <View style={styles.radioTextBlock}>
                                                <Text
                                                    style={
                                                        styles.radioItemTitle
                                                    }
                                                >
                                                    {value}
                                                </Text>
                                                {desc && (
                                                    <Text
                                                        style={
                                                            styles.radioItemDesc
                                                        }
                                                    >
                                                        {desc}
                                                    </Text>
                                                )}
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </PreferenceCard>

                        <View style={styles.proTipCard}>
                            <FontAwesomeIcon
                                icon={faLightbulb}
                                size={20}
                                color={colors.primary}
                                style={styles.proTipIcon}
                            />
                            <View style={styles.proTipContent}>
                                <Text style={styles.proTipTitle}>Pro Tip</Text>
                                <Text style={styles.proTipText}>
                                    Selecting 'Paid' and 'Full Time' typically
                                    yields higher quality content but may
                                    require larger campaign budgets and longer
                                    lead times.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </>
    );
};

function useStyles(
    colors: ReturnType<typeof Colors>,
    xl: boolean
) {
    return useMemo(
        () =>
            StyleSheet.create({
                loadingContainer: {
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                },
                cancelButton: {
                    borderColor: colors.outline,
                },
                cancelButtonLabel: {
                    color: colors.textSecondary,
                },
                saveButton: {},
                scrollView: {
                    flex: 1,
                    backgroundColor: colors.surfaceLight ?? colors.gray200,
                },
                scrollContent: {
                    padding: 16,
                    paddingBottom: 40,
                },
                columns: {
                    flexDirection: xl ? "row" : "column",
                    gap: 16,
                    alignItems: "stretch",
                },
                leftColumn: {
                    flex: xl ? 1 : undefined,
                    gap: 16,
                },
                rightColumn: {
                    flex: xl ? 1 : undefined,
                    gap: 16,
                },
                card: {
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    padding: 20,
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                },
                cardTitle: {
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 6,
                },
                cardDescription: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 14,
                },
                cardContent: {
                    gap: 8,
                },
                chipRow: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                },
                chip: {
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: colors.outline,
                },
                chipSelected: {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                },
                chipText: {
                    fontSize: 14,
                    color: colors.text,
                },
                chipTextSelected: {
                    color: colors.white,
                },
                toggleRow: {
                    flexDirection: "row",
                    gap: 12,
                },
                toggleOption: {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: colors.outline,
                },
                toggleOptionSelected: {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                },
                toggleOptionText: {
                    fontSize: 14,
                    color: colors.text,
                },
                toggleOptionTextSelected: {
                    color: colors.white,
                },
                videoToggleOption: {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: colors.outline,
                },
                platformList: {
                    gap: 10,
                },
                platformItem: {
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.outline,
                    backgroundColor: colors.tag,
                },
                platformItemSelected: {
                    borderColor: colors.primary,
                    borderWidth: 2,
                },
                platformIconBox: {
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                },
                platformName: {
                    flex: 1,
                    fontSize: 16,
                    color: colors.text,
                },
                checkCircle: {
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: colors.outline,
                    alignItems: "center",
                    justifyContent: "center",
                },
                checkCircleSelected: {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                },
                radioList: {
                    gap: 10,
                },
                radioItem: {
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.outline,
                    backgroundColor: colors.tag,
                },
                radioItemSelected: {
                    borderColor: colors.primary,
                    borderWidth: 2,
                },
                radioCircle: {
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: colors.outline,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                },
                radioCircleSelected: {
                    borderColor: colors.primary,
                },
                radioCircleInner: {
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: colors.primary,
                },
                radioTextBlock: {
                    flex: 1,
                },
                radioItemTitle: {
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                },
                radioItemDesc: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginTop: 2,
                },
                proTipCard: {
                    flexDirection: "row",
                    backgroundColor: colors.primaryLight,
                    borderRadius: 14,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: colors.primary,
                },
                proTipIcon: {
                    marginRight: 12,
                    marginTop: 2,
                },
                proTipContent: {
                    flex: 1,
                },
                proTipTitle: {
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 6,
                },
                proTipText: {
                    fontSize: 14,
                    color: colors.textSecondary,
                },
            }),
        [colors, xl]
    );
}

export default PreferencesTabContent;
