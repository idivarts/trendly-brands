import {
    faLink,
    faPen,
    faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable } from "react-native";
import { HelperText, Modal, Portal, ProgressBar } from "react-native-paper";

import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { isValidHttpUrl, normalizeHttpUrl } from "@/shared-libs/utils/http-url";
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
    const { xl, width } = useBreakpoints();
    const styles = useMemo(
        () => stylesFn(theme, { xl, width }),
        [theme, xl, width],
    );
    const [isExternalLinkModalVisible, setIsExternalLinkModalVisible] =
        useState(false);
    const [isQuestionModalVisible, setIsQuestionModalVisible] = useState(false);
    const [questionDraft, setQuestionDraft] = useState("");
    const [questionEditIndex, setQuestionEditIndex] = useState<number | null>(
        null,
    );
    const [externalLink, setExternalLink] = useState({
        name: "",
        link: "",
    });
    const [externalLinkUrlError, setExternalLinkUrlError] = useState("");
    const questionsList = collaboration.questionsToInfluencers ?? [];

    const closeExternalLinkModal = () => {
        setIsExternalLinkModalVisible(false);
        setExternalLink({
            name: "",
            link: "",
        });
        setExternalLinkUrlError("");
    };

    const handleAddExternalLink = () => {
        if (!externalLink.name?.trim() || !externalLink.link?.trim()) {
            Toaster.error("Please fill all fields");
            return;
        }

        if (!isValidHttpUrl(externalLink.link)) {
            setExternalLinkUrlError(
                "Enter a valid URL using http or https (e.g. https://example.com).",
            );
            return;
        }

        setExternalLinkUrlError("");
        const linkToStore = normalizeHttpUrl(externalLink.link);

        setCollaboration({
            ...collaboration,
            externalLinks: [
                ...(collaboration.externalLinks || []),
                {
                    name: externalLink.name.trim(),
                    link: linkToStore,
                },
            ],
        });
        closeExternalLinkModal();
    };

    const handleRemoveExternalLink = (index: number) => {
        setCollaboration({
            ...collaboration,
            externalLinks: collaboration.externalLinks?.filter(
                (link, i) => i !== index
            ),
        });
    };

    const closeQuestionModal = () => {
        setIsQuestionModalVisible(false);
        setQuestionDraft("");
        setQuestionEditIndex(null);
    };

    const openAddQuestionModal = () => {
        setQuestionEditIndex(null);
        setQuestionDraft("");
        setIsQuestionModalVisible(true);
    };

    const openEditQuestionModal = (index: number) => {
        const q = questionsList[index];
        if (q === undefined) {
            return;
        }
        setQuestionEditIndex(index);
        setQuestionDraft(q);
        setIsQuestionModalVisible(true);
    };

    const saveQuestion = () => {
        const trimmed = questionDraft.trim();
        if (!trimmed) {
            Toaster.error("Please enter a question");
            return;
        }

        const current = collaboration.questionsToInfluencers ?? [];
        if (questionEditIndex === null) {
            setCollaboration({
                ...collaboration,
                questionsToInfluencers: [...current, trimmed],
            });
        } else {
            const next = [...current];
            next[questionEditIndex] = trimmed;
            setCollaboration({
                ...collaboration,
                questionsToInfluencers: next,
            });
        }
        closeQuestionModal();
    };

    const deleteQuestion = (index: number) => {
        const current = collaboration.questionsToInfluencers ?? [];
        setCollaboration({
            ...collaboration,
            questionsToInfluencers: current.filter((_, i) => i !== index),
        });
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
                                    onPress={() => {
                                        setExternalLinkUrlError("");
                                        setIsExternalLinkModalVisible(true);
                                    }}
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
                                    onPress={openAddQuestionModal}
                                    size="small"
                                >
                                    <FontAwesomeIcon
                                        icon={faPlus}
                                        size={12}
                                        color={Colors(theme).primary}
                                        style={styles.addLinkIcon}
                                    />
                                    Add Question
                                </Button>
                            }
                            theme={theme}
                            title="Questions to Influencers"
                            titleStyle={styles.sectionTitle}
                        >
                            <></>
                        </ContentWrapper>
                        <View style={styles.sectionGap8}>
                            {questionsList.map((question, index) => (
                                <View
                                    key={`q-${index}`}
                                    style={styles.questionListItem}
                                >
                                    <Text style={styles.questionListText}>
                                        {question}
                                    </Text>
                                    <View style={styles.questionListActions}>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel="Edit question"
                                            onPress={() => openEditQuestionModal(index)}
                                        >
                                            <FontAwesomeIcon
                                                color={Colors(theme).primary}
                                                icon={faPen}
                                                size={16}
                                            />
                                        </Pressable>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel="Delete question"
                                            onPress={() => deleteQuestion(index)}
                                        >
                                            <FontAwesomeIcon
                                                color={Colors(theme).text}
                                                icon={faTrashCan}
                                                size={16}
                                            />
                                        </Pressable>
                                    </View>
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

            <Portal>
                <Modal
                    contentContainerStyle={styles.modalContainer}
                    onDismiss={closeExternalLinkModal}
                    style={styles.modalRoot}
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
                    <View style={styles.linkUrlFieldGroup}>
                        <TextInput
                            error={Boolean(externalLinkUrlError)}
                            label="Link URL"
                            keyboardType="url"
                            textContentType="URL"
                            autoCapitalize="none"
                            mode="outlined"
                            onChangeText={(text) => {
                                setExternalLinkUrlError("");
                                setExternalLink({
                                    ...externalLink,
                                    link: text,
                                });
                            }}
                            value={externalLink.link}
                        />
                        <HelperText
                            padding="none"
                            type="error"
                            visible={Boolean(externalLinkUrlError)}
                            style={styles.linkUrlErrorHelper}
                        >
                            {externalLinkUrlError}
                        </HelperText>
                    </View>
                    <View style={styles.modalButtonsRow}>
                        <Button
                            mode="outlined"
                            onPress={closeExternalLinkModal}
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
            </Portal>

            <Portal>
                <Modal
                    contentContainerStyle={styles.modalContainer}
                    onDismiss={closeQuestionModal}
                    style={styles.modalRoot}
                    visible={isQuestionModalVisible}
                >
                    <Text style={styles.questionModalTitle}>
                        {questionEditIndex === null ? "Add question" : "Edit question"}
                    </Text>
                    <TextInput
                        label="Question"
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        onChangeText={setQuestionDraft}
                        value={questionDraft}
                    />
                    <View style={styles.modalButtonsRow}>
                        <Button
                            mode="outlined"
                            onPress={closeQuestionModal}
                            style={styles.modalButtonFlex}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={saveQuestion}
                            style={styles.modalButtonFlex}
                        >
                            {questionEditIndex === null ? "Add" : "Save"}
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </>
    );
};

export default ScreenThree;
