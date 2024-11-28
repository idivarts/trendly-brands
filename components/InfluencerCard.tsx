import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { Card, Avatar } from "react-native-paper";
import { stylesFn } from "@/styles/InfluencerCard.styles";
import { useTheme } from "@react-navigation/native";
import {
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Colors from "@/constants/Colors";
import CarouselNative from "./ui/carousel/carousel";
import { convertToKUnits } from "@/utils/conversion";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faEllipsis, faPeopleRoof, faChartLine, faFaceSmile, faComment, faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import { imageUrl } from "@/utils/url";
import Tag from "./ui/tag";
import { MediaItem } from "./ui/carousel/render-media-item";

const { width } = Dimensions.get("window");

interface InfluencerCardPropsType {
  influencer: {
    id: string;
    name: string;
    handle: string;
    profilePic: string;
    media: MediaItem[];
    followers: number | string;
    reach: number | string;
    rating: number | string;
    bio: string;
    jobsCompleted: number | string;
    successRate: number | string;
  };
  type: string;
  alreadyInvited?: (influencerId: string) => Promise<boolean>;
  ToggleModal: () => void;
  ToggleMessageModal?: () => void;
}

const InfluencerCard = (props: InfluencerCardPropsType) => {
  const [bioExpanded, setBioExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isInvited, setIsInvited] = useState(false);

  // Animation values for zoom
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const influencer = props.influencer;
  const theme = useTheme();
  const styles = stylesFn(theme);

  const pinchHandler =
    useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
      onStart: (event) => {
        focalX.value = event.focalX;
        focalY.value = event.focalY;
      },
      onActive: (event) => {
        scale.value = event.scale;
      },
      onEnd: () => {
        if (scale.value < 1) {
          scale.value = withSpring(1);
        }
      },
    });

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: focalX.value },
        { translateY: focalY.value },
        { scale: scale.value },
        { translateX: -focalX.value },
        { translateY: -focalY.value },
      ],
    };
  });

  const onImagePress = (data: MediaItem) => {
    setSelectedImage(data.url);
    setIsZoomed(true);
  }

  useEffect(() => {
    if (props?.alreadyInvited) {
      props.alreadyInvited(props.influencer.id).then((invited) => {
        setIsInvited(invited);
      });
    }
  }, []);

  return (
    <>
      <Card
        style={styles.card}
        mode="contained"
      >
        <View
          style={[
            styles.header,
          ]}
        >
          <Avatar.Image
            size={50}
            source={imageUrl(influencer.profilePic)}
          />
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{influencer.name}</Text>
            <Text style={styles.handle}>{influencer.handle}</Text>
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
            }}
          >
            <FontAwesomeIcon
              icon={faEllipsis}
              size={24}
              color={Colors(theme).text}
            />
          </Pressable>
        </View>

        <CarouselNative
          data={influencer.media}
          onImagePress={onImagePress}
        />

        <View
          style={styles.content}
        >
          <View style={styles.stats}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <FontAwesomeIcon
                  icon={faPeopleRoof}
                  color={Colors(theme).primary}
                  size={20}
                />
                <Text style={styles.statsText}>
                  {convertToKUnits(Number(influencer.followers))}
                </Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesomeIcon
                  icon={faChartLine}
                  color={Colors(theme).primary}
                  size={20}
                />
                <Text style={styles.statsText}>
                  {convertToKUnits(Number(influencer.reach))}
                </Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesomeIcon
                  icon={faFaceSmile}
                  color={Colors(theme).primary}
                  size={20}
                />
                <Text style={styles.statsText}>
                  {influencer.rating}
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

          <TouchableOpacity onPress={() => setBioExpanded(!bioExpanded)}>
            <Text numberOfLines={bioExpanded ? undefined : 2} style={styles.bio}>
              {influencer.bio}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              return router.push("/(main)/CollaborationHistory");
            }}
          >
            <Text style={styles.jobHistory}>
              {influencer.jobsCompleted} Jobs completed ({influencer.successRate}{" "}
              success rate)
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Modal visible={isZoomed} transparent={true} animationType="fade">
        <View style={additionalStyles.modalContainer}>
          <TouchableOpacity
            style={additionalStyles.closeButton}
            onPress={() => {
              setIsZoomed(false);
              scale.value = 1;
            }}
          >
            <Text style={additionalStyles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <PinchGestureHandler onGestureEvent={pinchHandler}>
            <Animated.Image
              source={imageUrl(selectedImage || "")}
              style={[additionalStyles.zoomedImage, animatedImageStyle]}
              resizeMode="contain"
            />
          </PinchGestureHandler>
        </View>
      </Modal>
    </>
  );
};

const additionalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomedImage: {
    width: width,
    height: width,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 36,
  },
});

export default InfluencerCard;
