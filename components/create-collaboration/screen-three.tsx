import React, { useState } from "react";
import { Pressable } from "react-native";
import { HelperText, Modal, ProgressBar } from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChain, faCircle, faPlus } from "@fortawesome/free-solid-svg-icons";

import { Collaboration } from "@/types/Collaboration";
import { faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";
import Colors from "@/constants/Colors";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import ScreenLayout from "./screen-layout";
import stylesFn from "@/styles/create-collaboration/Screen.styles";
import TextInput from "../ui/text-input";
import Toaster from "@/shared-uis/components/toaster/Toaster";

interface ScreenThreeProps {
  collaboration: Partial<Collaboration>;
  isEdited: boolean;
  isSubmitting: boolean;
  processMessage: string;
  processPercentage: number;
  saveAsDraft: () => Promise<void>;
  setCollaboration: React.Dispatch<React.SetStateAction<Partial<Collaboration>>>;
  setScreen: React.Dispatch<React.SetStateAction<number>>;
  submitCollaboration: () => void;
  type: "Add" | "Edit";
}

const ScreenThree: React.FC<ScreenThreeProps> = ({
  collaboration,
  isEdited,
  isSubmitting,
  processMessage,
  processPercentage,
  saveAsDraft,
  setCollaboration,
  setScreen,
  submitCollaboration,
  type,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);
  const [isExternalLinkModalVisible, setIsExternalLinkModalVisible] = useState(false);
  const [isQuestionsModalVisible, setIsQuestionsModalVisible] = useState(false);
  const [externalLink, setExternalLink] = useState({
    name: "",
    link: "",
  });
  const [questions, setQuestions] = useState(collaboration.questionsToInfluencers || []);

  const handleAddExternalLink = () => {
    if (!externalLink.name || !externalLink.link) {
      Toaster.error("Please fill all fields");
      return;
    }

    setCollaboration({
      ...collaboration,
      externalLinks: [
        ...collaboration.externalLinks || [],
        {
          name: externalLink.name,
          link: externalLink.link,
        },
      ],
    });
    setIsExternalLinkModalVisible(false);
    setExternalLink({
      name: "",
      link: "",
    });
  }

  const handleRemoveExternalLink = (index: number) => {
    setCollaboration({
      ...collaboration,
      externalLinks: collaboration.externalLinks?.filter((link, i) => i !== index),
    });
  }

  const handleAddQuestions = () => {
    setQuestions([
      ...questions,
      "",
    ]);
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((question, i) => i !== index));
  }

  const submitNewQuestions = () => {
    const newQuestions = questions.filter((question) => question !== "");
    setCollaboration({
      ...collaboration,
      questionsToInfluencers: newQuestions,
    });

    setIsQuestionsModalVisible(false);
    setQuestions(newQuestions);
  }

  return (
    <>
      <ScreenLayout
        isEdited={isEdited}
        isSubmitting={isSubmitting}
        saveAsDraft={saveAsDraft}
        screen={3}
        setScreen={setScreen}
        type={type}
      >
        <View
          style={{
            flexGrow: 1,
            gap: 16,
          }}
        >
          <View
            style={{
              gap: 16,
            }}
          >
            <ContentWrapper
              description="You can use this to add links like your website of any product link or any document links."
              rightAction={
                <Button
                  mode="outlined"
                  onPress={() => setIsExternalLinkModalVisible(true)}
                  size="small"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    size={12}
                    color={Colors(theme).primary}
                    style={{
                      marginTop: -2,
                      marginRight: 8,
                    }}
                  />
                  Add Link
                </Button>
              }
              theme={theme}
              title="External Links"
              titleStyle={{
                fontSize: 16,
              }}
            >
              <></>
            </ContentWrapper>
            <View
              style={{
                gap: 8,
              }}
            >
              {
                collaboration.externalLinks?.map((link) => (
                  <View
                    key={link.link}
                    style={{
                      alignItems: "center",
                      flexDirection: "row",
                      gap: 12,
                      padding: 8,
                      borderColor: Colors(theme).text,
                      borderWidth: 1,
                      borderRadius: 10,
                    }}
                  >
                    <FontAwesomeIcon
                      color={Colors(theme).text}
                      icon={faChain}
                      size={16}
                    />
                    <Text
                      style={{
                        textDecorationLine: "underline",
                        flex: 1,
                      }}
                    >
                      {link.name}
                    </Text>
                    <Pressable
                      onPress={() => handleRemoveExternalLink(collaboration.externalLinks?.indexOf(link) || 0)}
                    >
                      <FontAwesomeIcon
                        color={Colors(theme).text}
                        icon={faTrashCan}
                        size={16}
                      />
                    </Pressable>
                  </View>
                ))
              }
            </View>
          </View>
          <View
            style={{
              gap: 16,
            }}
          >
            <ContentWrapper
              description="These would be asked to the influencers while applying for this collaboration."
              rightAction={
                <Button
                  mode="outlined"
                  onPress={() => setIsQuestionsModalVisible(true)}
                  size="small"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    size={12}
                    color={Colors(theme).primary}
                    style={{
                      marginTop: -2,
                      marginRight: 8,
                    }}
                  />
                  Edit Questions
                </Button>
              }
              theme={theme}
              title="Questions to Influencers"
              titleStyle={{
                fontSize: 16,
              }}
            >
              <></>
            </ContentWrapper>
            <View
              style={{
                gap: 8,
              }}
            >
              {
                collaboration.questionsToInfluencers?.map((question) => (
                  <View
                    key={question}
                    style={{
                      alignItems: "center",
                      flexDirection: "row",
                      gap: 8,
                    }}
                  >
                    <FontAwesomeIcon
                      color={Colors(theme).text}
                      icon={faCircle}
                      size={6}
                    />
                    <Text>
                      {question}
                    </Text>
                  </View>
                ))
              }
            </View>
          </View>
        </View>
        <View
          style={{
            gap: 16,
          }}
        >
          {
            processMessage && (
              <HelperText
                type="info"
                style={{
                  color: Colors(theme).primary,
                  textAlign: "center",
                }}
              >
                {processMessage} - {processPercentage}% done
              </HelperText>
            )
          }

          <ProgressBar
            progress={processPercentage / 100}
            color={Colors(theme).primary}
            style={{
              backgroundColor: Colors(theme).transparent
            }}
          />
        </View>

        <Button
          loading={isSubmitting}
          mode="contained"
          onPress={submitCollaboration}
        >
          {type === "Add" ? `${isSubmitting ? "Posting" : "Post"}` : `${isSubmitting ? "Updating" : "Update"}`}
        </Button>
      </ScreenLayout>

      <Modal
        contentContainerStyle={styles.modalContainer}
        onDismiss={() => {
          setIsExternalLinkModalVisible(false);
          setExternalLink({
            name: "",
            link: "",
          });
        }}
        visible={isExternalLinkModalVisible}
      >
        <TextInput
          label="Link Name"
          mode="outlined"
          onChangeText={(text) => {
            setExternalLink({
              ...externalLink,
              name: text,
            });
          }}
          value={externalLink.name}
        />
        <TextInput
          label="Link URL"
          mode="outlined"
          onChangeText={(text) => {
            setExternalLink({
              ...externalLink,
              link: text,
            });
          }}
          value={externalLink.link}
        />
        <View
          style={{
            flexDirection: "row",
            gap: 8,
          }}
        >
          <Button
            mode="outlined"
            onPress={() => setIsExternalLinkModalVisible(false)}
            style={{
              flex: 1,
            }}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleAddExternalLink}
            style={{
              flex: 1,
            }}
          >
            Add Link
          </Button>
        </View>
      </Modal>

      <Modal
        contentContainerStyle={styles.modalContainer}
        onDismiss={() => {
          setIsQuestionsModalVisible(false);
          setQuestions(collaboration.questionsToInfluencers || []);
        }}
        visible={isQuestionsModalVisible}
      >
        <View
          style={{
            gap: 8,
          }}
        >
          {
            questions.map((question, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <TextInput
                  label="Question"
                  mode="outlined"
                  style={{
                    flex: 1,
                  }}
                  value={questions[index]}
                  onChangeText={(text) => {
                    const newQuestions = [...questions];
                    newQuestions[index] = text;

                    setQuestions(newQuestions);
                  }}
                />
                <Pressable
                  onPress={() => handleRemoveQuestion(index)}
                >
                  <FontAwesomeIcon
                    icon={faTrashCan}
                    size={20}
                    color={Colors(theme).primary}
                    style={{
                      marginTop: 4,
                    }}
                  />
                </Pressable>
              </View>
            ))
          }
        </View>
        <Button
          mode="outlined"
          onPress={handleAddQuestions}
        >
          <FontAwesomeIcon
            icon={faPlus}
            size={12}
            color={Colors(theme).primary}
            style={{
              marginTop: -2,
              marginRight: 8,
            }}
          />
          Add Questions
        </Button>
        <Button
          onPress={submitNewQuestions}
        >
          Done
        </Button>
      </Modal>
    </>
  );
};

export default ScreenThree;
