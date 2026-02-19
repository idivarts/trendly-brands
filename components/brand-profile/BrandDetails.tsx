import { useTheme } from "@react-navigation/native";
import { Pressable, View } from "react-native";
import { Button, Divider, HelperText, Text as PaperText, TextInput as PaperTextInput, Surface } from "react-native-paper";

import { useBreakpoints } from "@/hooks";
import ImageUpload from "@/shared-uis/components/image-upload";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";

interface BrandDetailsProps {
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
    setBrandWebImage: React.Dispatch<React.SetStateAction<File | null>>;
    onNext?: () => void;
    onBack?: () => void;
}

const BrandDetails: React.FC<BrandDetailsProps> = ({
    brandData,
    setBrandData,
    setBrandWebImage,
    onNext,
    onBack,
}) => {
    const theme = useTheme();
    const { xl } = useBreakpoints();
    const colors = Colors(theme);

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
        <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: colors.card }} elevation={1}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                {onBack && (
                    <Pressable onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
                        <PaperText style={{ fontSize: 20, color: colors.text }}>←</PaperText>
                    </Pressable>
                )}
                <PaperText variant="titleMedium" style={{ fontWeight: "800", color: colors.text }}>
                    Brand Details
                </PaperText>
            </View>
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

            {onNext && (
                <View style={{ marginTop: 16 }}>
                    <Button
                        mode="contained"
                        onPress={onNext}
                        style={{ borderRadius: 12 }}
                        buttonColor={colors.primary}
                    >
                        Next
                    </Button>
                </View>
            )}
        </Surface>
    );
};

export default BrandDetails;
