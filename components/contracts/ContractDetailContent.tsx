import UserResponse from "@/components/contract-card/UserResponse";
import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import {
    IApplications,
    ICollaboration,
} from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import Carousel from "@/shared-uis/components/carousel/carousel";
import RenderMediaItem from "@/shared-uis/components/carousel/render-media-item";
import ImageComponent from "@/shared-uis/components/image-component";
import { Text } from "@/shared-uis/components/theme/Themed";
import { truncateText } from "@/shared-uis/utils/text";
import { stylesFn } from "@/styles/CollaborationDetails.styles";
import { processRawAttachment } from "@/utils/attachments";
import { formatTimeToNow } from "@/utils/date";
import { CURRENCY } from "@/constants/Unit";
import { faArrowRight, faVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Card } from "react-native-paper";
import ActionContainer from "./ActionContainer";
import AddMembersModal from "./AddMemberModal";
import BrandFeedbackModal from "./BrandFeedbackModal";
import MemberContainer from "./MemberContainer";

interface CollaborationDetailsContentProps {
    collaborationDetail: ICollaboration;
    applicationData?: IApplications;
    userData: IUsers;
    contractData: IContracts;
    refreshData: () => void;
    /** Dev only: override contract status for UI testing */
    devOverrideStatus?: number | null;
}

const CONTENT_MAX_WIDTH = 720;
const DESKTOP_HORIZONTAL_PADDING = 32;
const MEDIA_CARD_SIZE = 280;

