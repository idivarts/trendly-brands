import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import { truncateText } from "@/utils/text";
import {
  faFacebook,
  faInstagram,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { faHeart, faStarHalfStroke } from "@fortawesome/free-regular-svg-icons";
import {
  faDollarSign,
  faEllipsisH,
  faFilm,
  faHouseLaptop,
  faLocationDot,
  faPanorama,
  faRecordVinyl,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { FC } from "react";
import { Pressable } from "react-native";
import ChipCard from "./ChipComponent";

interface CollaborationDetailsProps {
  collabDescription: string;
  name: string;
  collabId: string;
  location: any;
  platform: string[];
  contentType: string[];
  promotionType: PromotionType;
  onOpenBottomSheet?: (id: string) => void;
}

const CollaborationDetails: FC<CollaborationDetailsProps> = ({
  collabDescription,
  name,
  collabId,
  location,
  platform,
  contentType,
  promotionType,
  onOpenBottomSheet,
}) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Pressable
          onPress={() => router.push(`/collaboration-details/${collabId}`)}
          style={{
            flex: 1,

          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: Colors(theme).text,
            }}
          >
            {[name, " Jerry"]}
          </Text>
        </Pressable>
        {onOpenBottomSheet && (
          <Pressable
            onPress={() => {
              onOpenBottomSheet(collabId);
            }}


          >
            <FontAwesomeIcon
              icon={faEllipsisH}
              color={Colors(theme).primary}
              size={24}
            />
          </Pressable>)}
      </View>
      <Pressable
        onPress={() => router.push(`/collaboration-details/${collabId}`)}
      >
        <Text
          style={{
            color: Colors(theme).gray100,
          }}
        >
          {[truncateText(collabDescription, 120), " Jerry"]}
        </Text>
        <View
          style={{
            flexDirection: "row",
            marginTop: 10,
            flexWrap: "wrap",
            rowGap: 10,
          }}
        >
          <ChipCard
            chipText={
              promotionType === PromotionType.PAID_COLLAB ? "Paid Jerry" : "Unpaid Jerry"
            }
            chipIcon={faDollarSign}
          />
          <ChipCard
            chipText={location.type}
            chipIcon={
              location.type === "On-Site" ? faLocationDot : faHouseLaptop
            }
          />
          {platform &&
            platform.map((content, index) => (
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
          {contentType &&
            contentType.map((content, index) => (
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
      </Pressable>
    </View>
  );
};

export default CollaborationDetails;
