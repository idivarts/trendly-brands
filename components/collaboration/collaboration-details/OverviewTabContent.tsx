import React, { useEffect, useState } from "react";
import { View, Image, ScrollView, Pressable, Linking } from "react-native";
import { Text, Card, Paragraph, Button, Portal } from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import { stylesFn } from "@/styles/CollaborationDetails.styles";
import { FirestoreDB } from "@/utils/firestore";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { CollaborationDetail } from ".";
import {
  faCheckCircle,
  faCoins,
  faDollar,
  faMap,
  faStar,
  faStarHalfStroke,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import Colors from "@/constants/Colors";
import Carousel from "@/shared-uis/components/carousel/carousel";
import { processRawAttachment } from "@/utils/attachments";
import { formatDistanceToNow } from "date-fns";
import { truncateText } from "@/utils/text";
import ChipCard from "@/components/collaboration-card/card-components/ChipComponent";
import {
  faFacebook,
  faInstagram,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { PLACEHOLDER_IMAGE } from "@/constants/Placeholder";
import BrandModal from "./modal/BrandModal";
import ManagerModal from "./modal/ManagerModal";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import ViewCollaborationMap from "@/components/view-collaboration/ViewCollaborationMap";

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

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <>
        {Array.from({ length: fullStars }, (_, i) => (
          <FontAwesomeIcon
            key={i}
            icon={faStar}
            size={16}
            color={Colors(theme).yellow}
          />
        ))}
        {hasHalfStar && (
          <FontAwesomeIcon
            icon={faStarHalfStroke}
            size={16}
            color={Colors(theme).yellow}
          />
        )}
      </>
    );
  };

  useEffect(() => {
    fetchManagerDetails();
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
                  {formatDistanceToNow(props.collaboration.timeStamp, {
                    addSuffix: true,
                  })}
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
              <Pressable
                style={{ flex: 1, flexDirection: "column", gap: 16 }}
                onPress={() => setBrandModalVisible(true)}
              >
                <View style={{ flexDirection: "row" }}>{renderStars(4.5)}</View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flexGrow: 1,
                  }}
                >
                  <Image
                    source={{ uri: props.collaboration.logo }}
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
                      {truncateText(props.collaboration.brandDescription, 120)}
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
                    }}
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
            }}
          >
            <ChipCard
              chipText={
                props.collaboration.promotionType === PromotionType.PAID_COLLAB
                  ? "Paid"
                  : "Unpaid"
              }
              chipIcon={faDollar}
            />
            <ChipCard
              chipText={props.collaboration.location.type}
              chipIcon={faMap}
            />
            <ChipCard
              chipText={
                props.collaboration.platform.length > 1
                  ? props.collaboration.platform[0] +
                    "+" +
                    (props.collaboration.platform.length - 1)
                  : props.collaboration.platform[0]
              }
              chipIcon={
                props.collaboration.platform[0] === "Instagram"
                  ? faInstagram
                  : props.collaboration.platform[0] === "Facebook"
                  ? faFacebook
                  : props.collaboration.platform[0] === "Youtube"
                  ? faYoutube
                  : faInstagram
              }
            />
          </View>
          {props.collaboration.contentFormat &&
            props.collaboration.contentFormat.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                {props.collaboration.contentFormat.map((content, index) => (
                  <ChipCard key={index} chipText={content} chipIcon={faCoins} />
                ))}
              </View>
            )}
          {props.collaboration.location.type === "Physical" && (
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
                <Image
                  source={
                    !managerDetails?.profileImage
                      ? { uri: PLACEHOLDER_IMAGE }
                      : { uri: managerDetails?.profileImage }
                  }
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
