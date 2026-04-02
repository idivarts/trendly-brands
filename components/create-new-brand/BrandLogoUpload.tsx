import { Text } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { imageUrl } from "@/shared-uis/utils/url";
import { faCamera, faImage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import * as ImagePickerExpo from "expo-image-picker";
import React, { useRef, useMemo } from "react";
import {
    Image,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from "react-native";

const RECOMMENDATION_TEXT =
    "Recommended: square logo, 512x512 or higher";
const UPLOAD_LABEL = "Upload Brand Logo";

export interface BrandLogoUploadProps {
    image?: string;
    onUploadImage: (image: string | File) => void;
}

const BrandLogoUpload: React.FC<BrandLogoUploadProps> = ({
    image,
    onUploadImage,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => createStyles(colors, xl), [colors, xl]);
    const inputRef = useRef<HTMLInputElement>(null);

    const triggerUpload = () => {
        if (Platform.OS === "web") {
            inputRef.current?.click();
        } else {
            openPicker();
        }
    };

    const openPicker = async () => {
        try {
            const { status } =
                await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Toaster.error("We need camera permissions");
                return;
            }
            const result = await ImagePickerExpo.launchImageLibraryAsync({
                mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });
            if (!result.canceled) {
                onUploadImage(result.assets[0].uri);
                Toaster.success("Image is uploaded successfully!");
            }
        } catch (err: unknown) {
            Toaster.error(
                `Failed to upload image: ${err instanceof Error ? err.message : "Unknown error"}`
            );
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUploadImage(file);
            Toaster.success("Image is uploaded successfully!");
        }
        e.target.value = "";
    };

    const displayUri =
        typeof image === "string" && image
            ? image.startsWith("http") || image.startsWith("file") || image.startsWith("blob")
                ? image
                : ""
            : "";

    return (
        <View style={styles.wrapper}>
            <Pressable
                style={styles.dashedBox}
                onPress={triggerUpload}
            >
                {displayUri ? (
                    <Image
                        source={imageUrl(image)}
                        style={styles.previewImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholder}>
                        <View style={styles.iconBox}>
                            <FontAwesomeIcon
                                icon={faImage}
                                size={40}
                                color={colors.textSecondary}
                            />
                        </View>
                        <Text style={styles.uploadLabel}>{UPLOAD_LABEL}</Text>
                        <Text style={styles.recommendation}>
                            {RECOMMENDATION_TEXT}
                        </Text>
                    </View>
                )}
                <Pressable
                    style={styles.cameraButton}
                    onPress={(ev) => {
                        ev.stopPropagation();
                        triggerUpload();
                    }}
                >
                    <FontAwesomeIcon
                        icon={faCamera}
                        size={18}
                        color={colors.onPrimary}
                    />
                </Pressable>
            </Pressable>
            {Platform.OS === "web" && (
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={styles.hiddenInput}
                />
            )}
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        wrapper: {
            width: "100%",
            position: "relative",
            alignItems: xl ? undefined : "center",
        },
        dashedBox: {
            width: xl ? "100%" : 240,
            aspectRatio: 1,
            maxWidth: 320,
            alignSelf: xl ? undefined : "center",
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: colors.formBorder,
            borderRadius: 24,
            backgroundColor: colors.tag,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
        },
        placeholder: {
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 16,
            gap: 16,
        },
        iconBox: {
            width: 80,
            height: 80,
            borderRadius: 16,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
        },
        uploadLabel: {
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
        },
        recommendation: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 4,
            textAlign: "center",
        },
        previewImage: {
            width: "100%",
            height: "100%",
            borderRadius: 22,
        },
        cameraButton: {
            position: "absolute",
            right: 8,
            bottom: 8,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
        },
        hiddenInput: {
            position: "absolute",
            opacity: 0,
            width: 1,
            height: 1,
            top: 0,
            left: 0,
            pointerEvents: "none",
        },
    });
}

export default BrandLogoUpload;
