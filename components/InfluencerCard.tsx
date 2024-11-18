import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Card, Avatar, IconButton, Chip } from "react-native-paper";
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import CarouselNative from "./ui/carousel/carousel";

const { width } = Dimensions.get("window");

interface InfluencerCardPropsType {
  influencer: {
    name: string;
    handle: string;
    profilePic: string;
    media: {
      type: string;
      uri: string;
    }[];
    followers: number | string;
    reach: number | string;
    rating: number | string;
    bio: string;
    jobsCompleted: number | string;
    successRate: number | string;
  };
  type: string;
  alreadyInvited?: boolean;
  ToggleModal: () => void;
  ToggleMessageModal?: () => void;
}

const InfluencerCard = (props: InfluencerCardPropsType) => {
  const [bioExpanded, setBioExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

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

  const onImagePress = (data: any) => {
    setSelectedImage(data); // TODO: data -> uri
    setIsZoomed(true);
  }

  // Rest of the component remains the same...
  return (
    <>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Avatar.Image size={50} source={{ uri: influencer.profilePic }} />
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{influencer.name}</Text>
            <Text style={styles.handle}>{influencer.handle}</Text>
          </View>
          {props.type === "invitation" &&
            (props.alreadyInvited ? (
              <Chip icon="check">Invited</Chip>
            ) : (
              <Chip
                icon="plus"
                onPress={() => {
                  if (props.ToggleMessageModal) {
                    props.ToggleMessageModal();
                  }
                }}
              >
                Invite
              </Chip>
            ))}
          <IconButton
            icon="dots-horizontal"
            onPress={() => {
              props.ToggleModal();
            }}
          />
        </View>

        <CarouselNative
          data={influencer.media}
          onImagePress={onImagePress}
        />

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="account-group"
              size={20}
              color={Colors(theme).primary}
            />
            <Text style={styles.statsText}>
              {influencer.followers} Followers
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="radar"
              size={20}
              color={Colors(theme).primary}
            />
            <Text style={styles.statsText}>{influencer.reach} Reach</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="star"
              size={20}
              color={Colors(theme).primary}
            />
            <Text style={styles.statsText}>{influencer.rating} Rating</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="message"
              size={28}
              color={Colors(theme).primary}
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
              source={{ uri: selectedImage || "" }}
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
