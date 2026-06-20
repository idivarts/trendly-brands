import { useBreakpoints } from "@/hooks";
import ImageUpload from "@/shared-uis/components/image-upload";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { useTheme } from "@react-navigation/native";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Divider, HelperText, Text as PaperText, TextInput as PaperTextInput, Surface } from "react-native-paper";

interface BrandDetailsProps {
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
    setBrandWebImage: React.Dispatch<React.SetStateAction<File | null>>;
    onNext?: () => void;
    onBack?: () => void;
    plainSection?: boolean;
    /** Smaller inputs and spacing for 2-column web form */
    compactLayout?: boolean;
}

const BrandDetails: React.FC<BrandDetailsProps> = ({
    brandData,
    setBrandData,
    setBrandWebImage,
    onNext,
    onBack,
    plainSection = false,
    compactLayout = false,
}) => {
    const theme = useTheme();
    const { xl } = useBreakpoints();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors, compactLayout, xl), [colors, compactLayout, xl]);

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

    const Wrapper = plainSection ? View : Surface;
    const wrapperProps = plainSection
        ? { style: styles.wrapperPlain }
        : { style: styles.wrapperCard, elevation: 1 as const };

    return (
        <Wrapper {...wrapperProps}>
            <View style={styles.headerRow}>
                {onBack && (
                    <Pressable onPress={onBack} style={styles.backBtn}>
                        <PaperText style={styles.backArrow}>←</PaperText>
                    </Pressable>
                )}
                <PaperText variant="titleMedium" style={styles.sectionTitle}>
                    Brand Details
                </PaperText>
            </View>
            <PaperText style={styles.subtitle}>
                Add your brand logo and core details so creators can recognize you.
            </PaperText>
            <Divider style={styles.divider} />

            <View style={styles.contentRow}>
                <View style={[styles.imageCol, (!xl || compactLayout) && styles.imageColCenter]}>
                    <ImageUpload initialImage={brandData.image} onUploadImage={handleImageUpload} theme={theme} />
                    <HelperText type="info" style={styles.helperImage}>
                        Recommended: square logo, 512×512 or higher
                    </HelperText>
                </View>
                <View style={styles.inputsCol}>
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
                        outlineStyle={styles.inputOutline}
                        outlineColor={colors.border}
                        activeOutlineColor={colors.primary}
                        style={styles.input}
                        contentStyle={compactLayout ? styles.inputContentCompact : undefined}
                    />
                    <HelperText type="info" style={styles.helperName}>
                        This will be visible on your public profile.
                    </HelperText>

                    <PaperTextInput
                        mode="outlined"
                        label="About the Brand"
                        multiline
                        numberOfLines={compactLayout ? 2 : 4}
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
                        outlineStyle={styles.inputOutline}
                        outlineColor={colors.border}
                        activeOutlineColor={colors.primary}
                        style={styles.input}
                        contentStyle={compactLayout ? styles.inputContentCompact : undefined}
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
                        outlineStyle={styles.inputOutline}
                        outlineColor={colors.border}
                        activeOutlineColor={colors.primary}
                        style={styles.input}
                        contentStyle={compactLayout ? styles.inputContentCompact : undefined}
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
                        outlineStyle={styles.inputOutline}
                        outlineColor={colors.border}
                        activeOutlineColor={colors.primary}
                        style={styles.input}
                        contentStyle={compactLayout ? styles.inputContentCompact : undefined}
                    />
                </View>
            </View>

            {onNext && (
                <View style={styles.nextWrap}>
                    <Button
                        mode="contained"
                        onPress={onNext}
                        style={styles.nextButton}
                        buttonColor={colors.primary}
                        compact={compactLayout}
                    >
                        Next
                    </Button>
                </View>
            )}
        </Wrapper>
    );
};

function createStyles(
    colors: ReturnType<typeof Colors>,
    compact: boolean,
    xl: boolean
) {
    const inputRadius = compact ? 8 : 12;
    const inputGap = compact ? 8 : 12;
    const imageColWidth = xl && !compact ? 240 : undefined;

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
        contentRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: compact ? 12 : 16,
            alignItems: "flex-start",
        },
        imageCol: {
            width: imageColWidth ?? "100%",
        },
        imageColCenter: {
            alignItems: "center",
        },
        inputsCol: {
            flex: 1,
            minWidth: compact ? 200 : 260,
            gap: inputGap,
        },
        inputOutline: {
            borderRadius: inputRadius,
        },
        input: {
            backgroundColor: colors.background,
        },
        inputContentCompact: {
            minHeight: 40,
        },
        helperImage: {
            color: colors.textSecondary,
            marginTop: 6,
            fontSize: compact ? 12 : undefined,
        },
        helperName: {
            color: colors.textSecondary,
            marginTop: -4,
            fontSize: compact ? 12 : undefined,
        },
        nextWrap: {
            marginTop: compact ? 12 : 16,
        },
        nextButton: {
            borderRadius: inputRadius,
        },
    });
}

export default BrandDetails;
