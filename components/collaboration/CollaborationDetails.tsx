import React from "react";
import { View, Image, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Chip,
  Appbar,
  Card,
  Paragraph,
  IconButton,
  Button,
} from "react-native-paper";
import AppLayout from "@/layouts/app-layout";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { stylesFn } from "@/styles/CollaborationDetails.styles";
import BackButton from "@/components/ui/back-button/BackButton";
import Colors from "@/constants/Colors";
import BottomSheetActions from "../BottomSheetActions";

interface CollaborationAdCardProps {
  collaborationName: string;
  brandName: string;
  shortDescription: string;
  brandDescription: string;
  adDescription: string;
  platform: string;
  externalLinks: string[];
  influencersViewed: number;
  brandViewed: number;
  postedDate: string;
  cost: string;
  paymentVerified: string;
  promotionType: string;
  collaborationType: string;
  influencersNeeded: number;
  appliedCount: number;
  aiSuccessRate: string;
  location: {
    type: string;
    name?: string;
    latlong?: any;
  };
  brandHireRate: string;
  logo: string;
}

const CollaborationPage = (props: any) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <AppLayout>
      <Appbar.Header
        statusBarHeight={0}
        style={{
          backgroundColor: Colors(theme).background,
        }}
      >
        <BackButton />
        <Appbar.Content
          title="Collaboration Details"
          color={Colors(theme).text}
        />
        <IconButton
          icon="dots-vertical"
          onPress={() => {
            setIsVisible(true);
          }}
        />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Collaboration Details */}
        <Card style={styles.profileCard}>
          <Image
            source={{
              uri:
                props.logo ||
                "https://cdn.pixabay.com/photo/2022/09/21/17/02/blue-background-7470781_640.jpg",
            }}
            style={styles.profileImage}
          />
          <Card.Content style={styles.profileContent}>
            <Text variant="headlineMedium" style={styles.name}>
              {props.collaborationDetail.name}
            </Text>
            <Text variant="bodyMedium" style={styles.brandName}>
              {props.collaborationDetail.brandName}
            </Text>
            <Text variant="bodySmall" style={styles.shortDescription}>
              {props.collaborationDetail.description}
            </Text>
            {/* <Button
              mode="contained"
              style={styles.applyButton}
              onPress={() => {
                router.push(`/apply-now/${props.pageID}`);
              }}
            >
              Apply Now
            </Button> */}
            <View style={styles.statsContainer}>
              <Chip icon="checkbox-marked-circle" style={styles.statChip}>
                {props.collaborationDetail.appliedCount} Applied
              </Chip>
              <Chip icon="eye" style={styles.statChip}>
                {props.collaborationDetail.brandViewed} Reviewed
              </Chip>
              <Chip icon="map-marker" style={styles.statChip}>
                {props.collaborationDetail.location.name}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Ad Description Section */}
        <Card style={styles.infoCard}>
          {/* <Card.Title title="Ad Description" /> */}
          <View>
            <Text variant="headlineSmall" style={styles.cardName}>
              Ad Description
            </Text>
          </View>
          <Card.Content>
            <Paragraph> {props.collaborationDetail.description}</Paragraph>
          </Card.Content>
        </Card>

        {/* About Brand Section */}
        <Card style={styles.infoCard}>
          {/* <Card.Title title="About Brand" /> */}
          <View>
            <Text variant="headlineSmall" style={styles.cardName}>
              About Brand
            </Text>
          </View>
          <Card.Content>
            <Paragraph>{props.collaborationDetail.description}</Paragraph>
          </Card.Content>
        </Card>

        {/* Platform Section */}
        <Card style={styles.infoCard}>
          {/* <Card.Title title="Platform" /> */}
          <View>
            <Text variant="headlineSmall" style={styles.cardName}>
              Platform
            </Text>
          </View>
          <Card.Content>
            <Paragraph style={styles.paragraph}>Instagram</Paragraph>
          </Card.Content>
        </Card>

        {/* Payment Details Section */}
        <Card style={styles.infoCard}>
          {/* <Card.Title title="Payment Details" /> */}
          <View>
            <Text variant="headlineSmall" style={styles.cardName}>
              Payment Details
            </Text>
          </View>
          <Card.Content>
            <Paragraph>Cost: {props.collaborationDetail.budget.min}</Paragraph>
            <Paragraph>Payment Verified: True</Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
      <BottomSheetActions
        cardId={props.pageID}
        cardType="influencerCard"
        isVisible={isVisible}
        snapPointsRange={["20%", "50%"]}
        onClose={() => {
          setIsVisible(false);
        }}
      />
    </AppLayout>
  );
};

export default CollaborationPage;
