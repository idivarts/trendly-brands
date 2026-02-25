import ChipCard from "@/components/collaboration-card/card-components/ChipComponent";
import Button from "@/components/ui/button";
import ViewCollaborationMap from "@/components/view-collaboration/ViewCollaborationMap";
import Colors from "@/shared-uis/constants/Colors";
import { CURRENCY } from "@/constants/Unit";
import { useContractContext } from "@/contexts";
import { useBreakpoints } from "@/hooks";
import { IOScroll } from "@/shared-libs/contexts/scroll-context";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Carousel from "@/shared-uis/components/carousel/carousel";
import ImageComponent from "@/shared-uis/components/image-component";
import RatingSection from "@/shared-uis/components/rating-section";
import ReadMore from "@/shared-uis/components/ReadMore";
import { convertToMUnits } from "@/shared-uis/utils/conversion-million";
import { stylesFn } from "@/styles/CollaborationDetails.styles";
import { Contract } from "@/types/Contract";
import { processRawAttachment } from "@/utils/attachments";
import { formatTimeToNow } from "@/utils/date";
import { truncateText } from "@/utils/text";
import { convertToKUnits } from "@/utils/conversion";
import {
    faFacebook,
    faInstagram,
    faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import {
    faCheckCircle,
    faDollarSign,
    faFilm,
    faHouseLaptop,
    faLocationDot,
    faPanorama,
    faRecordVinyl,
    faStarHalfStroke,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Card, Portal, Text } from "react-native-paper";
import { CollaborationDetail } from ".";
import BrandModal from "./modal/BrandModal";
import ManagerModal from "./modal/ManagerModal";

interface CollaborationDetailsContentProps {
    collaboration: CollaborationDetail;
}

const OverviewTabContent = (props: CollaborationDetailsContentProps) => {
    const theme = useTheme();
    const stylesFromFn = stylesFn(theme);
    const s = useMemo(() => useLocalStyles(theme), [theme]);
    const [status, setStatus] = React.useState("pending");
    const [managerDetails, setManagerDetails] = React.useState<any>();
    const [brandModalVisible, setBrandModalVisible] = useState(false);
    const [managerModalVisible, setManagerModalVisible] = useState(false);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [applicationCount, setApplicationCount] = useState(0)
    const [invitationCount, setInvitationCount] = useState(0)
    const { xl } = useBreakpoints();

    const { getContractsByCollaborationId } = useContractContext();
    const formatBudgetValue = (value?: number) => {
        if (value == null) {
            return "-";
        }
        const millionValue = convertToMUnits(value);
        if (typeof millionValue === "number") {
            return convertToKUnits(millionValue);
        }
        return millionValue;
    };

    const fetchManagerDetails = async () => {
        if (!props.collaboration.managerId) {
            return;
        }
        if (!props.collaboration.brandId) {
            return;
        }
        const managerRef = doc(
            FirestoreDB,
            "managers",
            props.collaboration.managerId
        );
        const managerDoc = await getDoc(managerRef);

        const managerBrandref = doc(
            FirestoreDB,
            "brands",
            props.collaboration.brandId,
            "members",
            props.collaboration.managerId
        );

        const managerBrandDoc = await getDoc(managerBrandref);

        const managerData = managerDoc.data() as IManagers;
        const managerBrandData = managerBrandDoc.data();

        setManagerDetails({
            name: managerData.name,
            email: managerData.email,
            profileImage: managerData.profileImage,
            role: managerBrandData?.role,
        });
    };

    const fetchCollaboration = async () => {
        if (!props.collaboration.id) {
            return;
        }
        const fetchedContracts = await getContractsByCollaborationId(
            props.collaboration.id
        );
        setContracts(fetchedContracts);

        getDocs(collection(FirestoreDB, "collaborations", props.collaboration.id, "applications")).then(applications => {
            const applicationCount = applications.size
            setApplicationCount(applicationCount)
        })
        getDocs(collection(FirestoreDB, "collaborations", props.collaboration.id, "invitations")).then(invites => {
            const inviteCount = invites.size
            setInvitationCount(inviteCount)
        })

    };

    const getFeedbacks = (contract: Contract[]) => {
        let feedbacks: {
            ratings?: number;
            review?: string;
        }[] = [];

        contract.forEach((contract) => {
            if (contract.feedbackFromInfluencer) {
                feedbacks.push({
                    ratings: contract.feedbackFromInfluencer.ratings,
                    review: contract.feedbackFromInfluencer.feedbackReview,
                });
            }

            if (contract.feedbackFromBrand) {
                feedbacks.push({
                    ratings: contract.feedbackFromBrand.ratings,
                    review: contract.feedbackFromBrand.feedbackReview,
                });
            }
        });

        return feedbacks;
    };

    useEffect(() => {
        fetchManagerDetails();
    }, []);

    useEffect(() => {
        fetchCollaboration();
    }, []);

    return (
        <IOScroll contentContainerStyle={stylesFromFn.scrollContainer}>
            <View style={[stylesFromFn.profileCard, s.profileCardCenter]}>
                {props?.collaboration?.attachments &&
                    props?.collaboration?.attachments.length > 0 && (
                        // !xl ? 
                        <Carousel
                            theme={theme}
                            data={
                                props?.collaboration?.attachments?.map((attachment) =>
                                    processRawAttachment(attachment)
                                ) || []
                            }
                        />
                        // :<ScrollMedia
                        //     MAX_WIDTH_WEB={"100%"}
                        //     media={
                        //       props?.collaboration?.attachments?.map((attachment) =>
                        //         processRawAttachment(attachment)
                        //       ) || []
                        //     }
                        //     xl={xl}
                        //     mediaRes={{
                        //       height: 200,
                        //       width: 200,
                        //     }}
                        //     theme={theme} />
                    )}
                <Card.Content style={stylesFromFn.profileContent}>
                    <View style={s.columnFull}>
                        <View style={s.rowBetween}>
                            <Text variant="headlineMedium" style={stylesFromFn.name}>
                                {props.collaboration.name}
                            </Text>
                            {props.collaboration.timeStamp ? (
                                <Text style={s.timeText}>
                                    {formatTimeToNow(props.collaboration.timeStamp)}
                                </Text>
                            ) : null}
                        </View>
                        <View style={s.fullWidth}>
                            <ReadMore style={stylesFromFn.shortDescription} text={props.collaboration.description || ""} />
                        </View>
                    </View>

                    <View style={s.statsCard}>
                        <Card.Content>
                            <RatingSection feedbacks={getFeedbacks(contracts)} />
                            <View style={s.gapColumn}                            >
                                <View style={s.brandRow}>
                                    <ImageComponent
                                        url={props.collaboration.logo}
                                        altText="Brand Logo"
                                        shape="square"
                                        size="small"
                                        style={s.brandLogo}
                                    />
                                    <View style={s.flex1}>
                                        <Text style={s.boldText}>
                                            {props.collaboration.brandName}{" "}
                                            {props.collaboration.paymentVerified && (
                                                <FontAwesomeIcon
                                                    icon={faCheckCircle}
                                                    color={Colors(theme).primary}
                                                />
                                            )}
                                        </Text>
                                        <Text style={s.descriptionText}>
                                            {truncateText(props.collaboration.brandDescription, 60)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Card.Content>
                    </View>

                    {props.collaboration?.externalLinks &&
                        props.collaboration?.externalLinks.length > 0 && (
                            <View style={s.linksRow}>
                                {props.collaboration?.externalLinks?.map((item, index) => (
                                    <Button
                                        key={index}
                                        mode="contained"
                                        style={s.linkButton}
                                        buttonColor={Colors(theme).background}
                                        textColor={Colors(theme).primary}
                                        onPress={() => {
                                            Linking.openURL(item.link);
                                        }}
                                    >
                                        {item.name}
                                    </Button>
                                ))}
                            </View>
                        )}

                    <View style={s.statsBlock}>
                        <Text style={s.bodyText}>
                            Influencer Needed: {props.collaboration.numberOfInfluencersNeeded}
                        </Text>
                        <Text style={s.bodyText}>
                            Influencer Applied: {applicationCount}
                        </Text>
                        <Text style={s.bodyText}>
                            Invitations Sent: {invitationCount}
                        </Text>
                        {props.collaboration.promotionType ===
                            PromotionType.PAID_COLLAB && (
                                <Text style={s.bodyText}>
                                    Budget: {props.collaboration?.budget?.min ===
                                        props.collaboration?.budget?.max
                                        ? `${CURRENCY}. ${formatBudgetValue(props.collaboration?.budget?.min)}`
                                        : `${CURRENCY}. ${formatBudgetValue(props.collaboration?.budget?.min)} - ${CURRENCY}. ${formatBudgetValue(props.collaboration?.budget?.max)}`}
                                </Text>
                            )}
                    </View>
                    <View style={s.chipsRow}>
                        <ChipCard
                            chipText={
                                props.collaboration.promotionType === PromotionType.PAID_COLLAB
                                    ? "Paid"
                                    : "Unpaid"
                            }
                            chipIcon={faDollarSign}
                        />
                        <ChipCard
                            chipText={props.collaboration.location.type}
                            chipIcon={
                                props.collaboration.location.type === "On-Site"
                                    ? faLocationDot
                                    : faHouseLaptop
                            }
                        />
                        {props.collaboration.platform &&
                            props.collaboration.platform.map((content, index) => (
                                <ChipCard
                                    key={index}
                                    chipText={content}
                                    chipIcon={
                                        content === "Instagram"
                                            ? faInstagram
                                            : content === "Facebook"
                                                ? faFacebook
                                                : content === "Youtube"
                                                    ? faYoutube
                                                    : faInstagram
                                    }
                                />
                            ))}
                        {props.collaboration.contentFormat &&
                            props.collaboration.contentFormat.map((content, index) => (
                                <ChipCard
                                    key={index}
                                    chipText={content}
                                    chipIcon={
                                        content === "Posts"
                                            ? faPanorama
                                            : content === "Reels"
                                                ? faFilm
                                                : content === "Stories"
                                                    ? faHeart
                                                    : content === "Live"
                                                        ? faRecordVinyl
                                                        : content === "Product Reviews"
                                                            ? faStarHalfStroke
                                                            : faPanorama
                                    }
                                />
                            ))}
                    </View>

                    {props.collaboration.location.type === "On-Site" && (
                        <View style={s.fullWidth}>
                            <Text style={s.sectionTitle}>
                                Location
                            </Text>
                            <ViewCollaborationMap
                                mapRegion={{
                                    latitude: props.collaboration?.location?.latlong?.lat,
                                    longitude: props.collaboration?.location?.latlong?.long,
                                    latitudeDelta: 0.0922,
                                    longitudeDelta: 0.042,
                                }}
                                onMapRegionChange={(region) => { }}
                                onFormattedAddressChange={(address) => { }}
                            />
                            <Text style={s.bodyText}>
                                {props.collaboration.location.name}
                            </Text>
                        </View>
                    )}
                    {props?.collaboration?.questionsToInfluencers &&
                        props?.collaboration?.questionsToInfluencers.length > 0 && (
                            <View style={s.questionsBlock}>
                                <Text style={s.sectionTitle}>
                                    Questions asked on application
                                </Text>

                                {props?.collaboration?.questionsToInfluencers?.map(
                                    (question, index) => (
                                        <Text
                                            key={index}
                                            style={s.bodyText}
                                        >
                                            {question}
                                        </Text>
                                    )
                                )}
                            </View>
                        )}
                    <View style={s.postedByBlock}>
                        <Text style={s.sectionTitle}>
                            Posted by
                        </Text>
                        <View>
                            <View style={s.managerRow}>
                                <ImageComponent
                                    url={managerDetails?.profileImage}
                                    size="small"
                                    altText="Manager Profile Image"
                                    initials={managerDetails?.name}
                                    initialsSize={16}
                                    style={s.managerAvatar}
                                />
                                <View style={s.managerInfo}>
                                    <Text style={s.boldText}>
                                        {managerDetails?.name}
                                    </Text>
                                    <Text style={s.grayText}>
                                        {managerDetails?.role} - {props.collaboration.brandName}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </Card.Content>
            </View>
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
                    managerEmail={managerDetails?.email}
                    managerImage={managerDetails?.profileImage}
                    managerName={managerDetails?.name}
                    brandDescription={props.collaboration.brandDescription}
                    visible={managerModalVisible}
                    setVisibility={setManagerModalVisible}
                />
            </Portal>
        </IOScroll>
    );
};

function useLocalStyles(theme: ReturnType<typeof useTheme>) {
    return StyleSheet.create({
        profileCardCenter: {
            alignItems: "center",
        },
        columnFull: {
            display: "flex",
            flexDirection: "column",
            width: "100%",
        },
        rowBetween: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            gap: 8,
            alignItems: "center",
        },
        timeText: {
            fontSize: 12,
            color: Colors(theme).text,
            paddingRight: 8,
        },
        fullWidth: {
            width: "100%",
        },
        statsCard: {
            width: "100%",
            borderWidth: 0.3,
            paddingVertical: 16,
            borderRadius: 10,
            borderColor: Colors(theme).gray300,
        },
        gapColumn: {
            flex: 1,
            flexDirection: "column",
            gap: 16,
        },
        brandRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flexGrow: 1,
        },
        brandLogo: {
            width: 40,
            height: 40,
            borderRadius: 5,
        },
        flex1: {
            flex: 1,
        },
        boldText: {
            fontSize: 16,
            fontWeight: "bold",
            color: Colors(theme).text,
        },
        descriptionText: {
            fontSize: 16,
            flexWrap: "wrap",
            overflow: "hidden",
            color: Colors(theme).text,
            lineHeight: 22,
        },
        linksRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "space-between",
        },
        linkButton: {
            flexBasis: 1,
            flexGrow: 1,
            borderColor: Colors(theme).primary,
            borderWidth: 0.3,
        },
        statsBlock: {
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 8,
            borderWidth: 0.3,
            borderRadius: 10,
            padding: 16,
        },
        bodyText: {
            fontSize: 16,
            color: Colors(theme).text,
        },
        chipsRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            width: "100%",
            rowGap: 10,
        },
        sectionTitle: {
            fontSize: 16,
            color: Colors(theme).text,
            fontWeight: "bold",
            marginBottom: 16,
        },
        questionsBlock: {
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 8,
            borderWidth: 0.3,
            borderRadius: 10,
            padding: 16,
        },
        postedByBlock: {
            width: "100%",
            gap: 16,
        },
        managerRow: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        managerAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
        },
        managerInfo: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 2,
        },
        grayText: {
            fontSize: 16,
            color: Colors(theme).gray100,
        },
    });
}

export default OverviewTabContent;
