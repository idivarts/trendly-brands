import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable, Linking } from "react-native";
import { Text, Card, Portal } from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import { stylesFn } from "@/styles/CollaborationDetails.styles";
import { FirestoreDB } from "@/utils/firestore";
import { doc, getDoc } from "firebase/firestore";
import { CollaborationDetail } from ".";
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
import Colors from "@/constants/Colors";
import Carousel from "@/shared-uis/components/carousel/carousel";
import { processRawAttachment } from "@/utils/attachments";
import { truncateText } from "@/utils/text";
import ChipCard from "@/components/collaboration-card/card-components/ChipComponent";
import {
  faFacebook,
  faInstagram,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import BrandModal from "./modal/BrandModal";
import ManagerModal from "./modal/ManagerModal";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import ViewCollaborationMap from "@/components/view-collaboration/ViewCollaborationMap";
import ImageComponent from "@/shared-uis/components/image-component";
import { formatTimeToNow } from "@/utils/date";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { Contract } from "@/types/Contract";
import RatingSection from "@/shared-uis/components/rating-section";
import { useContractContext } from "@/contexts";
import Button from "@/components/ui/button";

interface CollaborationDetailsContentProps {
  collaboration: CollaborationDetail;
}

const OverviewTabContent = (props: CollaborationDetailsContentProps) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [status, setStatus] = React.useState("pending");
  const [managerDetails, setManagerDetails] = React.useState<any>();
  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [managerModalVisible, setManagerModalVisible] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);

  const { getContractsByCollaborationId } = useContractContext();

  const fetchManagerDetails = async () => {
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

  const fetchContracts = async () => {
    const fetchedContracts = await getContractsByCollaborationId(
      props.collaboration.id
    );

    setContracts(fetchedContracts);
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
    fetchContracts();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Collaboration Details */}
      <View style={styles.profileCard}>
        {props?.collaboration?.attachments &&
          props?.collaboration?.attachments.length > 0 && (
            <Carousel
              theme={theme}
              data={
                props?.collaboration?.attachments?.map((attachment) =>
                  processRawAttachment(attachment)
                ) || []
              }
            />
          )}
        <Card.Content style={styles.profileContent}>
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
            }}
          >
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Text variant="headlineMedium" style={styles.name}>
                {props.collaboration.name}
              </Text>
              {props.collaboration.timeStamp ? (
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors(theme).text,
                    paddingRight: 8,
                  }}
                >
                  {formatTimeToNow(props.collaboration.timeStamp)}
                </Text>
              ) : null}
            </View>
            <View
              style={{
                width: "100%",
              }}
            >
              <Text variant="bodySmall" style={styles.shortDescription}>
                {props.collaboration.description}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: "100%",
              borderWidth: 0.3,
              paddingVertical: 16,
              borderRadius: 10,
              borderColor: Colors(theme).gray300,
            }}
          >
            <Card.Content>
              <RatingSection feedbacks={getFeedbacks(contracts)} />
              <Pressable
                style={{ flex: 1, flexDirection: "column", gap: 16 }}
                onPress={() => setBrandModalVisible(true)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flexGrow: 1,
                  }}
                >
                  <ImageComponent
                    url={props.collaboration.logo}
                    altText="Brand Logo"
                    shape="square"
                    size="small"
                    style={{ width: 40, height: 40, borderRadius: 5 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: Colors(theme).text,
                      }}
                    >
                      {props.collaboration.brandName}{" "}
                      {props.collaboration.paymentVerified && (
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          color={Colors(theme).primary}
                        />
                      )}
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        flexWrap: "wrap",
                        overflow: "hidden",
                        color: Colors(theme).text,
                        lineHeight: 22,
                      }}
                    >
                      {truncateText(props.collaboration.brandDescription, 60)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Card.Content>
          </View>

          {props.collaboration?.externalLinks &&
            props.collaboration?.externalLinks.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 16,
                  justifyContent: "space-between",
                }}
              >
                {props.collaboration?.externalLinks?.map((item, index) => (
                  <Button
                    key={index}
                    mode="contained"
                    style={{
                      flexBasis: 1,
                      flexGrow: 1,
                      borderColor: Colors(theme).primary,
                      borderWidth: 0.3,
                    }}
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

          <View
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 8,
              borderWidth: 0.3,
              borderRadius: 10,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: Colors(theme).text,
              }}
            >
              Influencer Needed: {props.collaboration.numberOfInfluencersNeeded}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: Colors(theme).text,
              }}
            >
              Influencer Applied: 10
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: Colors(theme).text,
              }}
            >
              Brand Hire Rate: 70%
            </Text>
            {props.collaboration.promotionType ===
              PromotionType.PAID_COLLAB && (
              <Text
                style={{
                  fontSize: 16,
                  color: Colors(theme).text,
                }}
              >
                Budget:
                {props.collaboration?.budget?.min ===
                props.collaboration?.budget?.max
                  ? `$${props.collaboration?.budget?.min}`
                  : `$${props.collaboration?.budget?.min} - $${props.collaboration?.budget?.max}`}
              </Text>
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              width: "100%",
              rowGap: 10,
            }}
          >
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
            <View
              style={{
                width: "100%",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: Colors(theme).text,
                  fontWeight: "bold",
                  marginBottom: 16,
                }}
              >
                Location
              </Text>
              <ViewCollaborationMap
                mapRegion={{
                  latitude: props.collaboration?.location?.latlong?.lat,
                  longitude: props.collaboration?.location?.latlong?.long,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.042,
                }}
                onMapRegionChange={(region) => {}}
                onFormattedAddressChange={(address) => {}}
              />
              <Text style={{ fontSize: 16, color: Colors(theme).text }}>
                {props.collaboration.location.name}
              </Text>
            </View>
          )}
          {props?.collaboration?.questionsToInfluencers &&
            props?.collaboration?.questionsToInfluencers.length > 0 && (
              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  gap: 8,
                  borderWidth: 0.3,
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: Colors(theme).text,
                    fontWeight: "bold",
                  }}
                >
                  Questions asked on application
                </Text>

                {props?.collaboration?.questionsToInfluencers?.map(
                  (question, index) => (
                    <Text
                      key={index}
                      style={{
                        fontSize: 16,
                        color: Colors(theme).text,
                      }}
                    >
                      {question}
                    </Text>
                  )
                )}
              </View>
            )}
          <View style={{ width: "100%", gap: 16 }}>
            <Text
              style={{
                fontSize: 16,
                color: Colors(theme).text,
                fontWeight: "bold",
              }}
            >
              Posted by
            </Text>
            <Pressable onPress={() => setManagerModalVisible(true)}>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <ImageComponent
                  url={managerDetails?.profileImage}
                  size="small"
                  altText="Manager Profile Image"
                  initials={managerDetails?.name}
                  initialsSize={16}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                  }}
                />
                <View
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: Colors(theme).text,
                    }}
                  >
                    {managerDetails?.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      color: Colors(theme).gray100,
                    }}
                  >
                    {managerDetails?.role} - {props.collaboration.brandName}
                  </Text>
                </View>
              </View>
            </Pressable>
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
    </ScrollView>
  );
};

export default OverviewTabContent;
