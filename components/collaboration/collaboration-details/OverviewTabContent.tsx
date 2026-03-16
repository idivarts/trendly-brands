import Button from "@/components/ui/button";
import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { IOScroll } from "@/shared-libs/contexts/scroll-context";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import ImageComponent from "@/shared-uis/components/image-component";
import ReadMore from "@/shared-uis/components/ReadMore";
import { formatTimeToNow } from "@/utils/date";
import {
    faBuilding,
    faBullhorn,
    faCircleInfo,
    faDollarSign,
    faEnvelope,
    faHouseLaptop,
    faLocationDot,
    faPaperPlane,
    faUser,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Portal, Text } from "react-native-paper";
import { CollaborationDetail } from ".";
import BrandModal from "./modal/BrandModal";
import ManagerModal from "./modal/ManagerModal";

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

    const paymentLabel =
        props.collaboration.promotionType === PromotionType.PAID_COLLAB ? "Paid" : "Unpaid";
    const locationLabel = props.collaboration.location?.type ?? "Remote";
    const locationIcon =
        locationLabel === "On-Site" ? faLocationDot : faHouseLaptop;

    const primaryAttachment = props.collaboration.attachments?.find(
        (attachment) =>
            attachment.type === "image" &&
            (attachment.imageUrl || attachment.appleUrl || attachment.playUrl)
    );

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
                        icon={locationIcon}
                        size={12}
                        color={colors.text}
                    />
                    <Text style={styles.pillText}>{locationLabel}</Text>
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
                    <Text style={styles.managerRole}>Manager</Text>
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

    const renderMainColumn = () => (
        <View style={styles.leftColumn}>
            {renderDetailsCard()}
            {renderReadyToLaunchCard()}
        </View>
    );

    const renderSidebar = () => (
        <View style={styles.rightColumn}>
            {renderPostedByCard()}
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
    });
}

export default OverviewTabContent;
