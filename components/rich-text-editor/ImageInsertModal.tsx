import { useAWSContext } from "@/shared-libs/contexts/aws-context.provider";
import Colors from "@/shared-uis/constants/Colors";
import { faImage, faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { normalizeUrl } from "./normalizeUrl";

interface ImageInsertModalProps {
    visible: boolean;
    onClose: () => void;
    /** Fired with the public URL of the image to embed. */
    onInsert: (imageUrl: string) => void;
}

const ImageInsertModal: React.FC<ImageInsertModalProps> = ({ visible, onClose, onInsert }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const { uploadFile, uploadFileUri } = useAWSContext();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [url, setUrl] = useState("");
    const webInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (visible) {
            setUrl("");
            setError(null);
            setUploading(false);
        }
    }, [visible]);

    const finish = (imageUrl?: string) => {
        if (!imageUrl) {
            setError("Upload failed — please try again.");
            return;
        }
        onInsert(imageUrl);
        onClose();
    };

    const runUpload = async (fn: () => Promise<{ imageUrl?: string } | undefined>) => {
        try {
            setError(null);
            setUploading(true);
            const result = await fn();
            finish(result?.imageUrl);
        } catch (e) {
            setError("Upload failed — please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleDevicePress = async () => {
        if (uploading) return;
        if (Platform.OS === "web") {
            webInputRef.current?.click();
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        runUpload(() =>
            uploadFileUri({ id: asset.uri, localUri: asset.uri, uri: asset.uri, type: "image" })
        );
    };

    const handleWebFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Allow re-selecting the same file later.
        event.target.value = "";
        if (!file) return;
        runUpload(() => uploadFile(file as File));
    };

    const handleInsertUrl = () => {
        const finalUrl = normalizeUrl(url);
        if (!finalUrl) return;
        onInsert(finalUrl);
        onClose();
    };

    const canInsertUrl = url.trim().length > 0;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
                    <Text style={styles.title}>Insert image</Text>

                    {/* Upload from device */}
                    <Pressable
                        style={styles.uploadZone}
                        onPress={handleDevicePress}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : (
                            <FontAwesomeIcon icon={faImage} size={20} color={colors.primary} />
                        )}
                        <Text style={styles.uploadText}>
                            {uploading ? "Uploading…" : "Choose image from device"}
                        </Text>
                    </Pressable>

                    {/* Hidden web file input */}
                    {Platform.OS === "web" && (
                        <input
                            ref={webInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleWebFile}
                            style={{ display: "none" }}
                        />
                    )}

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Paste a URL */}
                    <Text style={styles.label}>Paste image URL</Text>
                    <View style={styles.urlRow}>
                        <View style={styles.urlInputWrap}>
                            <FontAwesomeIcon icon={faLink} size={13} color={colors.textSecondary} />
                            <TextInput
                                value={url}
                                onChangeText={setUrl}
                                placeholder="https://example.com/photo.jpg"
                                placeholderTextColor={colors.textSecondary}
                                style={styles.urlInput}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                                editable={!uploading}
                                onSubmitEditing={handleInsertUrl}
                            />
                        </View>
                        <Pressable
                            style={[styles.urlInsertBtn, !canInsertUrl && styles.urlInsertBtnDisabled]}
                            onPress={handleInsertUrl}
                            disabled={!canInsertUrl}
                        >
                            <Text style={styles.urlInsertText}>Insert</Text>
                        </Pressable>
                    </View>

                    {error && <Text style={styles.error}>{error}</Text>}

                    <View style={styles.actions}>
                        <Pressable style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: colors.backdrop,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
        },
        card: {
            width: "100%",
            maxWidth: 420,
            borderRadius: 16,
            padding: 22,
            backgroundColor: colors.modalBackground,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 28,
            shadowOpacity: 0.22,
            elevation: 16,
        },
        title: {
            fontSize: 17,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 16,
        },
        uploadZone: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            paddingVertical: 22,
            borderRadius: 12,
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        uploadText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },
        dividerRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginVertical: 16,
        },
        dividerLine: {
            flex: 1,
            height: 1,
            backgroundColor: colors.tag,
        },
        dividerText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        label: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: 6,
        },
        urlRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        urlInputWrap: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        urlInput: {
            flex: 1,
            paddingVertical: 10,
            fontSize: 15,
            color: colors.text,
        },
        urlInsertBtn: {
            paddingHorizontal: 16,
            paddingVertical: 11,
            borderRadius: 10,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        urlInsertBtnDisabled: {
            opacity: 0.45,
            shadowOpacity: 0,
            elevation: 0,
        },
        urlInsertText: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        error: {
            fontSize: 12,
            color: colors.errorBannerText,
            marginTop: 12,
        },
        actions: {
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: 18,
        },
        cancelBtn: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        cancelText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
        },
    });
}

export default ImageInsertModal;
