import Colors from "@/constants/Colors";
import { MAX_WIDTH_WEB } from "@/constants/Container";
import { ISocials } from "@/shared-libs/firestore/trendly-pro/models/socials";
import AssetPreviewModal from "@/shared-uis/components/carousel/asset-preview-modal";
import Carousel from "@/shared-uis/components/carousel/carousel";
import { MediaItem } from "@/shared-uis/components/carousel/render-media-item";
import ImageComponent from "@/shared-uis/components/image-component";
import { stylesFn } from "@/styles/InfluencerCard.styles";
import { User } from "@/types/User";
import { processRawAttachment } from "@/utils/attachments";
import { convertToKUnits } from "@/utils/conversion";
import { FirestoreDB } from "@/utils/firestore";
import { truncateText } from "@/utils/text";
import {
  faChartLine,
  faCheck,
  faEllipsis,
  faFaceSmile,
  faPeopleRoof,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  Text,
  View
} from "react-native";
import { Card } from "react-native-paper";
import RenderHTML from "react-native-render-html";
import Tag from "./ui/tag";

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
  const [images, setImages] = useState(influencer.profile?.attachments?.map((attachment) =>
    processRawAttachment(attachment)
  ) || [])

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
      const atts = (socialData.socialScreenShots || []).map((attachment) => ({
        type: "image",
        url: attachment,
      }));
      if (atts.length > 0) {
        setImages([...images, ...atts]);
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
        <Pressable onPress={() => {
          if (props.openProfile) {
            props.openProfile(influencer);
          }
        }}>
          <View style={[styles.header]}>
            <ImageComponent
              size="small"
              url={influencer.profileImage || ""}
              initials={influencer.name}
              altText="Image"
              shape="circle"
            />
            <View
              style={styles.nameContainer}
            >
              <Text style={styles.name}>{influencer.name}</Text>
              <Text style={styles.handle}>@{handle}</Text>
            </View>
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
                  onPress={(event) => {
                    event.stopPropagation()
                    if (props.ToggleMessageModal) {
                      props.ToggleMessageModal();
                    }
                  }}
                >
                  Invite
                </Tag>
              ))}
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
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
        </Pressable>

        {images.length > 0 && <Carousel
          data={images}
          carouselWidth={Platform.OS === "web" ? MAX_WIDTH_WEB : screenWidth}
          // onImagePress={onImagePress}
          onImagePress={() => {
            if (props.openProfile) {
              props.openProfile(influencer);
            }
          }}
          theme={theme}
        />}
        <Pressable onPress={() => {
          if (props.openProfile) {
            props.openProfile(influencer);
          }
        }}>

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
                    {convertToKUnits(Number(influencer.backend?.rating))}
                  </Text>
                </View>
              </View>
              {/* <View style={styles.statItem}>
              <FontAwesomeIcon
                icon={faComment}
                color={Colors(theme).primary}
                size={18}
              />
            </View> */}
            </View>


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
          </View>
        </Pressable>
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
