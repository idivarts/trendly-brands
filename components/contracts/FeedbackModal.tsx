import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { faClose, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet
} from "react-native";
import { Modal } from "react-native-paper";
import TextInput from "../ui/text-input";

interface FeedbackModalProps {
  star: number;
  feedbackGiven: boolean;
  visible: boolean;
  setVisibility: (visible: boolean) => void;
  contract: IContracts;
  refreshData: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  star,
  feedbackGiven,
  visible,
  setVisibility,
  contract,
  refreshData,
}) => {
  const theme = useTheme();
  const [selectedStar, setSelectedStar] = useState(star);
  const [textFeedback, setTextFeedback] = useState("");
  const { manager } = useAuthContext();


  const provideFeedback = async () => {
    try {
      const contractRef = doc(
        FirestoreDB,
        "contracts",
        contract.streamChannelId
      );
      if (textFeedback === "" || selectedStar === 0) {
        alert("Please provide feedback and rating before submitting");
        return;
      }
      const date = new Date();
      await updateDoc(contractRef, {
        status: 2,
        contractTimestamp: {
          ...contract.contractTimestamp,
          endedOn: Date.now(),
        },
        feedbackFromBrand: {
          ratings: selectedStar,
          feedbackReview: textFeedback,
          managerId: manager?.id,
          timeSubmitted: date.getTime(),
        },
      });
      HttpWrapper.fetch(`/api/v1/contracts/${contract.streamChannelId}/end`, {
        method: "POST",
      }).then(r => {
        Toaster.success("Contract has now ended")
      })

      // if (contract.feedbackFromInfluencer?.ratings) {
      //   await updateDoc(contractRef, {
      //     status: 3,
      //   });
      // }
      setVisibility(false);
      refreshData();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={() => setVisibility(false)}
      contentContainerStyle={{
        backgroundColor: Colors(theme).background,
        borderRadius: 10,
        padding: 20,
        marginHorizontal: 20,
        width: "100%",
        maxWidth: 600,
        alignSelf: "center"
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <Pressable style={styles.modal} onPress={() => Platform.OS != "web" && Keyboard.dismiss()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Feedback</Text>
            <Pressable onPress={() => setVisibility(false)}>
              <FontAwesomeIcon
                icon={faClose}
                color={Colors(theme).primary}
                size={30}
              />
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              {feedbackGiven
                ? "Thank you for your feedback!"
                : "Please provide your feedback"}
            </Text>
            {star === 0 && (
              <View style={styles.modalRating}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Pressable key={i} onPress={() => setSelectedStar(i)}>
                    <FontAwesomeIcon
                      icon={faStar}
                      color={
                        i <= selectedStar
                          ? Colors(theme).yellow
                          : Colors(theme).text
                      }
                      size={30}
                    />
                  </Pressable>
                ))}
              </View>
            )}
            {!feedbackGiven && (
              <TextInput
                style={styles.textInput}
                placeholder="Write your feedback here"
                autoFocus
                value={textFeedback}
                onChangeText={(text) => setTextFeedback(text)}
                numberOfLines={5}
                multiline
              />
            )}
            {!feedbackGiven && (
              <Pressable
                style={{
                  backgroundColor: Colors(theme).primary,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 5,
                  marginVertical: 10,
                  alignSelf: "flex-end",
                }}
                onPress={() => {
                  provideFeedback();
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: Colors(theme).white,
                  }}
                >
                  End Contract with Feedback
                </Text>
              </Pressable>
            )}
            {feedbackGiven && (
              <Pressable
                style={{
                  backgroundColor: Colors(theme).primary,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 5,
                  marginVertical: 10,
                  alignSelf: "flex-end",
                }}
                onPress={() => setVisibility(false)}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: Colors(theme).white,
                  }}
                >
                  Close
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalContent: {
    width: "100%",
    alignItems: "flex-start",
  },
  modalText: {
    fontSize: 16,
    marginVertical: 10,
  },
  modalRating: {
    flexDirection: "row",
    marginVertical: 10,
  },
  keyboardAvoidingView: {},
  textInput: {
    width: "100%",
    height: 100,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginVertical: 10,
  },
});

export default FeedbackModal;
