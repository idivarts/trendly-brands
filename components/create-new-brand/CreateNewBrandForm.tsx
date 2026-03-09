import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import BrandAgeSelect from "./BrandAgeSelect";
import BrandDetailsForm from "./BrandDetailsForm";
import BrandIndustrySelect from "./BrandIndustrySelect";
import BrandLogoUpload from "./BrandLogoUpload";
import CreateBrandFooter from "./CreateBrandFooter";
import SectionHeading from "./SectionHeading";
import WhyCompleteProfileBlock from "./WhyCompleteProfileBlock";

export interface CreateNewBrandFormProps {
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
    setBrandWebImage: React.Dispatch<React.SetStateAction<File | null>>;
    onSubmit: () => void;
    isSubmitting?: boolean;
    submitLabel?: string;
}

const CreateNewBrandForm: React.FC<CreateNewBrandFormProps> = ({
    brandData,
    setBrandData,
    setBrandWebImage,
    onSubmit,
    isSubmitting = false,
    submitLabel = "Create Brand",
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const styles = useMemo(
        () => createStyles(colors, xl, width),
        [colors, xl, width]
    );

    const handleImageUpload = (image: string | File) => {
        if (typeof image === "string") {
            setBrandData({ ...brandData, image });
        } else {
            setBrandWebImage(image);
        }
    };

    const leftColumn = (
        <View style={styles.leftColumn}>
            <BrandLogoUpload
                image={brandData.image}
                onUploadImage={handleImageUpload}
            />
            {xl ? <WhyCompleteProfileBlock /> : null}
        </View>
    );

    const rightColumn = (
        <View style={styles.rightColumn}>
            <SectionHeading stepNumber={1} title="Brand Details" />
            <BrandDetailsForm
                brandData={brandData}
                setBrandData={setBrandData}
            />
            <View style={styles.divider} />
            <SectionHeading stepNumber={2} title="Brand Age" tight />
            <BrandAgeSelect
                brandData={brandData}
                setBrandData={setBrandData}
            />
            <View style={styles.divider} />
            <SectionHeading stepNumber={3} title="Brand Industry" tight />
            <BrandIndustrySelect
                brandData={brandData}
                setBrandData={setBrandData}
            />

            <CreateBrandFooter
                onPress={onSubmit}
                loading={isSubmitting}
                buttonLabel={submitLabel}
            />
        </View>
    );

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {xl ? (
                <View style={styles.twoCol}>
                    {leftColumn}
                    {rightColumn}
                </View>
            ) : (
                <View style={styles.singleCol}>
                    {leftColumn}
                    {rightColumn}
                </View>
            )}
        </ScrollView>
    );
};

function createStyles(
    colors: ReturnType<typeof Colors>,
    xl: boolean,
    width: number
) {
    const maxWidth = Math.min(width - 48, 1024);
    return StyleSheet.create({
        scroll: {
            flex: 1,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingVertical: 48,
            paddingBottom: 48,
            maxWidth: xl ? maxWidth : undefined,
            alignSelf: "center",
            width: "100%",
        },
        twoCol: {
            flexDirection: "row",
            gap: 48,
            alignItems: "flex-start",
            width: "100%",
        },
        singleCol: {
            gap: 48,
        },
        leftColumn: {
            width: xl ? "42%" : "100%",
            maxWidth: xl ? 320 : undefined,
            flexShrink: 0,
        },
        rightColumn: {
            flex: 1,
            minWidth: 0,
            gap: 40,
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
        },
    });
}

export default CreateNewBrandForm;
