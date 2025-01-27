import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import { Card, Avatar } from "react-native-paper";
import { stylesFn } from "@/styles/InfluencerCard.styles";
import { useTheme } from "@react-navigation/native";
import Colors from "@/constants/Colors";
import { convertToKUnits } from "@/utils/conversion";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faEllipsis,
  faPeopleRoof,
  faChartLine,
  faFaceSmile,
  faComment,
  faCheck,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { imageUrl } from "@/utils/url";
import Tag from "./ui/tag";
import { User } from "@/types/User";
import { processRawAttachment } from "@/utils/attachments";
import RenderHTML from "react-native-render-html";
import { truncateText } from "@/utils/text";
import { MediaItem } from "@/shared-uis/components/carousel/render-media-item";
import Carousel from "@/shared-uis/components/carousel/carousel";
import AssetPreviewModal from "@/shared-uis/components/carousel/asset-preview-modal";
import ImageComponent from "@/shared-uis/components/image-component";
import { doc, getDoc } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import { ISocials } from "@/shared-libs/firestore/trendly-pro/models/socials";

interface InfluencerCardPropsType {
  alreadyInvited?: (influencerId: string) => Promise<boolean>;
  influencer: User;
  openProfile?: (influencer: User) => void;
  setSelectedInfluencer?: React.Dispatch<React.SetStateAction<User | null>>;
  ToggleMessageModal?: () => void;
  ToggleModal: () => void;
  type: string;
}

const InfluencerCard = (props: InfluencerCardPropsType) => {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [handle, setHandle] = useState("");

  const influencer = props.influencer;
  const theme = useTheme();
  const styles = stylesFn(theme);

  const screenWidth = Dimensions.get("window").width;

  const onImagePress = (data: MediaItem) => {
    setPreviewImageUrl(data.url);
    setPreviewImage(true);
  };

  const fetchHandle = async () => {
    if (!influencer.primarySocial) {
      setHandle("influencer-handle");
      return;
    }
    const userSocialRef = doc(
      FirestoreDB,
      "users",
      influencer.id,
      "socials",
      influencer.primarySocial
    );
    const socialDoc = await getDoc(userSocialRef);
    const socialData = socialDoc.data() as ISocials;
    if (socialDoc.exists()) {
      if (socialData.isInstagram) {
        setHandle(socialData.instaProfile?.username || "influencer-handle");
      } else {
        setHandle(socialData.fbProfile?.name || "influencer-handle");
      }
    }
  };

  useEffect(() => {
    if (props?.alreadyInvited) {
      props.alreadyInvited(props.influencer.id).then((invited) => {
        setIsInvited(invited);
      });
    }
    fetchHandle();
  }, []);

  return (
    <>
      <Card style={styles.card} mode="contained">
        <View style={[styles.header]}>
          <Pressable
            onPress={() => {
              if (props.openProfile) {
                props.openProfile(influencer);
              }
            }}
          >
            <ImageComponent
              size="small"
              url={influencer.profileImage || ""}
              initials={influencer.name}
              altText="Image"
              shape="circle"
            />
          </Pressable>
          <Pressable
            style={styles.nameContainer}
            onPress={() => {
              if (props.openProfile) {
                props.openProfile(influencer);
              }
            }}
          >
            <Text style={styles.name}>{influencer.name}</Text>
            <Text style={styles.handle}>@{handle}</Text>
          </Pressable>
          {props.type === "invitation" &&
            (isInvited ? (
              <Tag
                icon={() => (
                  <FontAwesomeIcon
                    icon={faCheck}
                    size={12}
                    color={Colors(theme).text}
                  />
                )}
              >
                Invited
              </Tag>
            ) : (
              <Tag
                icon={() => (
                  <FontAwesomeIcon
                    icon={faPlus}
                    size={12}
                    color={Colors(theme).text}
                  />
                )}
                onPress={() => {
                  if (props.ToggleMessageModal) {
                    props.ToggleMessageModal();
                  }
                }}
              >
                Invite
              </Tag>
            ))}
          <Pressable
            onPress={() => {
              props.ToggleModal();
              if (props?.setSelectedInfluencer) {
                props.setSelectedInfluencer(props.influencer);
              }
            }}
          >
            <FontAwesomeIcon
              icon={faEllipsis}
              size={24}
              color={Colors(theme).text}
            />
          </Pressable>
        </View>

        <Carousel
          data={
            influencer.profile?.attachments?.map((attachment) =>
              processRawAttachment(attachment)
            ) || []
          }
          onImagePress={onImagePress}
          theme={theme}
        />

        <View style={styles.content}>
          <View style={styles.stats}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <FontAwesomeIcon
                  icon={faPeopleRoof}
                  color={Colors(theme).primary}
                  size={20}
                />
                <Text style={styles.statsText}>
                  {convertToKUnits(Number(influencer.backend?.followers))}
                </Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesomeIcon
                  icon={faChartLine}
                  color={Colors(theme).primary}
                  size={20}
                />
                <Text style={styles.statsText}>
                  {convertToKUnits(Number(influencer.backend?.reach))}
                </Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesomeIcon
                  icon={faFaceSmile}
                  color={Colors(theme).primary}
                  size={20}
                />
                <Text style={styles.statsText}>
                  {influencer.backend?.rating}
                </Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <FontAwesomeIcon
                icon={faComment}
                color={Colors(theme).primary}
                size={18}
              />
            </View>
          </View>

          <Pressable
            onPress={() => {
              if (props.openProfile) {
                props.openProfile(influencer);
              }
            }}
          >
            <Text>
              <RenderHTML
                contentWidth={screenWidth}
                source={{
                  html:
                    truncateText(
                      influencer?.profile?.content?.about as string,
                      160
                    ) || "<p>No content available.</p>",
                }}
                defaultTextProps={{
                  style: {
                    color: Colors(theme).text,
                    fontSize: 16,
                    lineHeight: 22,
                  },
                }}
              />
            </Text>
          </Pressable>
        </View>
      </Card>

      <AssetPreviewModal
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
        previewImageUrl={previewImageUrl}
        theme={theme}
      />
    </>
  );
};

export default InfluencerCard;