const ContractDetailsContent = (props: CollaborationDetailsContentProps) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const baseStyles = stylesFn(theme);
    const styles = useMemo(
        () => createStyles(colors, xl, width),
        [colors, xl, width]
    );
    const [membersInContract, setMembersInContract] = useState<any[]>([]);
    const [addMemberModal, setAddMemberModal] = useState(false);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [updateMemberContainer, setUpdateMemberContainer] = useState(0);

    const attachments =
        props?.applicationData?.attachments?.map((a) =>
            processRawAttachment(a)
        ) ?? [];
    const firstAttachment = attachments[0];
    const tagline =
        props.userData.profile?.content?.socialMediaHighlight ||
        (props.userData.profile?.content?.about
            ? truncateText(
                  props.userData.profile.content.about as string,
                  60
              ).split("\n")[0]
            : null) ||
        "—";
    const nicheDisplay =
        props.userData.profile?.category?.length &&
        Array.isArray(props.userData.profile.category)
            ? props.userData.profile.category.join(" & ")
            : "—";

    const renderMediaSection = () => {
        if (!attachments.length) return null;
        if (xl) {
            return (
                <View style={styles.mediaRow}>
                    <View style={styles.mediaCard}>
                        <RenderMediaItem
                            item={firstAttachment}
                            index={0}
                            height={MEDIA_CARD_SIZE}
                            width={MEDIA_CARD_SIZE}
                            handleImagePress={() => {}}
                        />
                    </View>
                    <View style={[styles.mediaCard, styles.profileImageCard]}>
                        <View style={styles.profileImageWrap}>
                            <ImageComponent
                                url={props.userData.profileImage || ""}
                                altText={props.userData.name}
                                initials={props.userData.name}
                                shape="square"
                                size="large"
                                style={styles.profileImage}
                            />
                        </View>
                    </View>
                </View>
            );
        }
        return (
            <View style={styles.mediaWrap}>
                <Carousel theme={theme} data={attachments} />
            </View>
        );
    };

    const renderLeftColumn = () => (
        <View style={styles.leftColumn}>
            {renderMediaSection()}
            <View style={styles.profileBlock}>
                <View style={styles.headerRow}>
                    <Text style={baseStyles.name}>{props.userData.name}</Text>
                    {props.collaborationDetail.timeStamp ? (
                        <View style={styles.timestampPill}>
                            <Text style={styles.timestampText}>
                                {formatTimeToNow(
                                    props.collaborationDetail.timeStamp
                                )}
                            </Text>
                        </View>
                    ) : null}
                </View>
                <View style={styles.taglineRow}>
                    <View style={styles.taglineIconWrap}>
                        <FontAwesomeIcon
                            icon={faVideo}
                            size={14}
                            color={colors.gray100}
                        />
                    </View>
                    <Text style={styles.taglineText}>{tagline}</Text>
                </View>
                <Text style={styles.aboutText}>
                    {truncateText(
                        (props.userData.profile?.content?.about as string) || "",
                        160
                    )}
                </Text>
            </View>

            {xl ? (
                <ActionContainer
                    contract={props.contractData}
                    refreshData={props.refreshData}
                    feedbackModalVisible={() =>
                        setFeedbackModalVisible(true)
                    }
                    userData={props.userData}
                    collaborationData={props.collaborationDetail}
                    paymentStatus={props.contractData.payment?.status}
                    slot="buttons"
                    devOverrideStatus={props.devOverrideStatus}
                />
            ) : null}

            {props.applicationData && (
                <View style={styles.applicationDetailsSection}>
                    <Text style={styles.sectionLabel}>
                        APPLICATION DETAILS
                    </Text>
                    <View style={styles.nicheQuoteRow}>
                        <View style={styles.fieldCard}>
                            <Text style={styles.fieldLabel}>Niche</Text>
                            <Text style={styles.fieldValue}>{nicheDisplay}</Text>
                        </View>
                        <View style={styles.fieldCard}>
                            <Text style={styles.fieldLabel}>Quote</Text>
                            <Text style={styles.quoteValue}>
                                {CURRENCY}.{" "}
                                {props.applicationData.quotation ?? "—"}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            <UserResponse
                application={props.applicationData}
                influencerQuestions={
                    props?.collaborationDetail?.questionsToInfluencers
                }
                setConfirmationModalVisible={() => {}}
            />

            <Pressable
                style={styles.activeCampaignCard}
                onPress={() => {
                    router.push(
                        `/collaboration-details/${props.contractData.collaborationId}`
                    );
                }}
            >
                <View style={styles.activeCampaignHeader}>
                    <View style={styles.activeTag}>
                        <Text style={styles.activeTagText}>
                            ACTIVE CAMPAIGN
                        </Text>
                    </View>
                    <FontAwesomeIcon
                        icon={faArrowRight}
                        size={20}
                        color={colors.text}
                    />
                </View>
                <Text style={styles.collaborationTitle}>
                    {props.collaborationDetail.name}
                </Text>
                <Text style={styles.collaborationDescription}>
                    {truncateText(
                        props.collaborationDetail.description || "",
                        120
                    )}
                </Text>
            </Pressable>
        </View>
    );

    const renderRightColumn = () => (
        <View style={styles.rightColumn}>
            <MemberContainer
                //@ts-ignore
                channelId={props.contractData.streamChannelId}
                setMembersFromBrand={setMembersInContract}
                setShowModal={() => setAddMemberModal(true)}
                key={updateMemberContainer}
                updateMemberContainer={updateMemberContainer}
                title="Contract Members"
            />
            <ActionContainer
                contract={props.contractData}
                refreshData={props.refreshData}
                feedbackModalVisible={() =>
                    setFeedbackModalVisible(true)
                }
                userData={props.userData}
                collaborationData={props.collaborationDetail}
                paymentStatus={props.contractData.payment?.status}
                slot="feedback-and-info"
                devOverrideStatus={props.devOverrideStatus}
            />
        </View>
    );

    const renderSingleColumn = () => (
        <View style={baseStyles.profileCard}>
            {renderMediaSection()}
            <Card.Content style={baseStyles.profileContent}>
                <View style={styles.profileBlock}>
                    <View style={styles.headerRow}>
                        <Text style={baseStyles.name}>
                            {props.userData.name}
                        </Text>
                        {props.collaborationDetail.timeStamp ? (
                            <Text style={styles.timestampText}>
                                {formatTimeToNow(
                                    props.collaborationDetail.timeStamp
                                )}
                            </Text>
                        ) : null}
                    </View>
                    <Text style={styles.aboutText}>
                        {truncateText(
                            (props.userData.profile?.content
                                ?.about as string) || "",
                            160
                        )}
                    </Text>
                </View>

                <ActionContainer
                    contract={props.contractData}
                    refreshData={props.refreshData}
                    feedbackModalVisible={() =>
                        setFeedbackModalVisible(true)
                    }
                    userData={props.userData}
                    collaborationData={props.collaborationDetail}
                    paymentStatus={props.contractData.payment?.status}
                    devOverrideStatus={props.devOverrideStatus}
                />

                <MemberContainer
                    //@ts-ignore
                    channelId={props.contractData.streamChannelId}
                    setMembersFromBrand={setMembersInContract}
                    setShowModal={() => setAddMemberModal(true)}
                    key={updateMemberContainer}
                    updateMemberContainer={updateMemberContainer}
                />

                <UserResponse
                    application={props.applicationData}
                    influencerQuestions={
                        props?.collaborationDetail?.questionsToInfluencers
                    }
                    setConfirmationModalVisible={() => {}}
                />
                <Pressable
                    style={styles.activeCampaignCard}
                    onPress={() => {
                        router.push(
                            `/collaboration-details/${props.contractData.collaborationId}`
                        );
                    }}
                >
                    <View style={styles.activeCampaignHeader}>
                        <View style={styles.activeTag}>
                            <Text style={styles.activeTagText}>
                                ACTIVE CAMPAIGN
                            </Text>
                        </View>
                        <FontAwesomeIcon
                            icon={faArrowRight}
                            size={20}
                            color={colors.text}
                        />
                    </View>
                    <Text style={styles.collaborationTitle}>
                        {props.collaborationDetail.name}
                    </Text>
                    <Text style={styles.collaborationDescription}>
                        {truncateText(
                            props.collaborationDetail.description || "",
                            120
                        )}
                    </Text>
                </Pressable>
            </Card.Content>
        </View>
    );

    return (
        <ScrollView
            contentContainerStyle={[
                baseStyles.scrollContainer,
                styles.scrollContainer,
            ]}
            showsVerticalScrollIndicator={false}
        >
            {xl ? (
                <View style={styles.twoColumnWrap}>
                    {renderLeftColumn()}
                    {renderRightColumn()}
                </View>
            ) : (
                renderSingleColumn()
            )}
            <AddMembersModal
                onDismiss={() => setAddMemberModal(false)}
                visible={addMemberModal}
                membersAlreadyInContract={membersInContract}
                channelId={props.contractData.streamChannelId}
                refreshData={props.refreshData}
                updateMemberContainer={() =>
                    setUpdateMemberContainer((prev) => prev + 1)
                }
            />
            <BrandFeedbackModal
                visible={feedbackModalVisible}
                onClose={() => setFeedbackModalVisible(false)}
                initialRating={props.contractData.feedbackFromBrand?.ratings || 0}
                contractId={props.contractData.streamChannelId}
                refreshData={props.refreshData}
            />
        </ScrollView>
    );
};

function createStyles(
    colors: ReturnType<typeof Colors>,
    xl: boolean,
    width: number
) {
    const contentMaxWidth = xl
        ? Math.min(
              width - DESKTOP_HORIZONTAL_PADDING * 2,
              CONTENT_MAX_WIDTH
          )
        : undefined;
    return StyleSheet.create({
        scrollContainer: {
            ...(xl && {
                paddingHorizontal: DESKTOP_HORIZONTAL_PADDING,
                alignItems: "center",
            }),
        },
        twoColumnWrap: {
            flexDirection: "row",
            gap: 24,
            width: "100%",
            maxWidth: contentMaxWidth
                ? contentMaxWidth + 24 + Math.floor((contentMaxWidth ?? 0) * 0.4)
                : undefined,
            alignSelf: "center",
        },
        leftColumn: {
            flex: 1,
            minWidth: 0,
            maxWidth: xl ? CONTENT_MAX_WIDTH : undefined,
            gap: 16,
        },
        rightColumn: {
            width: xl ? "35%" : "100%",
            minWidth: 0,
            gap: 16,
        },
        mediaRow: {
            flexDirection: "row",
            gap: 16,
            alignSelf: "flex-start",
        },
        mediaCard: {
            width: MEDIA_CARD_SIZE,
            height: MEDIA_CARD_SIZE,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: colors.gray200,
        },
        profileImageCard: {
            backgroundColor: colors.gray200,
        },
        profileImageWrap: {
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
        },
        profileImage: {
            width: MEDIA_CARD_SIZE,
            height: MEDIA_CARD_SIZE,
            borderRadius: 12,
        } as const,
        mediaWrap: {
            alignSelf: "center",
        },
        profileBlock: {
            width: "100%",
        },
        headerRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
        },
        timestampPill: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: colors.gray200,
        },
        timestampText: {
            fontSize: 12,
            color: colors.gray100,
        },
        taglineRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
        },
        taglineIconWrap: { marginTop: 2 },
        taglineText: {
            fontSize: 14,
            color: colors.gray100,
        },
        aboutText: {
            color: colors.text,
            fontSize: 16,
            lineHeight: 22,
            marginTop: 8,
        },
        applicationDetailsSection: {
            width: "100%",
            gap: 12,
        },
        sectionLabel: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.gray100,
            letterSpacing: 0.5,
        },
        nicheQuoteRow: {
            flexDirection: xl ? "row" : "column",
            gap: 12,
        },
        fieldCard: {
            flex: 1,
            minWidth: 0,
            backgroundColor: colors.gray200,
            borderRadius: 8,
            padding: 12,
        },
        fieldLabel: {
            fontSize: 12,
            color: colors.gray100,
            marginBottom: 4,
        },
        fieldValue: {
            fontSize: 16,
            color: colors.text,
        },
        quoteValue: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.text,
        },
        activeCampaignCard: {
            width: "100%",
            borderWidth: 0.3,
            borderColor: colors.gray300,
            padding: 16,
            borderRadius: 10,
            gap: 10,
            backgroundColor: colors.card,
        },
        activeCampaignHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        activeTag: {
            backgroundColor: colors.green,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        },
        activeTagText: {
            fontSize: 11,
            fontWeight: "700",
            color: colors.white,
            letterSpacing: 0.3,
        },
        collaborationTitle: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.text,
        },
        collaborationDescription: {
            fontSize: 14,
            color: colors.gray100,
            lineHeight: 20,
        },
    });
}

export default ContractDetailsContent;
