import { useBrandContext } from "@/contexts/brand-context.provider";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import { FacebookImageComponent } from "@/shared-uis/components/image-component";
import { View } from "@/shared-uis/components/theme/Themed";
import { toastConfig } from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { Theme, useTheme } from "@react-navigation/native";
import React from "react";
import { Dimensions, Linking, ScrollView, StyleSheet, Text } from "react-native";
import {
    Card,
    Divider,
    IconButton,
    Modal,
    Portal
} from "react-native-paper";
import Toast from "react-native-toast-message";
import InviteToCampaignButton from "../collaboration/InviteToCampaignButton";
import { InfluencerItem } from "./DiscoverInfluencer";
import { DB_TYPE } from "./RightPanelDiscover";
import TrendlyAnalyticsEmbed from "./trendly/TrendlyAnalyticsEmbed";

const useStatsModalStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignSelf: "center",
      width: 650,
      maxHeight: "95%",
      maxWidth: "92%",
      marginVertical: 16,
    },
    modalCard: {
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: Colors(theme).modalBackground,
    },
    row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: Colors(theme).primary,
    },
    chip: { marginRight: 6, marginBottom: 6 },
  });

export const InfluencerStatsModal: React.FC<{
  visible: boolean;
  item: InfluencerItem | null;
  onClose: () => void;
  selectedDb: DB_TYPE;
}> = ({ visible, item, onClose, selectedDb }) => {
  const theme = useTheme();
  const styles = useStatsModalStyles(theme);
  const { selectedBrand } = useBrandContext();
  const { openModal } = useConfirmationModel();

  const sendInvite = () => {
    if ((selectedBrand?.credits?.connection || 0) <= 0) {
      openModal({
        title: "No Connection Credit",
        description:
          "You seem to have exhausted the connection credit. Contact support for recharging the credit",
        confirmText: "Contact Support",
        confirmAction: () => {
          Linking.openURL("mailto:support@idiv.in");
        },
      });
      return;
    }
    openModal({
      title: "Feature is Underway",
      description:
        "We are working on this feature. Please contact support to know more about it and also to get the timeline for this",
      confirmText: "Contact Support",
      confirmAction: () => {
        Linking.openURL("mailto:support@idiv.in");
      },
    });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.container}
      >
        <Card style={styles.modalCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginLeft: 24,
              marginTop: 24,
            }}
          >
            <View style={styles.row}>
              {!!item?.profile_pic && (
                <FacebookImageComponent
                  url={item.profile_pic}
                  style={styles.avatar}
                  altText={item.name}
                />
              )}
              <View
                style={{
                  flexDirection: "column",
                  justifyContent: "center",
                  flexShrink: 1,
                }}
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    fontWeight: "600",
                    fontSize: 16,
                    color: Colors(theme).text,
                    maxWidth: Dimensions.get("window").width * 0.2,
                  }}
                >
                  {item?.name}
                </Text>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ opacity: 0.7 }}
                >
                  @{item?.username}
                </Text>
              </View>
            </View>
            <Card.Actions>
              {/* <Button mode="contained" onPress={() => sendInvite()}>Invite</Button> */}
              <InviteToCampaignButton openModal={openModal} influencerIds={item ? [item.id] : undefined} influencerName={item?.name} />

              <IconButton
                icon="open-in-new"
                onPress={() => {
                  if (item?.username && item.social_type == "instagram")
                    Linking.openURL(`https://www.instagram.com/${item.username}`)
                }}
              />
              <IconButton icon="close" onPress={onClose} />
            </Card.Actions>
          </View>
          <Divider style={{ marginBottom: 16 }} />
          <ScrollView
            style={{ maxHeight: Dimensions.get("window").height * 0.8 }}
            contentContainerStyle={{ flex: 1, marginBottom: 24 }}
          >
            {selectedDb == "trendly" && item && selectedBrand && (
              <TrendlyAnalyticsEmbed
                influencer={item}
                selectedBrand={selectedBrand}
              />
            )}
          </ScrollView>
        </Card>
      </Modal>
      <Toast config={toastConfig} />
    </Portal>
  );
};
