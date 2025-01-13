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
import { Brand } from "@/types/Brand";
import Select from "../ui/select";

interface BrandProfileProps {
  action?: React.ReactNode;
  brandData: Partial<Brand>;
  setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
  type?: "create" | "update";
}

const BrandProfile: React.FC<BrandProfileProps> = ({
  action,
  brandData,
  setBrandData,
  type = "update",
}) => {
  const theme = useTheme();

  const handleImageUpload = (image: string) => {
    setBrandData({
      ...brandData,
      image,
    });
  };

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
        initialImage={brandData.image}
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
          value={brandData.name}
          onChangeText={(value) =>
            setBrandData({
              ...brandData,
              name: value,
            })
          }
        />
        <TextInput
          label={"About the Brand"}
          value={brandData.profile?.about}
          multiline
          onChangeText={(value) =>
            setBrandData({
              ...brandData,
              profile: {
                ...brandData.profile,
                about: value,
              },
            })
          }
        />
        <TextInput
          label={"Website"}
          value={brandData.profile?.website}
          onChangeText={(value) =>
            setBrandData({
              ...brandData,
              profile: {
                ...brandData.profile,
                website: value,
              },
            })
          }
          autoCapitalize="none"
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
          initialItemsList={includeSelectedItems(
            BRAND_INDUSTRIES,
            brandData.profile?.industries || []
          )}
          initialMultiselectItemsList={includeSelectedItems(
            INITIAL_BRAND_INDUSTRIES,
            brandData.profile?.industries || []
          )}
          onSelectedItemsChange={(value) => {
            setBrandData({
              ...brandData,
              profile: {
                ...brandData.profile,
                industries: value.map((value) => value),
              },
            });
          }}
          selectedItems={brandData.profile?.industries || []}
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
          initialItemsList={includeSelectedItems(
            INFLUENCER_CATEGORIES,
            brandData.preferences?.influencerCategories || []
          )}
          initialMultiselectItemsList={includeSelectedItems(
            INITIAL_INFLUENCER_CATEGORIES,
            brandData.preferences?.influencerCategories || []
          )}
          onSelectedItemsChange={(value) => {
            setBrandData({
              ...brandData,
              preferences: {
                ...brandData.preferences,
                influencerCategories: value.map((value) => value),
              },
            });
          }}
          selectedItems={brandData.preferences?.influencerCategories || []}
          theme={theme}
        />
      </ContentWrapper>
      <ContentWrapper
        title="Promotion Type"
        description="What type of promotion are you looking for?"
        theme={theme}
      >
        <Select
          items={[
            { label: "Paid", value: "Paid" },
            { label: "Unpaid", value: "Unpaid" },
            { label: "Barter", value: "Barter" },
          ]}
          multiselect
          onSelect={(item) => {
            setBrandData({
              ...brandData,
              preferences: {
                ...brandData.preferences,
                promotionType: item.map((item) => item.value),
              },
            });
          }}
          selectItemIcon
          value={
            brandData.preferences?.promotionType?.map((value) => ({
              label: value,
              value,
            })) || []
          }
        />
      </ContentWrapper>

      {type === "create" && action && action}
    </ScrollView>
  );
};

export default BrandProfile;
