import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Pressable, ScrollView, View } from "react-native";

import {
    BRAND_INDUSTRIES,
    INITIAL_BRAND_INDUSTRIES
} from "@/constants/ItemsList";
import { useBreakpoints } from "@/hooks";
import ImageUpload from "@/shared-uis/components/image-upload";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import Colors from "@/shared-uis/constants/Colors";
import { includeSelectedItems } from "@/shared-uis/utils/items-list";
import { Brand } from "@/types/Brand";
import { Divider, HelperText, Text as PaperText, TextInput as PaperTextInput, Surface } from "react-native-paper";

const AGE_OPTIONS = [
    { key: "JUST_STARTING", title: "Just starting", desc: "New or pre-launch brand" },
    { key: "LT_1", title: "Less than 1 year", desc: "Operating for under 12 months" },
    { key: "LT_5", title: "Less than 5 years", desc: "Established but growing" },
    { key: "GT_5", title: "5+ years", desc: "Well established brand" },
];

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
    const { xl } = useBreakpoints();

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

    const colors = Colors(theme);
    const brandAge = brandData.age

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 24, paddingBottom: 32 }}
        >
            {/* Brand details: image on the left, fields on the right */}
            <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: colors.card }} elevation={1}>
                <PaperText variant="titleMedium" style={{ fontWeight: "800", color: colors.text }}>
                    Brand Details
                </PaperText>
                <PaperText style={{ color: colors.textSecondary, marginTop: 4 }}>
                    Add your brand logo and core details so creators can recognize you.
                </PaperText>
                <Divider style={{ marginTop: 12, marginBottom: 16, backgroundColor: colors.surface }} />

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
                    {/* Left column: image uploader */}
                    <View style={xl ? { width: 240 } : { width: "100%", alignItems: "center" }}>
                        <ImageUpload initialImage={brandData.image} onUploadImage={handleImageUpload} theme={theme} />
                        <HelperText type="info" style={{ color: colors.textSecondary, marginTop: 6 }}>
                            Recommended: square logo, 512×512 or higher
                        </HelperText>
                    </View>

                    {/* Right column: inputs */}
                    <View style={{ flex: 1, minWidth: 260, gap: 12 }}>
                        <PaperTextInput
                            mode="outlined"
                            label="Brand Name*"
                            value={brandData.name}
                            onChangeText={(value) =>
                                setBrandData({
                                    ...brandData,
                                    name: value,
                                })
                            }
                            outlineStyle={{ borderRadius: 12 }}
                            outlineColor={colors.border}
                            activeOutlineColor={colors.primary}
                            style={{ backgroundColor: colors.background }}
                        />
                        <HelperText type="info" style={{ color: colors.textSecondary, marginTop: -4 }}>
                            This will be visible on your public profile.
                        </HelperText>

                        <PaperTextInput
                            mode="outlined"
                            label="About the Brand"
                            multiline
                            value={brandData.profile?.about}
                            onChangeText={(value) =>
                                setBrandData({
                                    ...brandData,
                                    profile: {
                                        ...brandData.profile,
                                        about: value,
                                    },
                                })
                            }
                            outlineStyle={{ borderRadius: 12 }}
                            outlineColor={colors.border}
                            activeOutlineColor={colors.primary}
                            style={{ backgroundColor: colors.background }}
                        />

                        <PaperTextInput
                            mode="outlined"
                            label="Phone*"
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                            value={brandData.profile?.phone}
                            onChangeText={(value) =>
                                setBrandData({
                                    ...brandData,
                                    profile: {
                                        ...brandData.profile,
                                        phone: value,
                                    },
                                })
                            }
                            outlineStyle={{ borderRadius: 12 }}
                            outlineColor={colors.border}
                            activeOutlineColor={colors.primary}
                            style={{ backgroundColor: colors.background }}
                        />

                        <PaperTextInput
                            mode="outlined"
                            label="Website"
                            keyboardType="url"
                            autoCapitalize="none"
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
                            outlineStyle={{ borderRadius: 12 }}
                            outlineColor={colors.border}
                            activeOutlineColor={colors.primary}
                            style={{ backgroundColor: colors.background }}
                        />
                    </View>
                </View>
            </Surface>
            {/* Brand Age */}
            <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: colors.card }} elevation={1}>
                <PaperText variant="titleMedium" style={{ fontWeight: "800", color: colors.text }}>
                    Brand age
                </PaperText>
                <PaperText style={{ color: colors.textSecondary, marginTop: 4 }}>
                    How established is your brand? (required)
                </PaperText>
                <Divider style={{ marginTop: 12, marginBottom: 16, backgroundColor: colors.surface }} />

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {AGE_OPTIONS.map((opt) => {
                        const selected = brandAge === opt.key;
                        return (
                            <Pressable
                                key={opt.key}
                                onPress={() =>
                                    setBrandData({
                                        ...brandData,
                                        profile: { ...brandData.profile },
                                        age: opt.key as any,
                                    })
                                }
                                style={{
                                    flexBasis: "48%",
                                    marginBottom: 12,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: selected ? colors.primary : colors.border,
                                    backgroundColor: selected ? colors.primaryLight : colors.background,
                                    padding: 16,
                                }}
                            >
                                <PaperText style={{ fontWeight: "800", fontSize: 15, color: selected ? colors.primary : colors.text }}>
                                    {opt.title}
                                </PaperText>
                                <PaperText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                                    {opt.desc}
                                </PaperText>
                            </Pressable>
                        );
                    })}
                </View>
            </Surface>
            {/* Industry selection card */}
            <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: colors.card }} elevation={1}>
                <PaperText variant="titleMedium" style={{ fontWeight: "800", color: colors.text }}>
                    Brand Industry
                </PaperText>
                <PaperText style={{ color: colors.textSecondary, marginTop: 4 }}>
                    Specifying the industry helps us match you with relevant creators.
                </PaperText>
                <Divider style={{ marginTop: 12, marginBottom: 16, backgroundColor: colors.surface }} />

                <MultiSelectExtendable
                    buttonIcon={<FontAwesomeIcon icon={faArrowRight} color={Colors(theme).primary} size={14} />}
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
            </Surface>

            {!!action && (
                <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: colors.card }} elevation={1}>
                    {action}
                </Surface>
            )}
        </ScrollView>
    );
};

export default BrandProfile;
