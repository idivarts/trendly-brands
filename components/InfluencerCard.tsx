import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Card, Avatar, IconButton } from "react-native-paper";
import Carousel from "react-native-reanimated-carousel";
import Video from "react-native-video";
import { stylesFn } from "@/styles/InfluencerCard.styles";
import { useTheme } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const InfluencerCard = (props: any) => {
  const [bioExpanded, setBioExpanded] = useState(false);

  const influencer = props.influencer;
  const theme = useTheme();
  const styles = stylesFn(theme);

  const renderMediaItem = ({ item }: any) => {
    // if (item.type === "photo") {
    return (
      <Image
        source={{
          uri: "https://img.freepik.com/premium-photo/stylish-man-flat-vector-profile-picture-ai-generated_606187-310.jpg",
        }}
        style={styles.media}
      />
    );
    // } else {
    //   return (
    //     <Video
    //       source={{ uri: item }}
    //       style={styles.media}
    //       resizeMode="cover"
    //       repeat
    //       controls
    //     />
    //   );
    // }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Avatar.Image size={50} source={{ uri: influencer.profilePic }} />
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{influencer.name}</Text>
          <Text style={styles.handle}>{influencer.handle}</Text>
        </View>
        <IconButton
          icon="dots-horizontal"
          onPress={() => {
            props.ToggleModal();
          }}
        />
      </View>

      {/* Carousel for Post/Reel Preview */}
      <View style={styles.carouselContainer}>
        <Carousel
          loop
          width={380}
          height={250}
          data={influencer.media} // Array of media (photos/videos)
          renderItem={renderMediaItem}
          style={{
            padding: 10,
          }}
        />
      </View>

      {/* Followers, Reach, Rating */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>{influencer.followers} Followers</Text>
        <Text style={styles.statsText}>{influencer.reach} Reach</Text>
        <Text style={styles.statsText}>{influencer.rating} Rating</Text>
      </View>

      {/* Bio Section */}
      <TouchableOpacity onPress={() => setBioExpanded(!bioExpanded)}>
        <Text numberOfLines={bioExpanded ? undefined : 2} style={styles.bio}>
          {influencer.bio}
        </Text>
      </TouchableOpacity>

      {/* Job Completion */}
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
  );
};

export default InfluencerCard;
