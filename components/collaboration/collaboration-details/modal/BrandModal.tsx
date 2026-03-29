import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Linking, Pressable, StyleSheet } from "react-native";

import { Text, View } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import ImageComponent from "@/shared-uis/components/image-component";
import {
    faCheck,
    faCheckCircle,
    faLink,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Chip, Modal } from "react-native-paper";

interface BrandModalProps {
    brand: {
        name: string;
        description: string;
        image: string;
        website: string;
        verified: boolean;
        category: string[];
    };
    visible: boolean;
    setVisibility: (visible: boolean) => void;
}

const BrandModal: React.FC<BrandModalProps> = ({
    brand,
    visible,
    setVisibility,
}) => {
    const theme = useTheme();
    const { width } = useBreakpoints();
    const styles = useMemo(() => useStyles(theme, width), [theme, width]);

    return (
        <Modal
            visible={visible}
            onDismiss={() => setVisibility(false)}
            contentContainerStyle={styles.modalContent}
        >
            <View style={styles.centerColumn}>
                <ImageComponent
                    url={brand.image}
                    altText="Brand Image"
                    shape="square"
                    size="medium"
                    style={styles.brandImage}
                />

                <Text style={styles.brandName}>
                    {brand.name}{" "}
                    {brand.verified && (
                        <FontAwesomeIcon
                            icon={faCheckCircle}
                            color={Colors(theme).primary}
                            size={20}
                        />
                    )}
                </Text>

                <Text style={styles.brandDescription}>
                    {brand.description}
                </Text>

                <View style={styles.categoriesRow}>
                    {brand.category.map((cat, index) => (
                        <Chip
                            key={index}
                            style={styles.chip}
                            mode="outlined"
                        >
                            <FontAwesomeIcon
                                icon={faCheck}
                                color={Colors(theme).text}
                                size={16}
                            />{" "}
                            {cat}
                        </Chip>
                    ))}
                </View>

                <Pressable
                    onPress={() => Linking.openURL(brand.website)}
                    style={styles.websiteButton}
                >
                    <Text style={styles.websiteButtonText}>
                        <FontAwesomeIcon
                            icon={faLink}
                            color={Colors(theme).white}
                            size={16}
                        />{" "}
                        Visit Website
                    </Text>
                </Pressable>
            </View>
        </Modal>
    );
};

const BRAND_MODAL_MAX_WIDTH = 560;

function useStyles(
    theme: ReturnType<typeof useTheme>,
    constrainedWidth: number
) {
    const modalMaxWidth =
        constrainedWidth > 0
            ? Math.min(
                  BRAND_MODAL_MAX_WIDTH,
                  Math.max(280, constrainedWidth - 32)
              )
            : BRAND_MODAL_MAX_WIDTH;

    return StyleSheet.create({
        modalContent: {
            backgroundColor: Colors(theme).background,
            borderRadius: 10,
            padding: 20,
            marginHorizontal: 20,
            maxWidth: modalMaxWidth,
            width: "100%",
            alignSelf: "center",
        },
        centerColumn: {
            alignItems: "center",
            gap: 20,
        },
        brandImage: {
            width: 120,
            height: 120,
            borderRadius: 10,
        },
        brandName: {
            fontSize: 24,
            fontWeight: "bold",
            color: Colors(theme).text,
            textAlign: "center",
            alignItems: "center",
        },
        brandDescription: {
            fontSize: 16,
            color: Colors(theme).text,
            textAlign: "center",
        },
        categoriesRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
        },
        chip: {
            margin: 5,
        },
        websiteButton: {
            backgroundColor: Colors(theme).primary,
            borderRadius: 5,
            paddingVertical: 10,
            paddingHorizontal: 20,
        },
        websiteButtonText: {
            fontSize: 16,
            color: Colors(theme).white,
            fontWeight: "bold",
        },
    });
}

export default BrandModal;
