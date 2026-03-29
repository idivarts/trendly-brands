import Button from "@/components/ui/button";
import { useBreakpoints } from "@/hooks";
import { IOScroll } from "@/shared-libs/contexts/scroll-context";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import { CollaborationLocationType, IAdvanceFilters, normalizeCollaborationLocationType } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import ImageComponent from "@/shared-uis/components/image-component";
import ReadMore from "@/shared-uis/components/ReadMore";
import Colors from "@/shared-uis/constants/Colors";
import { formatTimeToNow } from "@/utils/date";
import {
    faBuilding,
    faBullhorn,
    faCheckCircle,
    faCircleInfo,
    faComments,
    faDollarSign,
    faEnvelope,
    faFilm,
    faHouseLaptop,
    faLanguage,
    faLink,
    faLocationDot,
    faPaperPlane,
    faShareNodes,
    faSliders,
    faUser,
    faUsers,
    faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Portal, Text } from "react-native-paper";
import { CollaborationDetail } from ".";
import BrandModal from "./modal/BrandModal";
import ManagerModal from "./modal/ManagerModal";

function isOnSiteLocation(type?: string): boolean {
    if (!type) return false;
    const normalizedType = normalizeCollaborationLocationType(type);
    return normalizedType === CollaborationLocationType.OnSite;
}

function formatPillLocationType(type?: string): string {
    return isOnSiteLocation(type) ? "On-site" : "Remote";
}

const PROMOTION_SUBJECT_LABELS: Record<string, string> = {
    physical_product: "Physical product",
    services: "Services",
    others: "Other",
};

function humanizePromotionSubject(key?: string): string | undefined {
    if (!key) return undefined;
    return PROMOTION_SUBJECT_LABELS[key] ?? key.replace(/_/g, " ");
}

function humanizeStatus(status: string): string {
    if (!status) return "—";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, " ");
}

function humanizeSort(sort?: string): string | undefined {
    if (!sort) return undefined;
    return sort.replace(/_/g, " ");
}

