import { Text, View } from "@/components/theme/Themed";
import { FC } from "react";
import { Pressable } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import Colors from "@/constants/Colors";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@react-navigation/native";
import ImageComponent from "@/shared-uis/components/image-component";
import { formatTimeToNow } from "@/utils/date";

interface CollaborationHeaderProps {
  collabName: string;
  brandName: string;
  brandImage: string;
  collabId: string;
  timePosted?: number;
  paymentVerified: boolean;
  onOpenBottomSheet: (id: string) => void;
}

const CollaborationHeader: FC<CollaborationHeaderProps> = ({
  collabName,
  brandName,
  collabId,
  brandImage,
  timePosted,
  paymentVerified,
  onOpenBottomSheet,
}) => {
  const theme = useTheme();

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <ImageComponent
          url={brandImage}
          altText="Image"
          shape="circle"
          size="small"
          style={{
            width: 40,
            height: 40,
            borderRadius: 5,
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
              width: 200,
            }}
          >
            {collabName}
          </Text>
          <Text
            style={{
              fontSize: 16,
            }}
          >
            {brandName}
          </Text>
        </View>
      </View>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {timePosted ? (
          <Text>
            {formatTimeToNow(timePosted)}
          </Text>
        ) : null}
        <Pressable
          onPress={() => {
            onOpenBottomSheet(collabId);
          }}
        >
          <FontAwesomeIcon
            icon={faEllipsisH}
            size={24}
            color={Colors(theme).text}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default CollaborationHeader;
