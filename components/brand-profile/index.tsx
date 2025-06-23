import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { ScrollView } from "react-native";

import Colors from "@/constants/Colors";
import {
  BRAND_INDUSTRIES,
  INITIAL_BRAND_INDUSTRIES
} from "@/constants/ItemsList";
import ContentWrapper from "@/shared-uis/components/content-wrapper";
import ImageUpload from "@/shared-uis/components/image-upload";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { Brand } from "@/types/Brand";
import { View } from "../theme/Themed";
import TextInput from "../ui/text-input";

interface BrandProfileProps {
  action?: React.ReactNode;
  brandData: Partial<Brand>;
  setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
  setBrandWebImage: React.Dispatch<React.SetStateAction<File | null>>;
  type?: "create" | "update";
}

const BrandProfile: React.FC<BrandProfileProps> = ({
  action,
  brandData,
  setBrandData,
  setBrandWebImage,
  type = "update",
}) => {
  const theme = useTheme();

  const handleImageUpload = (image: string | File) => {
    if (typeof image !== "string") {
      setBrandWebImage(image);
    } else {
      setBrandData({
        ...brandData,
        image,
      });
    }
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

      {(type === "create" && !!action) && action}
    </ScrollView>
  );
};

export default BrandProfile;
