import React from "react";
import { Modal, Pressable, StyleSheet, View, Text } from "react-native";
import { List } from "react-native-paper";
import { useRouter } from "expo-router";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useAuthContext } from "@/contexts";

interface BottomSheetActionsProps {
  cardType: "influencerType" | "promotionType";
  cardId?: string;
  isVisible: boolean;
  snapPointsRange: [string, string];
  onClose: () => void;
}

const BottomSheetActions = ({
  cardType,
  cardId,
  isVisible,
  snapPointsRange,
  onClose,
}: BottomSheetActionsProps) => {
  const router = useRouter();
  const sheetRef = React.useRef<BottomSheet>(null);

  // Adjust snap points for the bottom sheet height
  const snapPoints = React.useMemo(
    () => [snapPointsRange[0], snapPointsRange[1]],
    []
  );

  const handleClose = () => {
    if (sheetRef.current) {
      sheetRef.current.close();
    }
    onClose(); // Close the modal after the bottom sheet closes
  };

  const renderContent = () => {
    switch (cardType) {
      case "influencerType":
        return (
          <View style={{ padding: 20 }}>
            <Text>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem optio
              possimus asperiores ad adipisci quo architecto quibusdam quaerat,
              fugiat, et quae dignissimos consequuntur itaque sint accusamus
              animi error saepe aperiam, doloremque quasi.
            </Text>
          </View>
        );
      case "promotionType":
        return (
          <View style={{ padding: 20 }}>
            <Text>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem optio
              possimus asperiores ad adipisci quo architecto quibusdam quaerat,
              fugiat, et quae dignissimos consequuntur itaque sint accusamus
              animi error saepe aperiam, doloremque quasi.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose} // Closes when Android back button is pressed
    >
      {/* Bottom Sheet */}
      <View style={styles.bottomSheetContainer}>
        <BottomSheet
          ref={sheetRef}
          index={0} // Snap to the first point when opened
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={() => {
            // Dismiss when tapping outside
            return <Pressable style={styles.overlay} onPress={handleClose} />;
          }}
          onClose={handleClose}
          style={styles.bottomSheet} // Ensure it's on top of everything
        >
          <BottomSheetView>{renderContent()}</BottomSheetView>
        </BottomSheet>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
    zIndex: 2,
  },
  bottomSheet: {
    zIndex: 9999,
  },
});

export default BottomSheetActions;
