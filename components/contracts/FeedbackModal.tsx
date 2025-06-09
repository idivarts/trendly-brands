import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useAuthContext, useAWSContext } from "@/contexts";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { faClose, faPlus, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Image, Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Modal } from "react-native-paper";
import Button from "../ui/button";
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

  const [loading, setLoading] = useState(false)

  const [selectedStar, setSelectedStar] = useState(star);
  const [textFeedback, setTextFeedback] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const { manager } = useAuthContext();
  const { uploadFileUris } = useAWSContext()

  const pickDocuments = async () => {
    try {
      const perm = await ImagePicker.getMediaLibraryPermissionsAsync()
      if (!perm.granted)
        return;

      const result = await ImagePicker.launchImageLibraryAsync({
        // type: 'image/*',
        // multiple: true,
        // copyToCacheDirectory: true,
        allowsMultipleSelection: true
      });
      if (!result.canceled && result.assets) {
        setSelectedFiles([...selectedFiles, ...result.assets]);
      }
    } catch (err) {
      console.log("Document pick error:", err);
    }
  };


  const provideFeedback = async () => {
    try {
      setLoading(true)
      const contractRef = doc(
        FirestoreDB,
        "contracts",
        contract.streamChannelId
      );
      if (textFeedback === "" || selectedStar === 0 || selectedFiles.length == 0) {
        alert("Please provide feedback and rating and payment proofs before submitting");
        return;
      }

      const files = await uploadFileUris(selectedFiles.map(f => ({
        id: f.assetId || "",
        localUri: f.uri,
        uri: f.uri,
        type: f.type || "image"
      })))
      // if (files.length > 0) {
      //   Console.log("All Files", files);
      //   return
      // }

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
          paymentProofs: files
        },
      });
      HttpWrapper.fetch(`/api/v1/contracts/${contract.streamChannelId}/end`, {
        method: "POST",
      }).then(r => {
        Toaster.success("Contract has now ended")
      })

      setVisibility(false);
      refreshData();
    } catch (e) {
      Console.error(e);
    } finally {
      setLoading(false)
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
            <Text style={styles.modalTitle}>End Contract</Text>
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
                : "Please provide your payment screenshot"}
            </Text>


            {!feedbackGiven && <>
              {selectedFiles.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ width: "100%", overflow: "scroll" }}
                  contentContainerStyle={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}
                >
                  {selectedFiles.map((file, index) => (
                    <View key={index} style={{ position: 'relative' }}>
                      <Pressable
                        onPress={() => {
                          setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
                        }}
                        style={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          zIndex: 1,
                          backgroundColor: Colors(theme).background,
                          borderRadius: 20,
                          padding: 2,
                        }}
                      >
                        <FontAwesomeIcon icon={faClose} size={18} color={Colors(theme).text} />
                      </Pressable>
                      {file.mimeType?.startsWith("image/") ? (
                        <Image
                          source={{ uri: file.uri }}
                          style={{ width: 100, height: 100, borderRadius: 5 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 5,
                            backgroundColor: Colors(theme).card,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: Colors(theme).text, fontSize: 12, textAlign: 'center' }}>
                            Doc
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                  <Pressable style={{
                    width: 100, height: 100, borderRadius: 5,
                    borderWidth: 1,
                    justifyContent: "center",
                    alignItems: "center"
                  }} onPress={pickDocuments}>
                    <FontAwesomeIcon icon={faPlus} size={24} color={Colors(theme).text} />
                  </Pressable>
                </ScrollView>
              )}
              {selectedFiles.length == 0 &&
                <Pressable style={{
                  width: "100%", height: 100, borderRadius: 5,
                  borderWidth: 1,
                  justifyContent: "center",
                  alignItems: "center"
                }} onPress={pickDocuments}>
                  <FontAwesomeIcon icon={faPlus} size={18} color={Colors(theme).text} />
                  <Text style={{ color: Colors(theme).text, padding: 12 }}>Upload Proof of Payment to proceed with ending the contract</Text>
                </Pressable>

              }
            </>}


            {!feedbackGiven && <>

              <Text style={{ marginTop: 50, marginBottom: 12, fontSize: 18, fontWeight: 600 }}>Please give your feedback</Text>
              <Text style={{ marginBottom: 12 }}>Rate the influencer/creator out of 5 and also tell us about your experience with this influencer</Text>
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
              <TextInput
                style={styles.textInput}
                placeholder="Write your feedback here"
                autoFocus
                value={textFeedback}
                onChangeText={(text) => setTextFeedback(text)}
                numberOfLines={5}
                multiline
              />
              <Button style={{ alignSelf: "flex-end", marginVertical: 12 }}
                onPress={provideFeedback}
                disabled={loading}
                loading={loading}>End Contract with Feedback</Button>
            </>}
            {feedbackGiven && (
              <Button style={{ alignSelf: "flex-end", marginVertical: 12 }} mode="outlined"
                onPress={() => setVisibility(false)}>Close</Button>
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
    marginTop: 10,
    marginBottom: 20,
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
    // padding: 10,
    fontSize: 16,
    marginVertical: 10,
  },
});

export default FeedbackModal;
