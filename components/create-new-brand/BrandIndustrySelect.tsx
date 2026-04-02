import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    BRAND_INDUSTRIES,
    INITIAL_BRAND_INDUSTRIES,
} from "@/constants/ItemsList";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import Colors from "@/shared-uis/constants/Colors";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { Brand } from "@/types/Brand";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/theme/Themed";

const INDUSTRY_SUBTITLE =
    "Specifying the industry helps us match you with relevant creators.";

export interface BrandIndustrySelectProps {
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
}

const BrandIndustrySelect: React.FC<BrandIndustrySelectProps> = ({
    brandData,
    setBrandData,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const industries = brandData.profile?.industries ?? [];

    return (
        <View style={styles.wrapper}>
            <Text style={styles.subtitle}>{INDUSTRY_SUBTITLE}</Text>
            <MultiSelectExtendable
                buttonIcon={
                    <FontAwesomeIcon
                        icon={faArrowRight}
                        color={colors.primary}
                        size={14}
                    />
                }
                buttonLabel="See Other Options"
                initialItemsList={includeSelectedItems(
                    BRAND_INDUSTRIES,
                    industries
                )}
                initialMultiselectItemsList={includeSelectedItems(
                    INITIAL_BRAND_INDUSTRIES,
                    industries
                )}
                onSelectedItemsChange={(value) => {
                    setBrandData({
                        ...brandData,
                        profile: {
                            ...brandData.profile,
                            industries: value,
                        },
                    });
                }}
                selectedItems={industries}
                theme={theme}
                closeOnSelect
            />
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        wrapper: {
            marginTop: 4,
        },
        subtitle: {
            fontSize: 13,
            color: colors.textSecondary,
            marginBottom: 24,
        },
    });
}

export default BrandIndustrySelect;
