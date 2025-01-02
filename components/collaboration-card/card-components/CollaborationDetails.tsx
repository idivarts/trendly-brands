import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import {
  faCoins,
  faDollar,
  faEllipsisH,
  faMap,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { FC } from "react";
import { Pressable } from "react-native";
import ChipCard from "./ChipComponent";
import {
  faFacebook,
  faInstagram,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";

interface CollaborationDetailsProps {
  collabDescription: string;
  name: string;
  collabId: string;
  location: any;
  platform: string[];
  contentType: string[];
  promotionType: PromotionType;
  onOpenBottomSheet: (id: string) => void;
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
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            color: Colors(theme).text,
          }}
        >
          {name}
        </Text>
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
        </Pressable>
      </View>
      <Text
        style={{
          color: Colors(theme).gray100,
        }}
      >
        {collabDescription}
      </Text>
      <View
        style={{
          flexDirection: "row",
          marginTop: 10,
          flexWrap: "wrap",
        }}
      >
        <ChipCard
          chipText={
            promotionType === PromotionType.PAID_COLLAB ? "Paid" : "Unpaid"
          }
          chipIcon={faDollar}
        />
        <ChipCard chipText={location.type} chipIcon={faMap} />
        <ChipCard
          chipText={
            platform.length > 1
              ? platform[0] + "+" + (platform.length - 1)
              : platform[0]
          }
          chipIcon={
            platform[0] === "Instagram"
              ? faInstagram
              : platform[0] === "Facebook"
              ? faFacebook
              : platform[0] === "Youtube"
              ? faYoutube
              : faInstagram
          }
        />
      </View>
      {contentType && contentType.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            marginTop: 10,
            flexWrap: "wrap",
          }}
        >
          {contentType.map((content, index) => (
            <ChipCard key={index} chipText={content} chipIcon={faCoins} />
          ))}
        </View>
      )}
    </View>
  );
};

export default CollaborationDetails;
