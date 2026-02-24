import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Pressable, View } from "react-native";
import { Divider, Text as PaperText, Surface } from "react-native-paper";

import {
    BRAND_INDUSTRIES,
    INITIAL_BRAND_INDUSTRIES
} from "@/constants/ItemsList";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import Colors from "@/shared-uis/constants/Colors";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { Brand } from "@/types/Brand";

interface BrandIndustryProps {
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
    onBack?: () => void;
    plainSection?: boolean;
}

const BrandIndustry: React.FC<BrandIndustryProps> = ({ brandData, setBrandData, onBack, plainSection = false }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const Wrapper = plainSection ? View : Surface;
    const wrapperProps = plainSection
        ? { style: { paddingVertical: 8 } }
        : { style: { borderRadius: 16, padding: 16, backgroundColor: colors.card }, elevation: 1 };

    return (
        <Wrapper {...wrapperProps}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                {onBack && (
                    <Pressable onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
                        <PaperText style={{ fontSize: 20, color: colors.text }}>←</PaperText>
                    </Pressable>
                )}
                <PaperText variant="titleMedium" style={{ fontWeight: "800", color: colors.text }}>
                    Brand Industry
                </PaperText>
            </View>
            <PaperText style={{ color: colors.textSecondary, marginTop: 4 }}>
                Specifying the industry helps us match you with relevant creators.
            </PaperText>
            <Divider style={{ marginTop: 12, marginBottom: 16, backgroundColor: colors.surface }} />

            <MultiSelectExtendable
                buttonIcon={<FontAwesomeIcon icon={faArrowRight} color={colors.primary} size={14} />}
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
                            industries: value.map((v) => v),
                        },
                    });
                }}
                selectedItems={brandData.profile?.industries || []}
                theme={theme}
                closeOnSelect
            />
        </Wrapper>
    );
};

export default BrandIndustry;
