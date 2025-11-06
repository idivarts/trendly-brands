import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import { Video } from "expo-av";
import { useTheme } from "@react-navigation/native";
import { Checkbox } from "react-native-paper";
import Colors from "@/shared-uis/constants/Colors";

type Collaboration = {
  id: string;
  name: string;
  description: string;
  mediaUrl?: string;
  isVideo?: boolean;
  active?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  collaborations: Collaboration[];
  onInvite: (selectedIds: string[]) => void;
};

const InviteToCampaignModal: React.FC<Props> = ({
  visible,
  onClose,
  collaborations,
  onInvite,
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const theme = useTheme();
  const colors = Colors(theme);
  const styles = useMemo(() => useStyles(colors), [colors]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleInvite = () => {
    onInvite(selected);
    onClose();
  };

  const renderItem = ({ item }: { item: Collaboration }) => {
    if (!item.active) return null;
    const isSelected = selected.includes(item.id);

    return (
      <Pressable
        onPress={() => toggleSelect(item.id)}
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          { backgroundColor: Colors(theme).InfluencerStatCard },
        ]}
      >
        {/* Media */}
        {item.isVideo ? (
          <Video
            source={{ uri: item.mediaUrl ?? "https://via.placeholder.com/150" }}
            style={styles.media}
            shouldPlay={false}
            isMuted
          />
        ) : (
          <Image
            source={{ uri: item.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.name}>
            {item.name}
          </Text>
          <Text numberOfLines={1} style={styles.description}>
            {item.description}
          </Text>
        </View>

        {/* Checkbox */}
        <Checkbox
          status={isSelected ? "checked" : "unchecked"}
          onPress={() => toggleSelect(item.id)}
          // color={Colors(theme).InfluencerStatCard}
          // uncheckedColor={Colors(theme).InfluencerStatCard}
        />
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.aliceBlue }]}>
          <Text style={styles.header}>Invite to Campaign</Text>

          <FlatList
            data={collaborations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleInvite}
              style={[
                styles.inviteBtn,
                selected.length === 0 && { opacity: 0.6 },
              ]}
              disabled={selected.length === 0}
            >
              <Text style={styles.inviteText}>Invite Now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.backdrop,
      justifyContent: "center",
      alignItems: "center",
    },
    container: {
      width: "85%",
      maxHeight: "80%",
      borderRadius: 12,
      padding: 16,
    },
    header: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 10,
    },
    listContent: {
      paddingBottom: 80,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 10,
      marginBottom: 10,
      padding: 8,
    },
    cardSelected: {
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: colors.background,
    },
    media: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginLeft: 6,
    },
    info: {
      flex: 1,
      marginLeft: 10,
      rowGap: 8,
    },
    name: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    description: {
      fontSize: 13,
      color: colors.text,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 15,
    },
    cancelBtn: {
      marginRight: 10,
      padding: 10,
    },
    cancelText: {
      color: colors.primary,
    },
    inviteBtn: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 18,
    },
    inviteText: {
      color: colors.white,
      fontWeight: "600",
    },
  });

export default InviteToCampaignModal;
