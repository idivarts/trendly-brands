import { Image, Pressable, Linking } from "react-native";
import { useTheme } from "@react-navigation/native";

import { Text, View } from "@/components/theme/Themed";
import stylesFn from "@/styles/modal/UploadModal.styles";
import { Chip, Modal } from "react-native-paper";
import Colors from "@/constants/Colors";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

interface BrandModalProps {
  brandName: string;
  brandDescription: string;
  brandImage: string;
  brandWebsite: string;
  visible: boolean;
  category: string[];
  brandVerified: boolean;
  setVisibility: (visible: boolean) => void;
}

const BrandModal: React.FC<BrandModalProps> = ({
  brandName,
  brandDescription,
  brandImage,
  visible,
  brandWebsite,
  category,
  brandVerified: paymentVerified,
  setVisibility,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <Modal
      visible={visible}
      onDismiss={() => setVisibility(false)}
      contentContainerStyle={{
        backgroundColor: Colors(theme).background,
        borderRadius: 10,
        padding: 20,
        marginHorizontal: 20,
      }}
    >
      <View style={{ alignItems: "center", gap: 20 }}>
        {/* Brand Image */}
        <Image
          source={{ uri: brandImage }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 10,
          }}
        />

        {/* Brand Name */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: Colors(theme).text,
            textAlign: "center",
            alignItems: "center",
          }}
        >
          {brandName}{" "}
          {paymentVerified && (
            <FontAwesomeIcon
              icon={faCheckCircle}
              color={Colors(theme).primary}
              size={20}
            />
          )}
        </Text>

        {/* Brand Description */}
        <Text
          style={{
            fontSize: 16,
            color: Colors(theme).text,
            textAlign: "center",
          }}
        >
          {brandDescription}
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {category.map((cat, index) => (
            <Chip
              key={index}
              style={{
                margin: 5,
              }}
              mode="outlined"
            >
              {cat}
            </Chip>
          ))}
        </View>

        {/* Brand Website */}
        <Pressable
          onPress={() => Linking.openURL(brandWebsite)}
          style={{
            backgroundColor: Colors(theme).primary,
            borderRadius: 5,
            paddingVertical: 10,
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: "white",
              fontWeight: "bold",
            }}
          >
            Visit Website
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
};

export default BrandModal;
