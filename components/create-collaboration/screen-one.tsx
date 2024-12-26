import React from "react";
import { Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import { faDollarSign, faVideo } from "@fortawesome/free-solid-svg-icons";

import { Collaboration } from "@/types/Collaboration";
import { generateEmptyAssets } from "@/shared-uis/utils/profile";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { INITIAL_LANGUAGES, LANGUAGES } from "@/constants/ItemsList";
import { MultiRangeSlider } from "@/shared-uis/components/multislider";
import { NativeAssetItem, WebAssetItem } from "@/shared-uis/types/Asset";
import { processRawAttachment } from "@/utils/attachments";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import { Selector } from "@/shared-uis/components/select/selector";
import Button from "../ui/button";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import DragAndDropNative from "@/shared-uis/components/grid/native/DragAndDropNative";
import DragAndDropWeb from "@/shared-uis/components/grid/web/DragAndDropWeb";
import stylesFn from "@/styles/create-collaboration/Screen.styles";
import TextInput from "../ui/text-input";
import ScreenLayout from "./screen-layout";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import { View } from "../theme/Themed";

interface ScreenOneProps {
  attachments: any[];
  collaboration: Partial<Collaboration>;
  handleAssetsUpdateNative: (assets: NativeAssetItem[]) => void;
  handleAssetsUpdateWeb: (assets: WebAssetItem[]) => void;
  setCollaboration: React.Dispatch<React.SetStateAction<Partial<Collaboration>>>;
  setScreen: React.Dispatch<React.SetStateAction<number>>;
  type: "Add" | "Edit";
}

const ScreenOne: React.FC<ScreenOneProps> = ({
  attachments,
  collaboration,
  handleAssetsUpdateNative,
  handleAssetsUpdateWeb,
  setScreen,
  setCollaboration,
  type,
}) => {
  const theme = useTheme();

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
            onChangeText={(text) => {
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
            // multiline
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
                icon: faVideo,
                label: 'Barter Collab',
                value: 'Barter Collab',
              },
              {
                icon: faDollarSign,
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
              rightText={`Rs. ${collaboration.budget?.min || 0}-${collaboration.budget?.max || 10000}`}
              theme={theme}
              title="Collaboration Budget"
              titleStyle={{
                fontSize: 16,
              }}
            >
              <MultiRangeSlider
                containerStyle={{
                  paddingHorizontal: 8,
                }}
                maxValue={10000}
                minValue={0}
                step={100}
                sliderLength={352}
                theme={theme}
                onValuesChange={(values) => {
                  setCollaboration({
                    ...collaboration,
                    budget: {
                      min: values[0],
                      max: values[1],
                    },
                  });
                }}
                values={[collaboration.budget?.min || 0, collaboration.budget?.max || 10000]}
              />
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
          mode="contained"
          onPress={() => {
            // if (
            //   !collaboration.name ||
            //   !collaboration.description ||
            //   !collaboration.promotionType ||
            //   (collaboration.promotionType === 'Paid Collab' && (!collaboration.budget?.min || !collaboration.budget?.max)) ||
            //   !collaboration.preferredContentLanguage
            // ) {
            //   Toaster.error("Please fill all fields");
            //   return;
            // }
            setScreen(2);
          }}
        >
          Next
        </Button>
      </ScreenLayout>
    </>
  );
};

export default ScreenOne;
