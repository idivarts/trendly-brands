import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

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
    const blobUrlRef = useRef<string | null>(null);

    // KeyboardAvoidingView's `padding` math uses a parent-relative frame against a
    // screen-space keyboard, so the form (which sits below the screen header) needs
    // its on-screen Y as keyboardVerticalOffset — otherwise the keyboard overlaps
    // the lower fields. Measure it and feed it back. iOS-only — Android/web use
    // `height` behaviour + system resize.
    const kbRootRef = useRef<View>(null);
    const [kbVerticalOffset, setKbVerticalOffset] = useState(0);
    const measureKbOffset = useCallback(() => {
        if (Platform.OS !== "ios") return;
        kbRootRef.current?.measureInWindow((_x, y) => {
            if (typeof y === "number" && Number.isFinite(y)) {
                setKbVerticalOffset((prev) => (Math.abs(prev - y) > 1 ? y : prev));
            }
        });
    }, []);

    useEffect(() => {
        return () => {
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
            }
        };
    }, []);

    const handleImageUpload = (image: string | File) => {
        if (typeof image === "string") {
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
            }
            setBrandData((prev) => ({ ...prev, image }));
        } else {
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
            }
            const blobUrl = URL.createObjectURL(image);
            blobUrlRef.current = blobUrl;
            setBrandWebImage(image);
            setBrandData((prev) => ({ ...prev, image: blobUrl }));
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
        <View ref={kbRootRef} style={styles.fill} onLayout={measureKbOffset}>
        <KeyboardAvoidingView
            style={styles.fill}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={kbVerticalOffset}
        >
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
        </KeyboardAvoidingView>
        </View>
    );
};

function createStyles(
    colors: ReturnType<typeof Colors>,
    xl: boolean,
    width: number
) {
    const maxWidth = Math.min(width - 48, 1024);
    return StyleSheet.create({
        fill: { flex: 1 },
        scroll: {
            flex: 1,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingVertical: xl ? 48 : 24,
            paddingBottom: xl ? 48 : 24,
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
            width: "100%",
        },
        leftColumn: {
            width: xl ? "42%" : "100%",
            maxWidth: xl ? 320 : undefined,
            flexShrink: 0,
        },
        rightColumn: {
            flex: 1,
            minWidth: 0,
            width: "100%",
            gap: 40,
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
        },
    });
}

export default CreateNewBrandForm;
