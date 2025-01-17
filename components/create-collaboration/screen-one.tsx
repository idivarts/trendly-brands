import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import { faGift, faHandHoldingDollar } from "@fortawesome/free-solid-svg-icons";

import { Collaboration } from "@/types/Collaboration";
import { generateEmptyAssets } from "@/shared-uis/utils/profile";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { INITIAL_LANGUAGES, LANGUAGES } from "@/constants/ItemsList";
import { NativeAssetItem, WebAssetItem } from "@/shared-uis/types/Asset";
import { processRawAttachment } from "@/utils/attachments";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import { Selector } from "@/shared-uis/components/select/selector";
import Button from "../ui/button";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import DragAndDropNative from "@/shared-uis/components/grid/native/DragAndDropNative";
import DragAndDropWeb from "@/shared-uis/components/grid/web/DragAndDropWeb";
import TextInput from "../ui/text-input";
import ScreenLayout from "./screen-layout";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import { View } from "../theme/Themed";
import { convertToKUnits } from "@/utils/conversion";
import Toaster from "@/shared-uis/components/toaster/Toaster";

interface ScreenOneProps {
  attachments: any[];
  collaboration: Partial<Collaboration>;
  handleAssetsUpdateNative: (assets: NativeAssetItem[]) => void;
  handleAssetsUpdateWeb: (assets: WebAssetItem[]) => void;
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
  handleAssetsUpdateNative,
  handleAssetsUpdateWeb,
  isEdited,
  isSubmitting,
  setCollaboration,
  setIsEdited,
  setScreen,
  type,
}) => {
  const theme = useTheme();

  const budgetText = useMemo(() => {
    if (
      collaboration.budget?.min
      && collaboration.budget?.max
      && collaboration.budget?.min > collaboration.budget?.max
    ) {
      return `Rs. ${convertToKUnits(Math.max(collaboration.budget?.min, collaboration.budget?.max))}`;
    }

    if (
      collaboration.budget?.min === collaboration.budget?.max
      || collaboration.budget?.max === 0
      || !collaboration.budget?.max
    ) {
      return `Rs. ${convertToKUnits(collaboration.budget?.min || 0)}`;
    }

    return `Rs. ${convertToKUnits(collaboration.budget?.min || 0)}-${convertToKUnits(collaboration.budget?.max || 500)}`;
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
        {
          Platform.OS === 'web' ? (
            <DragAndDropWeb
              items={attachments?.map((attachment, index) => {
                return {
                  ...processRawAttachment(attachment),
                  id: index.toString(),
                }
              }) || items.map((item, index) => {
                return {
                  ...item,
                  id: index.toString(),
                }
              })}
              onUploadAsset={handleAssetsUpdateWeb}
            />
          ) : (
            <DragAndDropNative
              items={
                generateEmptyAssets(attachments as any, items).map((item, index) => {
                  return {
                    ...item,
                    id: index,
                  }
                })
              }
              onItemsUpdate={handleAssetsUpdateNative}
            />
          )
        }

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
                    if (collaboration.budget?.max && (parseInt(text) > collaboration.budget?.max)) {
                      Toaster.error("Min budget can't be greater than max");
                    }

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
                    if (collaboration.budget?.min && (parseInt(text) < collaboration.budget?.min)) {
                      Toaster.error("Max budget can't be less than min");
                    }

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
            selectedItems={collaboration.preferredContentLanguage || []}
            theme={theme}
          />
        </ContentWrapper>
        <Button
          loading={isSubmitting}
          mode="contained"
          onPress={() => {
            if (
              !collaboration.name
            ) {
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
