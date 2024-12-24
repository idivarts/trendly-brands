import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { useTheme } from "@react-navigation/native";
import { BRAND_INDUSTRIES, INFLUENCER_CATEGORIES, INITIAL_BRAND_INDUSTRIES, INITIAL_INFLUENCER_CATEGORIES } from "@/constants/ItemsList";
import { useState } from "react";
import { ScrollView } from "react-native";
import TextInput from "../ui/text-input";

const BrandProfile = () => {
  const theme = useTheme();
  const [brandProfile, setBrandProfile] = useState({
    name: "",
    about: "",
    website: "",
    brandIndustries: [] as string[],
    influencerCategories: [] as string[],
  });

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
      <ContentWrapper
        title="Brand Industry"
        description="Specifying the industry will help us match better with relevant brands."
        theme={theme}
      >
        <MultiSelectExtendable
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
    </ScrollView >
  );
};

export default BrandProfile;
