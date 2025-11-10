import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "react-native-paper";
import { FacebookImageComponent } from "@/shared-uis/components/image-component";
import InviteToCampaignButton from "@/components/collaboration/InviteToCampaignButton";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { maskHandle } from "@/shared-uis/utils/masks";

export interface InfluencerCardProps {
  item: {
    userId: string;
    fullname: string;
    username: string;
    picture: string;
    followers: number;
    views?: number;
    engagements: number;
  };
  onPress?: () => void;
  openModal?: any;
  selectedBrand?: any;
  collaborations?: any[];
}

const formatNumber = (n: number | undefined) => {
  if (n == null) return "-";
  if (n < 100) return String(n.toFixed(2));
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${Math.round(n / 100) / 10}k`;
  if (n < 1_000_000_000) return `${Math.round(n / 100_000) / 10}M`;
  return `${Math.round(n / 100_000_000) / 10}B`;
};

const InfluencerCard: React.FC<InfluencerCardProps> = ({
  item,
  onPress,
  openModal,
  selectedBrand,
  collaborations,
}) => {
  const theme = useTheme();
  const colors = Colors(theme);
  const styles = useMemo(() => useStyles(colors), [colors]);

  return (
    <Card
      style={[styles.card, { backgroundColor: colors.aliceBlue }]}
      onPress={onPress}
    >
      <Card.Content style={styles.content}>
        <View style={{ backgroundColor: colors.aliceBlue, paddingTop: 20 }}>
          <View style={styles.row}>
            {/* Avatar */}
            <View style={styles.avatarCol}>
              <FacebookImageComponent
                url={item.picture}
                altText={item.fullname}
                style={[
                  styles.avatar,
                  { borderColor: Colors(theme).primary },
                ]}
              />
            </View>

            {/* Name, Username, and Invite */}
            <View style={styles.nameCol}>
              <Text style={styles.title} numberOfLines={1}>
                {item.fullname}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                @{maskHandle(item.username)}
              </Text>

              <View style={{ alignItems: "flex-start", marginTop: 8 }}>
                <InviteToCampaignButton
                  label="Invite"
                  openModal={openModal}
                  selectedBrand={selectedBrand}
                  collaborations={collaborations}
                  textstyle={{ fontSize: 18 }}
                />
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <Stat label="Followers" value={item.followers} />
            <DividerLine />
            <Stat label="Engagements" value={item.engagements} />
            <DividerLine />
            <Stat label="Views" value={item.views} />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const Stat = ({ label, value }: { label: string; value?: number }) => {
  const theme = useTheme();
  const colors = Colors(theme);
  const styles = useMemo(() => useStyles(colors), [colors]);

  return (
    <View style={styles.stat}>
      <Text style={{ fontWeight: "600", fontSize: 16 }}>
        {formatNumber(value)}
      </Text>
      <Text style={{ fontSize: 10, opacity: 0.8 }}>{label}</Text>
    </View>
  );
};

const DividerLine = () => {
  const theme = useTheme();
  const colors = Colors(theme);
  const styles = useMemo(() => useStyles(colors), [colors]);

  return <View style={{ width: 1, height: "80%", backgroundColor: "#999" }} />;
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 8,
      marginVertical: 6,
      borderRadius: 12,
      overflow: "hidden",
      minWidth: 340,
      minHeight: 216,
    },
    content: { paddingHorizontal: 8, paddingVertical: 8 },
    row: { flexDirection: "row", alignItems: "center", columnGap: 4 },
    avatarCol: {
      paddingHorizontal: 12,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 48,
      borderWidth: 3,
    },
    nameCol: { flexDirection: "column", flex: 1, maxWidth: "40%" },
    title: { fontSize: 20, fontWeight: "600", lineHeight: 18 },
    subtitle: { fontSize: 14, opacity: 0.7 },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      paddingVertical: 12,
      marginTop: 12,
    },
    stat: { alignItems: "center" },
  });

export default InfluencerCard;
