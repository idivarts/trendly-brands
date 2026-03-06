import { Text } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";

const HELPER_NAME = "This will be visible on your public profile.";
const PLACEHOLDER_NAME = "Enter your brand name";
const PLACEHOLDER_ABOUT = "Briefly describe what your brand does...";
const PLACEHOLDER_PHONE = "+1 (555) 000-0000";
const PLACEHOLDER_WEBSITE = "https://yourbrand.com";

export interface BrandDetailsFormProps {
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
}

const BrandDetailsForm: React.FC<BrandDetailsFormProps> = ({
    brandData,
    setBrandData,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => createStyles(colors, xl), [colors, xl]);

    return (
        <View style={styles.form}>
            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Brand Name*</Text>
                <TextInput
                    mode="outlined"
                    value={brandData.name ?? ""}
                    onChangeText={(value) =>
                        setBrandData({ ...brandData, name: value })
                    }
                    placeholder={PLACEHOLDER_NAME}
                outlineColor={colors.formBorder}
                activeOutlineColor={colors.primary}
                    style={styles.input}
                    outlineStyle={styles.outline}
                    contentStyle={styles.inputContent}
                />
                <Text style={styles.helper}>{HELPER_NAME}</Text>
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>About the Brand</Text>
                <TextInput
                    mode="outlined"
                    value={brandData.profile?.about ?? ""}
                    onChangeText={(value) =>
                        setBrandData({
                            ...brandData,
                            profile: {
                                ...brandData.profile,
                                about: value,
                            },
                        })
                    }
                    placeholder={PLACEHOLDER_ABOUT}
                    multiline
                    numberOfLines={4}
                outlineColor={colors.formBorder}
                activeOutlineColor={colors.primary}
                    style={styles.input}
                    outlineStyle={styles.outline}
                    contentStyle={styles.inputContent}
                />
            </View>

            <View style={styles.phoneWebsiteRow}>
                <View style={[styles.fieldGroup, xl && styles.phoneWebsiteField]}>
                    <Text style={styles.label}>Phone*</Text>
                    <TextInput
                        mode="outlined"
                        value={brandData.profile?.phone ?? ""}
                        onChangeText={(value) =>
                            setBrandData({
                                ...brandData,
                                profile: {
                                    ...brandData.profile,
                                    phone: value,
                                },
                            })
                        }
                        placeholder={PLACEHOLDER_PHONE}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                outlineColor={colors.formBorder}
                activeOutlineColor={colors.primary}
                        style={styles.input}
                        outlineStyle={styles.outline}
                        contentStyle={styles.inputContent}
                    />
                </View>
                <View style={[styles.fieldGroup, xl && styles.phoneWebsiteField]}>
                    <Text style={styles.label}>Website</Text>
                    <TextInput
                        mode="outlined"
                        value={brandData.profile?.website ?? ""}
                        onChangeText={(value) =>
                            setBrandData({
                                ...brandData,
                                profile: {
                                    ...brandData.profile,
                                    website: value,
                                },
                            })
                        }
                        placeholder={PLACEHOLDER_WEBSITE}
                        keyboardType="url"
                        autoCapitalize="none"
                outlineColor={colors.formBorder}
                activeOutlineColor={colors.primary}
                        style={styles.input}
                        outlineStyle={styles.outline}
                        contentStyle={styles.inputContent}
                    />
                </View>
            </View>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        form: {
            gap: 20,
        },
        fieldGroup: {
            gap: 6,
        },
        phoneWebsiteRow: {
            flexDirection: xl ? "row" : "column",
            flexWrap: "wrap",
            gap: xl ? 16 : 20,
        },
        phoneWebsiteField: {
            flex: 1,
            minWidth: xl ? 120 : undefined,
        },
        label: {
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
        },
        input: {
            backgroundColor: colors.card,
        },
        outline: {
            borderRadius: 12,
            borderWidth: 1,
        },
        inputContent: {
            minHeight: 48,
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        helper: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 4,
        },
    });
}

export default BrandDetailsForm;