function formatNum(n: number): string {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

function formatOptionalRange(
    min?: number,
    max?: number,
    unitSuffix?: string
): string | null {
    if (min == null && max == null) return null;
    const a = min != null ? formatNum(min) : "Any";
    const b = max != null ? formatNum(max) : "Any";
    return unitSuffix ? `${a} – ${b} ${unitSuffix}` : `${a} – ${b}`;
}

function normalizeExternalUrl(url: string): string {
    const t = url.trim();
    if (/^https?:\/\//i.test(t)) return t;
    return `https://${t}`;
}

function preferencesHasAny(p?: IAdvanceFilters): boolean {
    if (!p) return false;
    return Object.values(p).some((v) => {
        if (v === undefined || v === null) return false;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "boolean") return true;
        if (typeof v === "number") return !Number.isNaN(v);
        if (typeof v === "string") return v.length > 0;
        return false;
    });
}

interface CollaborationDetailsContentProps {
    collaboration: CollaborationDetail;
    /** When provided and draft + !xl, Edit and Publish buttons are shown below Ready to Launch */
    onEditPress?: () => void;
    onPublishPress?: () => void;
}

const OverviewTabContent = (props: CollaborationDetailsContentProps) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const styles = useMemo(
        () => createStyles(colors, xl, width),
        [colors, xl, width]
    );

    const [managerDetails, setManagerDetails] = useState<{
        name?: string;
        email?: string;
        profileImage?: string;
        role?: string;
    }>();
    const [managerModalVisible, setManagerModalVisible] = useState(false);
    const [brandModalVisible, setBrandModalVisible] = useState(false);
    const [applicationCount, setApplicationCount] = useState(0);
    const [invitationCount, setInvitationCount] = useState(0);
    const [totalCampaigns, setTotalCampaigns] = useState<number | null>(null);
    const [activeCollaborations, setActiveCollaborations] = useState<number | null>(null);

    const isDraft = props.collaboration.status === "draft";
    const imageAttachments =
        props.collaboration.attachments
            ?.filter(
                (attachment) =>
                    attachment.type === "image" &&
                    (attachment.imageUrl ||
                        attachment.appleUrl ||
                        attachment.playUrl)
            )
            .slice(0, 6) || [];
    const fetchManagerDetails = async () => {
        if (!props.collaboration.managerId || !props.collaboration.brandId) return;
        const managerRef = doc(
            FirestoreDB,
            "managers",
            props.collaboration.managerId
        );
        const managerBrandRef = doc(
            FirestoreDB,
            "brands",
            props.collaboration.brandId,
            "members",
            props.collaboration.managerId
        );
        const [managerDoc, managerBrandDoc] = await Promise.all([
            getDoc(managerRef),
            getDoc(managerBrandRef),
        ]);
        const managerData = managerDoc.data() as IManagers;
        const managerBrandData = managerBrandDoc.data();
        setManagerDetails({
            name: managerData?.name,
            email: managerData?.email,
            profileImage: managerData?.profileImage,
            role: managerBrandData?.role,
        });
    };

    const fetchCollaboration = async () => {
        if (!props.collaboration.id) return;
        const [applicationsSnap, invitationsSnap] = await Promise.all([
            getDocs(
                collection(FirestoreDB, "collaborations", props.collaboration.id, "applications")
            ),
            getDocs(
                collection(FirestoreDB, "collaborations", props.collaboration.id, "invitations")
            ),
        ]);
        setApplicationCount(applicationsSnap.size);
        setInvitationCount(invitationsSnap.size);
    };

    const fetchBrandStats = async () => {
        if (!props.collaboration.brandId) return;
        try {
            const collabRef = collection(FirestoreDB, "collaborations");
            const totalQ = query(
                collabRef,
                where("brandId", "==", props.collaboration.brandId)
            );
            const activeQ = query(
                collabRef,
                where("brandId", "==", props.collaboration.brandId),
                where("status", "==", "active")
            );
            const [totalSnap, activeSnap] = await Promise.all([
                getDocs(totalQ),
                getDocs(activeQ),
            ]);
            setTotalCampaigns(totalSnap.size);
            setActiveCollaborations(activeSnap.size);
        } catch {
            setTotalCampaigns(null);
            setActiveCollaborations(null);
        }
    };

    useEffect(() => {
        fetchManagerDetails();
    }, [props.collaboration.managerId, props.collaboration.brandId]);

    useEffect(() => {
        fetchCollaboration();
    }, [props.collaboration.id]);

    useEffect(() => {
        fetchBrandStats();
    }, [props.collaboration.brandId]);

    const c = props.collaboration;
    const paymentLabel =
        c.promotionType === PromotionType.PAID_COLLAB ? "Paid" : "Unpaid";
    const locationPillLabel = formatPillLocationType(c.location?.type);
    const locationIconPill = isOnSiteLocation(c.location?.type)
        ? faLocationDot
        : faHouseLaptop;

    const videoAttachments =
        c.attachments?.filter(
            (a) =>
                (a.type === "video" || a.type === "reel") &&
                (a.appleUrl || a.playUrl)
        ) ?? [];

    const openExternalUrl = (url: string) => {
        Linking.openURL(normalizeExternalUrl(url)).catch(() => { });
    };

    const renderDetailsCard = () => (
        <View style={styles.card}>
            {imageAttachments.length > 0 ? (
                xl ? (
                    <View style={styles.campaignImagesGrid}>
                        {imageAttachments.map((attachment, index) => (
                            <View style={styles.campaignImageItem} key={index}>
                                <ImageComponent
                                    shape="square"
                                    size="large"
                                    url={
                                        attachment.imageUrl ||
                                        attachment.appleUrl ||
                                        attachment.playUrl ||
                                        ""
                                    }
                                    altText={props.collaboration.name || "Campaign image"}
                                    style={styles.campaignImage}
                                />
                            </View>
                        ))}
                    </View>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.campaignImagesScrollContent}
                    >
                        <View style={styles.campaignImagesRow}>
                            {imageAttachments.map((attachment, index) => (
                                <View style={styles.campaignImageItemHorizontal} key={index}>
                                    <ImageComponent
                                        shape="square"
                                        size="large"
                                        url={
                                            attachment.imageUrl ||
                                            attachment.appleUrl ||
                                            attachment.playUrl ||
                                            ""
                                        }
                                        altText={props.collaboration.name || "Campaign image"}
                                        style={styles.campaignImageHorizontal}
                                    />
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                )
            ) : null}
            <View style={styles.detailsHeaderRow}>
                <Text variant="headlineMedium" style={styles.title} numberOfLines={1}>
                    {props.collaboration.name}
                </Text>
                {props.collaboration.timeStamp ? (
                    <Text style={styles.timestamp}>
                        {formatTimeToNow(props.collaboration.timeStamp)}
                    </Text>
                ) : null}
            </View>
            <View style={styles.pillsRow}>
                <View style={styles.pill}>
                    <FontAwesomeIcon
                        icon={faDollarSign}
                        size={12}
                        color={colors.text}
                    />
                    <Text style={styles.pillText}>{paymentLabel}</Text>
                </View>
                <View style={styles.pill}>
                    <FontAwesomeIcon
                        icon={locationIconPill}
                        size={12}
                        color={colors.text}
                    />
                    <Text style={styles.pillText}>{locationPillLabel}</Text>
                </View>
            </View>
            <View style={styles.descriptionWrap}>
                <ReadMore
                    style={styles.description}
                    text={props.collaboration.description || ""}
                    lineCount={4}
                    showReadMore={true}
                />
            </View>
            <View style={styles.metricsRow}>
                <View style={styles.metricBlock}>
                    <FontAwesomeIcon
                        icon={faUser}
                        size={18}
                        color={colors.textSecondary}
                    />
                    <Text style={styles.metricLabel}>Influencers Needed</Text>
                    <Text style={styles.metricValue}>
                        {props.collaboration.numberOfInfluencersNeeded ?? 0}
                    </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricBlock}>
                    <FontAwesomeIcon
                        icon={faUsers}
                        size={18}
                        color={colors.textSecondary}
                    />
                    <Text style={styles.metricLabel}>Influencers Applied</Text>
                    <Text style={styles.metricValue}>{applicationCount}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricBlock}>
                    <FontAwesomeIcon
                        icon={faPaperPlane}
                        size={18}
                        color={colors.textSecondary}
                    />
                    <Text style={styles.metricLabel}>Invitations Sent</Text>
                    <Text style={styles.metricValue}>{invitationCount}</Text>
                </View>
            </View>
        </View>
    );

    const renderReadyToLaunchCard = () =>
        isDraft ? (
            <View style={styles.card}>
                <View style={styles.readyToLaunchContent}>
                    <FontAwesomeIcon
                        icon={faBullhorn}
                        size={40}
                        color={colors.primary}
                    />
                    <Text style={styles.readyToLaunchTitle}>Ready to launch?</Text>
                    <Text style={styles.readyToLaunchSubtext}>
                        Once you publish this collaboration, influencers will be
                        able to discover and apply to work with you.
                    </Text>
                </View>
                {!xl && (props.onEditPress != null || props.onPublishPress != null) ? (
                    <View style={styles.readyToLaunchActions}>
                        {props.onEditPress != null ? (
                            <Button
                                mode="contained"
                                onPress={props.onEditPress}
                                size="small"
                                style={styles.draftActionButton}
                                textColor={colors.text}
                            >
                                Edit
                            </Button>
                        ) : null}
                        {props.onPublishPress != null ? (
                            <Button
                                mode="contained"
                                onPress={props.onPublishPress}
                                size="small"
                                style={styles.publishActionButton}
                            >
                                Publish
                            </Button>
                        ) : null}
                    </View>
                ) : null}
            </View>
        ) : null;

    const renderPostedByCard = () => (
        <View style={styles.card}>
            <Text style={styles.sidebarLabel}>POSTED BY</Text>
            <View style={styles.managerRow}>
                <ImageComponent
                    url={managerDetails?.profileImage ?? ""}
                    size="small"
                    altText="Manager"
                    initials={managerDetails?.name}
                    initialsSize={16}
                    style={styles.managerAvatar}
                />
                <View style={styles.managerInfo}>
                    <Text style={styles.managerName} numberOfLines={1}>
                        {managerDetails?.name ?? "—"}
                    </Text>
                    {/* <Text style={styles.managerRole}>
                        {managerDetails?.role ?? "Manager"}
                    </Text> */}
                    <Text style={styles.managerBrand} numberOfLines={1}>
                        {props.collaboration.brandName}
                    </Text>
                </View>
            </View>
            <Button
                mode="outlined"
                onPress={() => setManagerModalVisible(true)}
                style={styles.contactButton}
                textColor={colors.text}
                icon={() => (
                    <FontAwesomeIcon
                        icon={faEnvelope}
                        size={14}
                        color={colors.text}
                    />
                )}
            >
                Contact Manager
            </Button>
        </View>
    );

    const renderAccountCard = () => (
        <View style={styles.card}>
            <View style={styles.accountHeader}>
                <FontAwesomeIcon
                    icon={faBuilding}
                    size={18}
                    color={colors.text}
                />
                <Text style={styles.accountBrandName} numberOfLines={1}>
                    {props.collaboration.brandName}
                </Text>
            </View>
            <View style={styles.accountStatRow}>
                <Text style={styles.accountStatLabel}>Total Campaigns</Text>
                <Text style={styles.accountStatValue}>
                    {totalCampaigns !== null ? totalCampaigns : "—"}
                </Text>
            </View>
            <View style={styles.accountStatRow}>
                <Text style={styles.accountStatLabel}>Active Collaborations</Text>
                <Text style={styles.accountStatValue}>
                    {activeCollaborations !== null ? activeCollaborations : "—"}
                </Text>
            </View>
        </View>
    );

    const renderProTipCard = () => (
        <View style={styles.card}>
            <View style={styles.proTipHeader}>
                <FontAwesomeIcon
                    icon={faCircleInfo}
                    size={18}
                    color={colors.text}
                />
                <Text style={styles.proTipTitle}>Pro Tip</Text>
            </View>
            <Text style={styles.proTipText}>
                Adding specific deliverables and timeline expectations helps
                attract higher-quality influencer applications.
            </Text>
        </View>
    );

    const renderKeyValueRow = (label: string, value: string, rowKey?: string) => (
        <View style={styles.kvRow} key={rowKey}>
            <Text style={styles.kvLabel}>{label}</Text>
            <Text style={styles.kvValue}>{value}</Text>
        </View>
    );

    const renderCampaignAndBudgetCard = () => {
        const paid = c.promotionType === PromotionType.PAID_COLLAB;
        const budget = c.budget;
        const hasBudget =
            paid &&
            budget &&
            (budget.min != null || budget.max != null);
        const subjectLabel = humanizePromotionSubject(c.promotionSubject);
        const hasProducts =
            (c.products?.length ?? 0) > 0 &&
            c.products?.some((p) => p.name != null || p.cost != null);
        if (!hasBudget && !subjectLabel && !hasProducts) return null;

        const budgetText =
            hasBudget && budget
                ? formatOptionalRange(budget.min, budget.max) ?? "—"
                : null;

        return (
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>CAMPAIGN & OFFER</Text>
                {budgetText ? renderKeyValueRow("Budget range", budgetText, "budget") : null}
                {subjectLabel ? renderKeyValueRow("Promoting", subjectLabel, "promo-subj") : null}
                {hasProducts
                    ? c.products?.map((product, index) => (
                        <View
                            key={`product-${index}`}
                            style={styles.productRow}
                        >
                            <Text style={styles.kvLabel}>
                                {product.name?.trim()
                                    ? product.name
                                    : `Product ${index + 1}`}
                            </Text>
                            {product.cost != null ? (
                                <Text style={styles.kvValue}>
                                    {formatNum(product.cost)}
                                </Text>
                            ) : (
                                <Text style={styles.kvMuted}>—</Text>
                            )}
                        </View>
                    ))
                    : null}
            </View>
        );
    };

    const renderContentAndChannelsCard = () => {
        const langs = c.preferredContentLanguage ?? [];
        const formats = c.contentFormat ?? [];
        const platforms = c.platform ?? [];
        if (!langs.length && !formats.length && !platforms.length) return null;

        const rows: {
            key: string;
            icon: React.ComponentProps<typeof FontAwesomeIcon>["icon"];
            title: string;
            values: string[];
        }[] = [];
        if (langs.length) {
            rows.push({
                key: "langs",
                icon: faLanguage,
                title: "Languages",
                values: langs,
            });
        }
        if (formats.length) {
            rows.push({
                key: "formats",
                icon: faFilm,
                title: "Content formats",
                values: formats,
            });
        }
        if (platforms.length) {
            rows.push({
                key: "platforms",
                icon: faShareNodes,
                title: "Platforms",
                values: platforms,
            });
        }

        return (
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>CONTENT & CHANNELS</Text>
                <View style={styles.contentChannelList}>
                    {rows.map((row, index) => (
                        <View
                            key={row.key}
                            style={[
                                styles.contentChannelRow,
                                index > 0 && styles.contentChannelRowBordered,
                            ]}
                        >
                            <View style={styles.contentChannelIconWrap}>
                                <FontAwesomeIcon
                                    icon={row.icon}
                                    size={16}
                                    color={colors.primary}
                                />
                            </View>
                            <View style={styles.contentChannelBody}>
                                <Text style={styles.contentChannelTitle}>
                                    {row.title}
                                </Text>
                                <Text style={styles.contentChannelValueText}>
                                    {row.values.join(" · ")}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderLocationDetailsCard = () => {
        const loc = c.location;

        if (loc.type !== CollaborationLocationType.OnSite) return null;

        const name = loc?.name?.trim();
        const latlong = loc?.latlong;
        if (!name && !latlong) return null;

        return (
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>LOCATION DETAILS</Text>
                {name ? renderKeyValueRow("Venue / area", name, "loc-name") : null}
                {latlong ? (
                    <View style={styles.kvRow}>
                        <Text style={styles.kvLabel}>Coordinates</Text>
                        <Pressable
                            onPress={() =>
                                openExternalUrl(
                                    `https://www.google.com/maps?q=${latlong.lat},${latlong.long}`
                                )
                            }
                            accessibilityRole="link"
                        >
                            <Text style={styles.linkText}>
                                {formatNum(latlong.lat)}, {formatNum(latlong.long)}
                            </Text>
                        </Pressable>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderVideoAttachmentsCard = () => {
        if (!videoAttachments.length) return null;

        return (
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>VIDEO ATTACHMENTS</Text>
                {videoAttachments.map((att, index) => {
                    const url = att.appleUrl || att.playUrl || "";
                    const kind = att.type === "reel" ? "Reel" : "Video";
                    return (
                        <Pressable
                            key={`vid-${index}`}
                            style={styles.linkRow}
                            onPress={() => openExternalUrl(url)}
                            accessibilityRole="button"
                            accessibilityLabel={`Open ${kind} ${index + 1}`}
                        >
                            <FontAwesomeIcon
                                icon={faVideo}
                                size={16}
                                color={colors.primary}
                            />
                            <Text style={styles.linkRowText}>
                                {kind} {index + 1}
                            </Text>
                            <FontAwesomeIcon
                                icon={faLink}
                                size={12}
                                color={colors.textSecondary}
                            />
                        </Pressable>
                    );
                })}
            </View>
        );
    };

    const renderExternalLinksCard = () => {
        const links = c.externalLinks ?? [];
        if (!links.length) return null;

        return (
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>EXTERNAL LINKS</Text>
                {links.map((link, index) => (
                    <Pressable
                        key={`ext-${index}`}
                        style={styles.linkRow}
                        onPress={() => openExternalUrl(link.link)}
                        accessibilityRole="link"
                    >
                        <FontAwesomeIcon
                            icon={faLink}
                            size={16}
                            color={colors.primary}
                        />
                        <Text style={styles.linkRowText} numberOfLines={2}>
                            {link.name?.trim() ? link.name : link.link}
                        </Text>
                    </Pressable>
                ))}
            </View>
        );
    };

    const renderQuestionsCard = () => {
        const qs = c.questionsToInfluencers ?? [];
        if (!qs.length) return null;

        return (
            <View style={styles.card}>
                <View style={styles.sectionTitleRow}>
                    <FontAwesomeIcon
                        icon={faComments}
                        size={16}
                        color={colors.textSecondary}
                    />
                    <Text style={styles.sectionTitleRowLabel}>
                        QUESTIONS FOR INFLUENCERS
                    </Text>
                </View>
                {qs.map((q, index) => (
                    <View key={`q-${index}`} style={styles.questionBlock}>
                        <Text style={styles.questionIndex}>{index + 1}.</Text>
                        <Text style={styles.questionText}>{q}</Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderInfluencerPreferencesCard = () => {
        const p = c.preferences;
        if (!preferencesHasAny(p)) return null;

        const rows: { label: string; value: string }[] = [];
        const addRange = (
            label: string,
            min?: number,
            max?: number,
            suffix?: string
        ) => {
            const r = formatOptionalRange(min, max, suffix);
            if (r) rows.push({ label, value: r });
        };

        addRange("Followers", p?.followerMin, p?.followerMax);
        addRange("Posts / content count", p?.contentMin, p?.contentMax);
        addRange("Monthly views", p?.monthlyViewMin, p?.monthlyViewMax);
        addRange(
            "Monthly engagements",
            p?.monthlyEngagementMin,
            p?.monthlyEngagementMax
        );
        addRange("Avg. views", p?.avgViewsMin, p?.avgViewsMax);
        addRange("Avg. likes", p?.avgLikesMin, p?.avgLikesMax);
        addRange("Avg. comments", p?.avgCommentsMin, p?.avgCommentsMax);
        addRange(
            "Quality score",
            p?.qualityMin != null ? p.qualityMin / 2 : undefined,
            p?.qualityMax != null ? p.qualityMax / 2 : undefined,
            "(0–5)"
        );
        const er = formatOptionalRange(p?.erMin, p?.erMax, "%");
        if (er) rows.push({ label: "Engagement rate", value: er });

        if (p?.descKeywords?.length) {
            rows.push({
                label: "Bio keywords",
                value: p.descKeywords.join(", "),
            });
        }
        if (p?.name?.trim()) {
            rows.push({ label: "Name filter", value: p.name.trim() });
        }
        if (p?.isVerified !== undefined) {
            rows.push({
                label: "Verified only",
                value: p.isVerified ? "Yes" : "No",
            });
        }
        if (p?.hasContact !== undefined) {
            rows.push({
                label: "Has contact info",
                value: p.hasContact ? "Yes" : "No",
            });
        }
        if (p?.genders?.length) {
            rows.push({ label: "Genders", value: p.genders.join(", ") });
        }
        if (p?.selectedNiches?.length) {
            rows.push({
                label: "Niches",
                value: p.selectedNiches.join(", "),
            });
        }
        if (p?.selectedLocations?.length) {
            rows.push({
                label: "Locations",
                value: p.selectedLocations.join(", "),
            });
        }
        const sortLabel = humanizeSort(p?.sort);
        if (sortLabel) {
            rows.push({ label: "Sort preference", value: sortLabel });
        }

        if (!rows.length) return null;

        return (
            <View style={styles.card}>
                <View style={styles.sectionTitleRow}>
                    <FontAwesomeIcon
                        icon={faSliders}
                        size={16}
                        color={colors.textSecondary}
                    />
                    <Text style={styles.sectionTitleRowLabel}>
                        AI GENERATED INFLUENCER CRITERIA
                    </Text>
                </View>
                {rows.map((row, index) =>
                    renderKeyValueRow(row.label, row.value, `pref-${index}`)
                )}
            </View>
        );
    };

    // const renderActivityInsightsCard = () => {
    //     const hasViews = c.viewsLastHour != null;
    //     const hasReviewed = c.lastReviewedTimeStamp != null;
    //     const hasStatus = Boolean(c.status?.length);
    //     if (!hasViews && !hasReviewed && !hasStatus) return null;

    //     return (
    //         <View style={styles.card}>
    //             <Text style={styles.sectionLabel}>ACTIVITY</Text>
    //             {c.status ? renderKeyValueRow("Status", humanizeStatus(c.status), "status") : null}
    //             {hasViews ? (
    //                 <View style={styles.kvRow}>
    //                     <View style={styles.kvLabelWithIcon}>
    //                         <FontAwesomeIcon
    //                             icon={faEye}
    //                             size={14}
    //                             color={colors.textSecondary}
    //                         />
    //                         <Text style={styles.kvLabel}>Views (last hour)</Text>
    //                     </View>
    //                     <Text style={styles.kvValue}>{formatNum(c.viewsLastHour!)}</Text>
    //                 </View>
    //             ) : null}
    //             {hasReviewed ? (
    //                 <View style={styles.kvRow}>
    //                     <View style={styles.kvLabelWithIcon}>
    //                         <FontAwesomeIcon
    //                             icon={faClock}
    //                             size={14}
    //                             color={colors.textSecondary}
    //                         />
    //                         <Text style={styles.kvLabel}>Last reviewed</Text>
    //                     </View>
    //                     <Text style={styles.kvValue}>
    //                         {formatTimeToNow(c.lastReviewedTimeStamp as number)}
    //                     </Text>
    //                 </View>
    //             ) : null}
    //         </View>
    //     );
    // };

    const renderBrandProfileCard = () => (
        <View style={styles.card}>
            <Text style={styles.sidebarLabel}>BRAND PROFILE</Text>
            <View style={styles.brandProfileHeader}>
                <ImageComponent
                    url={c.logo ?? ""}
                    size="small"
                    altText={c.brandName}
                    shape="square"
                    style={styles.brandLogo}
                />
                <View style={styles.brandProfileTitleBlock}>
                    <View style={styles.brandNameRow}>
                        <Text style={styles.brandProfileName} numberOfLines={1}>
                            {c.brandName}
                        </Text>
                        {c.paymentVerified ? (
                            <FontAwesomeIcon
                                icon={faCheckCircle}
                                size={16}
                                color={colors.primary}
                            />
                        ) : null}
                    </View>
                    {(c.brandCategory?.length ?? 0) > 0 ? (
                        <View style={styles.chipWrap}>
                            {c.brandCategory?.slice(0, 1).map((cat, i) => (
                                <View style={styles.pill} key={`bcat-${i}`}>
                                    <Text style={styles.pillText}>{cat}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>
            </View>
            {/* {c.brandDescription?.trim() ? (
                <View style={styles.brandAboutWrap}>
                    <ReadMore
                        style={styles.brandAboutText}
                        text={c.brandDescription}
                        lineCount={3}
                        showReadMore={true}
                    />
                </View>
            ) : null} */}
            {/* {c.brandWebsite?.trim() ? (
                <Pressable
                    style={styles.websiteRow}
                    onPress={() => openExternalUrl(c.brandWebsite!)}
                    accessibilityRole="link"
                >
                    <FontAwesomeIcon
                        icon={faLink}
                        size={14}
                        color={colors.primary}
                    />
                    <Text style={styles.linkText} numberOfLines={1}>
                        {c.brandWebsite}
                    </Text>
                </Pressable>
            ) : null} */}
            <Button
                mode="outlined"
                onPress={() => setBrandModalVisible(true)}
                style={styles.contactButton}
                textColor={colors.text}
            >
                View full profile
            </Button>
        </View>
    );

    const renderMainColumn = () => (
        <View style={styles.leftColumn}>
            {renderDetailsCard()}
            {renderCampaignAndBudgetCard()}
            {renderContentAndChannelsCard()}
            {renderLocationDetailsCard()}
            {renderVideoAttachmentsCard()}
            {renderExternalLinksCard()}
            {renderQuestionsCard()}
            {renderInfluencerPreferencesCard()}
            {/* {renderActivityInsightsCard()} */}
            {renderReadyToLaunchCard()}
        </View>
    );

    const renderSidebar = () => (
        <View style={styles.rightColumn}>
            {renderPostedByCard()}
            {renderBrandProfileCard()}
            {renderAccountCard()}
            {renderProTipCard()}
        </View>
    );

    return (
        <IOScroll contentContainerStyle={styles.scrollContainer}>
            {xl ? (
                <View style={styles.twoColumnWrap}>
                    {renderMainColumn()}
                    {renderSidebar()}
                </View>
            ) : (
                <>
                    {renderMainColumn()}
                    {renderSidebar()}
                </>
            )}
            <Portal>
                <BrandModal
                    brand={{
                        category: props.collaboration.brandCategory,
                        description: props.collaboration.brandDescription,
                        image: props.collaboration.logo,
                        name: props.collaboration.brandName,
                        verified: props.collaboration.paymentVerified,
                        website: props.collaboration.brandWebsite,
                    }}
                    visible={brandModalVisible}
                    setVisibility={setBrandModalVisible}
                />
                <ManagerModal
                    managerEmail={managerDetails?.email ?? ""}
                    managerImage={managerDetails?.profileImage ?? ""}
                    managerName={managerDetails?.name ?? ""}
                    brandDescription={props.collaboration.brandDescription}
                    visible={managerModalVisible}
                    setVisibility={setManagerModalVisible}
                />
            </Portal>
        </IOScroll>
    );
};

const CARD_BORDER_RADIUS = 12;
const DESKTOP_GAP = 24;
const SIDEBAR_WIDTH_PCT = "30%";

function createStyles(
    colors: ReturnType<typeof Colors>,
    xl: boolean,
    _width: number
) {
    return StyleSheet.create({
        scrollContainer: {
            gap: DESKTOP_GAP,
            paddingBottom: 24,
            paddingHorizontal: xl ? 32 : 16,
        },
        twoColumnWrap: {
            flexDirection: "row",
            gap: DESKTOP_GAP,
            width: "100%",
            alignSelf: "center",
        },
        leftColumn: {
            flex: 1,
            minWidth: 0,
            gap: DESKTOP_GAP,
        },
        rightColumn: {
            width: xl ? SIDEBAR_WIDTH_PCT : "100%",
            minWidth: 0,
            gap: DESKTOP_GAP,
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: CARD_BORDER_RADIUS,
            padding: 20,
            shadowColor: colors.cardShadow ?? colors.transparent,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
        },
        campaignImagesGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
        },
        campaignImageItem: {
            flexBasis: "32%",
            maxWidth: "32%",
            borderRadius: CARD_BORDER_RADIUS,
            overflow: "hidden",
        },
        campaignImage: {
            width: "100%",
            aspectRatio: 4 / 3,
            borderRadius: CARD_BORDER_RADIUS,
        },
        campaignImagesScrollContent: {
            paddingVertical: 4,
            paddingRight: 4,
        },
        campaignImagesRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        campaignImageItemHorizontal: {
            width: 140,
            borderRadius: CARD_BORDER_RADIUS,
            overflow: "hidden",
        },
        campaignImageHorizontal: {
            width: "100%",
            aspectRatio: 4 / 3,
            borderRadius: CARD_BORDER_RADIUS,
        },
        detailsHeaderRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
        },
        title: {
            fontWeight: "bold",
            fontSize: 22,
            color: colors.text,
            flex: 1,
        },
        timestamp: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        pillsRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
        },
        pill: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: colors.tag ?? colors.gray200,
        },
        pillText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.tagForeground ?? colors.text,
        },
        descriptionWrap: {
            width: "100%",
            marginBottom: 16,
        },
        description: {
            fontSize: 14,
            color: colors.text,
            lineHeight: 22,
        },
        metricsRow: {
            flexDirection: "row",
            alignItems: "center",
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.outline,
            paddingTop: 16,
        },
        metricBlock: {
            flex: 1,
            alignItems: "center",
            gap: 4,
        },
        metricDivider: {
            width: StyleSheet.hairlineWidth,
            alignSelf: "stretch",
            backgroundColor: colors.outline,
        },
        metricLabel: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        metricValue: {
            fontSize: 18,
            fontWeight: "bold",
            color: colors.text,
        },
        readyToLaunchContent: {
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 24,
            gap: 12,
        },
        readyToLaunchTitle: {
            fontSize: 18,
            fontWeight: "bold",
            color: colors.text,
        },
        readyToLaunchSubtext: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: "center",
            lineHeight: 22,
        },
        readyToLaunchActions: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            paddingTop: 8,
            width: xl ? undefined : "100%",
        },
        draftActionButton: {
            backgroundColor: colors.background,
            borderWidth: 0.3,
            borderColor: colors.outline,
            borderRadius: 16,
            paddingVertical: 4,
            paddingHorizontal: 10,
            minHeight: 32,
            ...(xl ? {} : { flex: 1 }),
        },
        publishActionButton: {
            borderRadius: 16,
            paddingVertical: 4,
            paddingHorizontal: 10,
            minHeight: 32,
            ...(xl ? {} : { flex: 1 }),
        },
        sidebarLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textSecondary,
            letterSpacing: 0.5,
            marginBottom: 12,
        },
        managerRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
        },
        managerAvatar: {
            width: 44,
            height: 44,
            borderRadius: 22,
        },
        managerInfo: {
            flex: 1,
            minWidth: 0,
            gap: 2,
        },
        managerName: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.text,
        },
        managerRole: {
            fontSize: 13,
            color: colors.textSecondary,
        },
        managerBrand: {
            fontSize: 13,
            color: colors.textSecondary,
        },
        contactButton: {
            borderColor: colors.outline,
            borderWidth: StyleSheet.hairlineWidth,
        },
        accountHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
        },
        accountBrandName: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.text,
            flex: 1,
        },
        accountStatRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 8,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.outline,
        },
        accountStatLabel: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        accountStatValue: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },
        proTipHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
        },
        proTipTitle: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.text,
        },
        proTipText: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 22,
        },
        sectionLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textSecondary,
            letterSpacing: 0.5,
            marginBottom: 12,
        },
        sectionTitleRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
        },
        sectionTitleRowLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textSecondary,
            letterSpacing: 0.5,
            flex: 1,
        },
        chipWrap: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        kvRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            paddingVertical: 8,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.outline,
        },
        kvLabel: {
            fontSize: 14,
            color: colors.textSecondary,
            flexShrink: 0,
            maxWidth: "48%",
        },
        kvLabelWithIcon: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
            maxWidth: "48%",
        },
        kvValue: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
            flex: 1,
            textAlign: "right",
        },
        kvMuted: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        linkText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.primary,
            textDecorationLine: "underline",
        },
        linkRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 10,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.outline,
        },
        linkRowText: {
            fontSize: 14,
            color: colors.text,
            flex: 1,
        },
        questionBlock: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
            paddingVertical: 8,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.outline,
        },
        questionIndex: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.textSecondary,
            minWidth: 22,
        },
        questionText: {
            fontSize: 14,
            color: colors.text,
            lineHeight: 22,
            flex: 1,
        },
        productRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            paddingVertical: 8,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.outline,
        },
        brandProfileHeader: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 12,
        },
        brandLogo: {
            width: 56,
            height: 56,
            borderRadius: 8,
        },
        brandProfileTitleBlock: {
            flex: 1,
            minWidth: 0,
            gap: 8,
        },
        brandNameRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        brandProfileName: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.text,
            flex: 1,
        },
        brandAboutWrap: {
            marginBottom: 12,
        },
        brandAboutText: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 22,
        },
        websiteRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
        },
        contentChannelList: {
            width: "100%",
        },
        contentChannelRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 14,
            paddingVertical: 14,
        },
        contentChannelRowBordered: {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.outline,
            paddingTop: 16,
        },
        contentChannelIconWrap: {
            width: 40,
            height: 40,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag ?? colors.gray200,
            flexShrink: 0,
        },
        contentChannelBody: {
            flex: 1,
            minWidth: 0,
            gap: 6,
        },
        contentChannelTitle: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textSecondary,
            letterSpacing: 0.5,
            textTransform: "uppercase",
        },
        contentChannelValueText: {
            fontSize: 15,
            lineHeight: 22,
            fontWeight: "500",
            color: colors.text,
        },
    });
}

export default OverviewTabContent;
