import Colors from "@/constants/Colors";
import ReadMore from "@/shared-uis/components/ReadMore";
import { stylesFn } from "@/styles/collaboration-details/CollaborationHeader.styles";
import { imageUrl } from "@/utils/url";
import { faArrowLeft, faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable } from "react-native";
import { Avatar } from "react-native-paper";
import BottomSheetActions from "../BottomSheetActions";
import { View } from "../theme/Themed";
import { CollaborationDetail } from "./collaboration-details";

interface ColloborationHeaderProps {
  collaboration: CollaborationDetail;
}

const CollaborationHeader: React.FC<ColloborationHeaderProps> = ({
  collaboration,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const pageID = useLocalSearchParams().pageID;
  const theme = useTheme();
  const styles = stylesFn(theme);
  const router = useRouter();

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => {
            if (router.canGoBack())
              router.back();
            else
              router.push("/collaborations");
          }} style={{ paddingRight: 16 }}>
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={24}
              color={Colors(theme).text}
            />
          </Pressable>
          <View style={styles.logoSection}>
            <Avatar.Image size={48} source={imageUrl(collaboration?.logo)} />
            <View style={styles.titleSection}>
              <ReadMore text={collaboration?.name} lineCount={1} showReadMore={false} style={styles.title} />
              {/* <Text style={styles.title}>{collaboration?.name}</Text> */}
              <View style={styles.companyRow}>
                <ReadMore text={collaboration?.brandName} lineCount={1} showReadMore={false} style={styles.companyText} />
                {/* <Text style={styles.companyText}>{collaboration?.brandName}</Text> */}
              </View>
            </View>
          </View>
          <Pressable onPress={() => {
            setIsVisible(true)
          }} style={{ paddingRight: 16 }}>
            <FontAwesomeIcon
              icon={faEllipsisH}
              size={24}
              color={Colors(theme).text}
            />
          </Pressable>
        </View>
      </View>
      <BottomSheetActions
        cardId={pageID as string}
        cardType="activeCollab"
        isVisible={isVisible}
        snapPointsRange={["20%", "50%"]}
        onClose={() => {
          setIsVisible(false);
        }}
      />
    </>
  );
};

export default CollaborationHeader;
