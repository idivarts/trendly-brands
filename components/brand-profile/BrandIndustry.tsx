import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    BRAND_INDUSTRIES,
    INITIAL_BRAND_INDUSTRIES
} from "@/constants/ItemsList";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import Colors from "@/shared-uis/constants/Colors";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { Brand } from "@/types/Brand";
import { useTheme } from "@react-navigation/native";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Divider, Text as PaperText, Surface } from "react-native-paper";

interface BrandIndustryProps {
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
    onBack?: () => void;
    plainSection?: boolean;
    compactLayout?: boolean;
}

const BrandIndustry: React.FC<BrandIndustryProps> = ({
    brandData,
    setBrandData,
    onBack,
    plainSection = false,
    compactLayout = false,
}) => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors, compactLayout), [colors, compactLayout]);

    const Wrapper = plainSection ? View : Surface;
    const wrapperProps = plainSection
        ? { style: styles.wrapperPlain }
        : { style: styles.wrapperCard, elevation: 1 };

    return (
        <Wrapper {...wrapperProps}>
            <View style={styles.headerRow}>
                {onBack && (
                    <Pressable onPress={onBack} style={styles.backBtn}>
                        <PaperText style={styles.backArrow}>←</PaperText>
                    </Pressable>
                )}
                <PaperText variant="titleMedium" style={styles.sectionTitle}>
                    Brand Industry
                </PaperText>
            </View>
            <PaperText style={styles.subtitle}>
                Specifying the industry helps us match you with relevant creators.
            </PaperText>
            <Divider style={styles.divider} />

            <MultiSelectExtendable
                buttonIcon={<FontAwesomeIcon icon={faArrowRight} color={colors.primary} size={compactLayout ? 12 : 14} />}
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

function createStyles(colors: ReturnType<typeof Colors>, compact: boolean) {
    return StyleSheet.create({
        wrapperPlain: {
            paddingVertical: compact ? 4 : 8,
        },
        wrapperCard: {
            borderRadius: 16,
            padding: compact ? 12 : 16,
            backgroundColor: colors.card,
        },
        headerRow: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: compact ? 4 : 8,
        },
        backBtn: {
            marginRight: 12,
            padding: 4,
        },
        backArrow: {
            fontSize: compact ? 18 : 20,
            color: colors.text,
        },
        sectionTitle: {
            fontWeight: "800",
            color: colors.text,
            fontSize: compact ? 15 : undefined,
        },
        subtitle: {
            color: colors.textSecondary,
            marginTop: 4,
            fontSize: compact ? 13 : undefined,
        },
        divider: {
            marginTop: compact ? 8 : 12,
            marginBottom: compact ? 10 : 16,
            backgroundColor: colors.surface,
        },
    });
}

export default BrandIndustry;
