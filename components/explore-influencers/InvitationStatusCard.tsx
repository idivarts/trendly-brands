import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "react-native-paper";
import { FacebookImageComponent } from "@/shared-uis/components/image-component";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { maskHandle } from "@/shared-uis/utils/masks";

export interface InvitationStatusCardProps {
  item: {
    userId: string;
    fullname: string;
    username: string;
    picture: string;
    followers: number;
    views?: number;
    engagements: number;
  };
  status: "Accepted" | "Denied" | "Waiting";
  timeAgo: string;
  flag?: string;
  onPress?: () => void;
}

const formatNumber = (n: number | undefined) => {
  if (n == null) return "-";
  if (n < 100) return String(n.toFixed(2));
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${Math.round(n / 100) / 10}k`;
  if (n < 1_000_000_000) return `${Math.round(n / 100_000) / 10}M`;
  return `${Math.round(n / 100_000_000) / 10}B`;
};

const InvitationStatusCard: React.FC<InvitationStatusCardProps> = ({
  item,
  status,
  timeAgo,
  flag = "Flag",
  onPress,
}) => {
  const theme = useTheme();
  const colors = Colors(theme);
  const styles = useMemo(() => useStyles(colors), [colors]);

  const getStatusColor = () => {
    switch (status) {
      case "Accepted":
        return "#4CAF50"; // green
      case "Denied":
        return "#E53935"; // red
      case "Waiting":
      default:
        return "#FFA726"; // orange
    }
  };

  return (
    <Card
      style={[styles.card, { backgroundColor: colors.aliceBlue }]}
      onPress={onPress}
    >
      <Card.Content style={styles.content}>
        {/* Top-right time */}
        <Text style={styles.timeAgo}>{[timeAgo]}</Text>

        <View style={{ backgroundColor: colors.aliceBlue, paddingTop: 20 }}>
          <View style={styles.row}>
            {/* Avatar */}
            <View style={styles.avatarCol}>
              <FacebookImageComponent
                url={item.picture}
                altText={item.fullname}
                style={[styles.avatar, { borderColor: Colors(theme).primary }]}
              />
            </View>

            {/* Name, Username, and Status */}
            <View style={styles.nameCol}>
              <Text style={styles.title} numberOfLines={1}>
                {item.fullname}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                @{maskHandle(item.username)}
              </Text>

              {/* Status Button */}
              <View
                style={[
                  styles.statusButton,
                  { backgroundColor: getStatusColor() },
                ]}
              >
                <Text style={styles.statusText}>{status}</Text>
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

          {/* Bottom-left flag */}
          <View
            style={{
              alignSelf: "flex-end",
              paddingHorizontal: 20,
              position: "absolute",
              right: -8,
              bottom: -8,
              borderTopLeftRadius: 8,
              backgroundColor: colors.white,
            }}
          >
            <Text style={styles.flagText}>{flag}</Text>
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
  return <View style={{ width: 1, height: "80%", backgroundColor: "#999" }} />;
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 8,
      marginVertical: 6,
      borderRadius: 12,
      overflow: "hidden",
      width: "100%",
      minHeight: 216,
    },
    content: { paddingHorizontal: 8, paddingVertical: 8, position: "relative" },
    timeAgo: {
      fontSize: 12,
      opacity: 1,
      color: colors.gray300,
      alignSelf: "flex-end",
    },
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
    statusButton: {
      marginTop: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignSelf: "flex-start",
    },
    statusText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      paddingVertical: 12,
      marginTop: 12,
    },
    stat: { alignItems: "center" },
    flagText: {
      fontSize: 12,
      fontWeight: "400",
    },
  });

export default InvitationStatusCard;
