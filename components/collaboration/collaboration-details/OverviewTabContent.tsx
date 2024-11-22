import React from "react";
import { View, Image, ScrollView } from "react-native";
import {
  Text,
  Card,
  Paragraph,
} from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import { stylesFn } from "@/styles/collaboration-details/CollaborationDetails.styles";

interface OverviewTabContentProps {
  collaboration: any;
  logo: string;
};

const OverviewTabContent: React.FC<OverviewTabContentProps> = ({
  collaboration,
  logo,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <ScrollView
      style={{
        flex: 1,
        paddingTop: 8,
        paddingHorizontal: 16,
        paddingBottom: 16,
      }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        gap: 16,
        paddingBottom: 16,
      }}
    >
      {/* Ad Description Section */}
      <Card style={styles.infoCard}>
        <Image
          source={{
            uri:
              logo ||
              "https://cdn.pixabay.com/photo/2022/09/21/17/02/blue-background-7470781_640.jpg",
          }}
          style={styles.profileImage}
        />
        <View>
          <Text variant="headlineSmall" style={styles.cardName}>
            Ad Description
          </Text>
        </View>
        <Card.Content>
          <Paragraph style={styles.brandName}>
            {" "}
            {collaboration.description}
          </Paragraph>
        </Card.Content>
      </Card>

      {/* About Brand Section */}
      <Card style={styles.infoCard}>
        <View>
          <Text variant="headlineSmall" style={styles.cardName}>
            About Brand
          </Text>
        </View>
        <Card.Content>
          <Paragraph style={styles.brandName}>
            {collaboration.description}
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Platform Section */}
      <Card style={styles.infoCard}>
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
        <View>
          <Text variant="headlineSmall" style={styles.cardName}>
            Payment Details
          </Text>
        </View>
        <Card.Content>
          <Paragraph style={styles.brandName}>
            Cost: {collaboration.budget.min}
          </Paragraph>
          <Paragraph style={styles.brandName}>
            Payment Verified: True
          </Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

export default OverviewTabContent;
