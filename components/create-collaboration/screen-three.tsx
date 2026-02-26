import {
    faCircle,
    faClose,
    faLink,
    faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Keyboard, Pressable, ScrollView } from "react-native";
import { HelperText, Modal, ProgressBar } from "react-native-paper";

import Colors from "@/shared-uis/constants/Colors";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import stylesFn from "@/styles/create-collaboration/Screen.styles";
import { Collaboration } from "@/types/Collaboration";
import { faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";
import TextInput from "../ui/text-input";
import ScreenLayout from "./screen-layout";

interface ScreenThreeProps {
    collaboration: Partial<Collaboration>;
    headerRight?: React.ReactNode;
    isEdited: boolean;
    isSubmitting: boolean;
    processMessage: string;
    processPercentage: number;
    saveAsDraft: () => Promise<void>;
    setCollaboration: React.Dispatch<
        React.SetStateAction<Partial<Collaboration>>
    >;
    setScreen: React.Dispatch<React.SetStateAction<number>>;
    submitCollaboration: () => void;
    type: "Add" | "Edit";
}

const ScreenThree: React.FC<ScreenThreeProps> = ({
    collaboration,
    headerRight,
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
    const [isExternalLinkModalVisible, setIsExternalLinkModalVisible] =
        useState(false);
    const [isQuestionsModalVisible, setIsQuestionsModalVisible] = useState(false);
    const [externalLink, setExternalLink] = useState({
        name: "",
        link: "",
    });
    const newQuestions = collaboration.questionsToInfluencers || [""];
    const [questions, setQuestions] = useState(
        newQuestions.length === 0 ? [""] : newQuestions
    );

    const handleAddExternalLink = () => {
        if (!externalLink.name || !externalLink.link) {
            Toaster.error("Please fill all fields");
            return;
        }

        setCollaboration({
            ...collaboration,
            externalLinks: [
                ...(collaboration.externalLinks || []),
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
    };

    const handleRemoveExternalLink = (index: number) => {
        setCollaboration({
            ...collaboration,
            externalLinks: collaboration.externalLinks?.filter(
                (link, i) => i !== index
            ),
        });
    };

    const handleAddQuestions = () => {
        setQuestions([...questions, ""]);
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions(questions.filter((question, i) => i !== index));
    };

    const submitNewQuestions = () => {
        const newQuestions = questions.filter((question) => question !== "");
        setCollaboration({
            ...collaboration,
            questionsToInfluencers: newQuestions,
        });

        setIsQuestionsModalVisible(false);

        if (newQuestions.length === 0) {
            setQuestions([...newQuestions, ""]);
        } else {
            setQuestions(newQuestions);
        }
    };

    return (
        <>
            <ScreenLayout
                headerRight={headerRight}
                isEdited={isEdited}
                isSubmitting={isSubmitting}
                saveAsDraft={saveAsDraft}
                screen={3}
                setScreen={setScreen}
                type={type}
            >
                <View style={styles.mainSection}>
                    <View style={styles.section}>
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
                                        style={styles.addLinkIcon}
                                    />
                                    Add Link
                                </Button>
                            }
                            theme={theme}
                            title="External Links"
                            titleStyle={styles.sectionTitle}
                        >
                            <></>
                        </ContentWrapper>
                        <View style={styles.sectionGap8}>
                            {collaboration.externalLinks?.map((link, index) => (
                                <View
                                    key={link.link}
                                    style={styles.linkItem}
                                >
                                    <FontAwesomeIcon
                                        color={Colors(theme).text}
                                        icon={faLink}
                                        size={16}
                                    />
                                    <Text style={styles.linkText}>
                                        {link.name}
                                    </Text>
                                    <Pressable onPress={() => handleRemoveExternalLink(index)}>
                                        <FontAwesomeIcon
                                            color={Colors(theme).text}
                                            icon={faTrashCan}
                                            size={16}
                                        />
                                    </Pressable>
                                </View>
                            ))}
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
                                        style={styles.addLinkIcon}
                                    />
                                    Edit Questions
                                </Button>
                            }
                            theme={theme}
                            title="Questions to Influencers"
                            titleStyle={styles.sectionTitle}
                        >
                            <></>
                        </ContentWrapper>
                        <View style={styles.sectionGap8}>
                            {collaboration.questionsToInfluencers?.map((question) => (
                                <View key={question} style={styles.questionRow}>
                                    <FontAwesomeIcon
                                        color={Colors(theme).text}
                                        icon={faCircle}
                                        size={6}
                                    />
                                    <Text>{question}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
                <View
                    style={{
                        gap: 16,
                    }}
                >
                    {processMessage && (
                        <HelperText
                            type="info"
                            style={styles.helperText}
                        >
                            {processMessage} - {processPercentage}% done
                        </HelperText>
                    )}

                    <ProgressBar
                        progress={processPercentage / 100}
                        color={Colors(theme).primary}
                        style={styles.progressBar}
                    />
                </View>

                <Button
                    loading={isSubmitting}
                    mode="contained"
                    onPress={() => setScreen(4)}
                >
                    Preview
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
                    keyboardType="url"
                    textContentType="URL"
                    autoCapitalize="none"
                    mode="outlined"
                    onChangeText={(text) => {
                        setExternalLink({
                            ...externalLink,
                            link: text,
                        });
                    }}
                    value={externalLink.link}
                />
                <View style={styles.modalButtonsRow}>
                    <Button
                        mode="outlined"
                        onPress={() => setIsExternalLinkModalVisible(false)}
                        style={styles.modalButtonFlex}
                    >
                        Cancel
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleAddExternalLink}
                        style={styles.modalButtonFlex}
                    >
                        Add Link
                    </Button>
                </View>
            </Modal>

            <Modal
                contentContainerStyle={styles.modalContainer}
                dismissable={false}
                onDismiss={() => {
                    setIsQuestionsModalVisible(false);
                    setQuestions(newQuestions.length === 0 ? [""] : newQuestions);
                }}
                visible={isQuestionsModalVisible}
            >
                <Pressable
                    style={styles.pressableDismiss}
                    onPress={() => {
                        Keyboard.dismiss();
                    }}
                />
                <View style={styles.sectionGap8}>
                    <Pressable
                        style={styles.questionsHeader}
                        onPress={() => {
                            Keyboard.dismiss();
                        }}
                    >
                        <Text style={styles.questionsTitle}>
                            Questions
                        </Text>
                        <Pressable
                            onPress={() => {
                                setIsQuestionsModalVisible(false);
                                setQuestions(newQuestions.length === 0 ? [""] : newQuestions);
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faClose}
                                size={18}
                                color={Colors(theme).primary}
                            />
                        </Pressable>
                    </Pressable>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={styles.questionsScroll}
                        contentContainerStyle={styles.questionsScrollContent}
                    >
                        {questions.map((question, index) => (
                            <View key={index} style={styles.questionInputRow}>
                                <TextInput
                                    label="Question"
                                    mode="outlined"
                                    style={styles.questionInputFlex}
                                    value={questions[index]}
                                    onChangeText={(text) => {
                                        const newQuestions = [...questions];
                                        newQuestions[index] = text;

                                        setQuestions(newQuestions);
                                    }}
                                />
                                <Pressable onPress={() => handleRemoveQuestion(index)}>
                                    <FontAwesomeIcon
                                        icon={faTrashCan}
                                        size={20}
                                        color={Colors(theme).primary}
                                        style={styles.trashIconMargin}
                                    />
                                </Pressable>
                            </View>
                        ))}
                    </ScrollView>
                </View>
                <Button mode="outlined" onPress={handleAddQuestions}>
                    <FontAwesomeIcon
                        icon={faPlus}
                        size={12}
                        color={Colors(theme).primary}
                        style={{
                            marginTop: -2,
                            marginRight: 8,
                        }}
                    />
                    Add Question
                </Button>
                <Button onPress={submitNewQuestions}>Done</Button>
            </Modal>
        </>
    );
};

export default ScreenThree;
