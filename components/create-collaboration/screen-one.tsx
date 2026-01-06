import { faGift, faHandHoldingDollar } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";

import { INITIAL_LANGUAGES, LANGUAGES } from "@/constants/ItemsList";
import { CURRENCY } from "@/constants/Unit";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import DragAndDropGrid from "@/shared-libs/functional-uis/grid/DragAndDropGrid";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import { Selector } from "@/shared-uis/components/select/selector";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { Collaboration } from "@/types/Collaboration";
import { convertToKUnits } from "@/utils/conversion";
import { View } from "../theme/Themed";
import Button from "../ui/button";
import TextInput from "../ui/text-input";
import ScreenLayout from "./screen-layout";

interface ScreenOneProps {
    attachments: any[];
    collaboration: Partial<Collaboration>;
    setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
    // handleAssetsUpdateNative: (assets: NativeAssetItem[]) => void;
    // handleAssetsUpdateWeb: (assets: WebAssetItem[]) => void;
    isEdited: boolean;
    isSubmitting: boolean;
    setCollaboration: React.Dispatch<React.SetStateAction<Partial<Collaboration>>>;
    setIsEdited: React.Dispatch<React.SetStateAction<boolean>>;
    setScreen: React.Dispatch<React.SetStateAction<number>>;
    type: "Add" | "Edit";
}

const ScreenOne: React.FC<ScreenOneProps> = ({
    attachments,
    collaboration,
    setAttachments,
    isEdited,
    isSubmitting,
    setCollaboration,
    setIsEdited,
    setScreen,
    type,
}) => {
    const theme = useTheme();
    const [onAssetUpload, setOnAssetUpload] = useState(false);

    const budgetText = useMemo(() => {
        if (
            collaboration.budget?.min
            && collaboration.budget?.max
            && collaboration.budget?.min > collaboration.budget?.max
        ) {
            return `${CURRENCY}. ${convertToKUnits(Math.max(collaboration.budget?.min, collaboration.budget?.max))}`;
        }

        if (
            collaboration.budget?.min === collaboration.budget?.max
            || collaboration.budget?.max === 0
            || !collaboration.budget?.max
        ) {
            return `${CURRENCY}. ${convertToKUnits(collaboration.budget?.min || 0)}`;
        }

        return `${CURRENCY}.  ${convertToKUnits(collaboration.budget?.min || 0)}-${convertToKUnits(collaboration.budget?.max || 500)}`;
    }, [collaboration.budget]);

    const items = [
        { url: '', type: '' },
        { url: '', type: '' },
        { url: '', type: '' },
        { url: '', type: '' },
        { url: '', type: '' },
        { url: '', type: '' },
    ];

    return (
        <>
            <ScreenLayout
                isEdited={isEdited}
                screen={1}
                setScreen={setScreen}
                type={type}
            >
                <DragAndDropGrid attachments={attachments || []}
                    onAttachmentChange={(attachments) => {
                        setAttachments(attachments);
                    }}
                    onLoadStateChange={(loading) => {
                        setOnAssetUpload(loading);
                    }}
                />

                <View
                    style={{
                        gap: 8,
                    }}
                >
                    <TextInput
                        label="Collaboration Name"
                        mode="outlined"
                        multiline
                        numberOfLines={2}
                        onChangeText={(text) => {
                            if (!isEdited) {
                                setIsEdited(true);
                            }

                            setCollaboration({
                                ...collaboration,
                                name: text,
                            });
                        }}
                        value={collaboration.name}
                    />
                    <TextInput
                        label="About this Collaboration"
                        mode="outlined"
                        multiline
                        numberOfLines={4}
                        style={{
                            minHeight: 100,
                        }}
                        onChangeText={(text) => {
                            setCollaboration({
                                ...collaboration,
                                description: text,
                            });
                        }}
                        value={collaboration.description}
                    />
                </View>
                <ContentWrapper
                    theme={theme}
                    title="Promotion Type"
                    titleStyle={{
                        fontSize: 16,
                    }}
                >
                    <Selector
                        options={[
                            {
                                icon: faGift,
                                label: 'Barter Collab',
                                value: 'Barter Collab',
                            },
                            {
                                icon: faHandHoldingDollar,
                                label: 'Paid Collab',
                                value: 'Paid Collab',
                            },
                        ]}
                        onSelect={(value) => {
                            setCollaboration({
                                ...collaboration,
                                promotionType: value as PromotionType,
                            });
                        }}
                        selectedValue={collaboration.promotionType}
                        theme={theme}
                    />
                </ContentWrapper>
                {
                    collaboration.promotionType === 'Paid Collab' && (
                        <ContentWrapper
                            rightText={budgetText}
                            theme={theme}
                            title="Collaboration Budget"
                            titleStyle={{
                                fontSize: 16,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    gap: 8,
                                }}
                            >
                                <TextInput
                                    keyboardType="number-pad"
                                    label="Min (Rs)"
                                    mode="outlined"
                                    onChangeText={(text) => {
                                        setCollaboration({
                                            ...collaboration,
                                            budget: {
                                                ...collaboration.budget,
                                                min: parseInt(text),
                                            },
                                        });
                                    }}
                                    style={{
                                        flex: 1,
                                    }}
                                    value={collaboration.budget?.min === 0 ? '0' : collaboration.budget?.min ? collaboration.budget?.min.toString() : ''}
                                />
                                <TextInput
                                    keyboardType="number-pad"
                                    label="Max (Rs)"
                                    mode="outlined"
                                    onChangeText={(text) => {
                                        setCollaboration({
                                            ...collaboration,
                                            budget: {
                                                ...collaboration.budget,
                                                max: parseInt(text),
                                            },
                                        });
                                    }}
                                    style={{
                                        flex: 1,
                                    }}
                                    value={collaboration.budget?.max === 0 ? '0' : collaboration.budget?.max ? collaboration.budget?.max.toString() : ''}
                                />
                            </View>
                        </ContentWrapper>
                    )
                }
                <ContentWrapper
                    theme={theme}
                    title="Language"
                    titleStyle={{
                        fontSize: 16,
                    }}
                >
                    <MultiSelectExtendable
                        buttonLabel="Add Language"
                        initialMultiselectItemsList={INITIAL_LANGUAGES}
                        initialItemsList={includeSelectedItems(LANGUAGES, collaboration.preferredContentLanguage || [])}
                        onSelectedItemsChange={(value) => {
                            setCollaboration({
                                ...collaboration,
                                preferredContentLanguage: value,
                            });
                        }}
                        closeOnSelect
                        selectedItems={collaboration.preferredContentLanguage || []}
                        theme={theme}
                    />
                </ContentWrapper>
                <Button
                    loading={isSubmitting}
                    mode="contained"
                    onPress={() => {
                        if (onAssetUpload) {
                            Toaster.info("Media is still uploading", "Please wait till all the media is uploaded");
                            return;
                        }
                        if (!collaboration.name) {
                            Toaster.error("Collaboration name is required");
                            return;
                        }

                        if (
                            collaboration.budget?.min && collaboration.budget?.max
                            && collaboration.budget?.min > collaboration.budget?.max
                        ) {
                            Toaster.error("Min budget can't be greater than max");
                            return;
                        }

                        setScreen(2);
                    }}
                >
                    {isSubmitting ? "Saving" : "Next"}
                </Button>
            </ScreenLayout>
        </>
    );
};

export default ScreenOne;
