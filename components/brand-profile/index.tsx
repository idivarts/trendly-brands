import { useState } from "react";
import { ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

import {
  BRAND_INDUSTRIES,
  INFLUENCER_CATEGORIES,
  INITIAL_BRAND_INDUSTRIES,
  INITIAL_INFLUENCER_CATEGORIES,
} from "@/constants/ItemsList";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import { View } from "../theme/Themed";
import Colors from "@/constants/Colors";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import ImageUpload from "@/shared-uis/components/image-upload";
import TextInput from "../ui/text-input";

const BrandProfile = () => {
  const theme = useTheme();
  const [brandImage, setBrandImage] = useState("");
  const [brandProfile, setBrandProfile] = useState({
    about: "",
    brandIndustries: [] as string[],
    image: "",
    influencerCategories: [] as string[],
    name: "",
    website: "",
  });

  const handleImageUpload = (image: string) => {
    setBrandProfile({
      ...brandProfile,
      image,
    });
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        padding: 16,
      }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: 32,
        gap: 32,
      }}
    >
      <ImageUpload
        initialImage={brandProfile.image}
        onUploadImage={handleImageUpload}
        theme={theme}
      />
      <View
        style={{
          gap: 16,
        }}
      >
        <TextInput
          label={"Brand Name"}
          value={brandProfile.name}
          onChangeText={(value) =>
            setBrandProfile({
              ...brandProfile,
              name: value,
            })
          }
        />
        <TextInput
          label={"About the Brand"}
          value={brandProfile.about}
          multiline
          onChangeText={(value) =>
            setBrandProfile({
              ...brandProfile,
              about: value,
            })
          }
        />
        <TextInput
          label={"Website"}
          value={brandProfile.website}
          onChangeText={(value) =>
            setBrandProfile({
              ...brandProfile,
              website: value,
            })
          }
        />
      </View>
      <ContentWrapper
        title="Brand Industry"
        description="Specifying the industry will help us match better with relevant brands."
        theme={theme}
      >
        <MultiSelectExtendable
          buttonIcon={
            <FontAwesomeIcon
              icon={faArrowRight}
              color={Colors(theme).primary}
              size={14}
            />
          }
          buttonLabel="See Other Options"
          initialItemsList={includeSelectedItems(BRAND_INDUSTRIES, brandProfile.brandIndustries || [])}
          initialMultiselectItemsList={includeSelectedItems(INITIAL_BRAND_INDUSTRIES, brandProfile.brandIndustries || [])}
          onSelectedItemsChange={(value) => {
            setBrandProfile({
              ...brandProfile,
              brandIndustries: value.map((value) => value),
            });
          }}
          selectedItems={brandProfile.brandIndustries || []}
          theme={theme}
        />
      </ContentWrapper>
      <ContentWrapper
        title="Influencer Category"
        description="Which content format are you willing to post on your social media account for promotions."
        theme={theme}
      >
        <MultiSelectExtendable
          buttonIcon={
            <FontAwesomeIcon
              icon={faArrowRight}
              color={Colors(theme).primary}
              size={14}
            />
          }
          buttonLabel="See Other Options"
          initialItemsList={includeSelectedItems(INFLUENCER_CATEGORIES, brandProfile.influencerCategories || [])}
          initialMultiselectItemsList={includeSelectedItems(INITIAL_INFLUENCER_CATEGORIES, brandProfile.influencerCategories || [])}
          onSelectedItemsChange={(value) => {
            setBrandProfile({
              ...brandProfile,
              influencerCategories: value.map((value) => value),
            });
          }}
          selectedItems={brandProfile.influencerCategories || []}
          theme={theme}
        />
      </ContentWrapper>
    </ScrollView>
  );
};

export default BrandProfile;
