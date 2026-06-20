import { useAuthContext, useAWSContext, useChatContext } from "@/contexts";
import AppLayout from "@/layouts/app-layout";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import ImageComponent from "@/shared-uis/components/image-component";
import { Text } from "@/shared-uis/components/theme/Themed";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { faChevronRight, faGears, faPen, faSignOut } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Theme, useTheme } from "@react-navigation/native";
import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import Button from "../ui/button";
import ImageUploadModal from "../ui/modal/ImageUploadModal";
import PageHeader from "../ui/page-header";
import TextInput from "../ui/text-input";

const Profile = () => {
    const router = useMyNavigation();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const { manager, signOutManager } = useAuthContext();
    const [capturedImage, setCapturedImage] = useState<string>(manager?.profileImage || "");
    const [imageToUpload, setImageToUpload] = useState<string>("");
    const { uploadFileUri } = useAWSContext();
    const { deregisterTokens } = useChatContext();
    const { openModal } = useConfirmationModel();

    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const updateProfile = async () => {
        if (!manager || !manager.id) {
            Console.error("Manager ID is missing");
            return;
        }

        const managerRef = doc(FirestoreDB, "managers", manager.id);

        setLoading(true);
        try {
            let updatedImageURL = manager.profileImage || ""; // Default to existing profile image

            if (imageToUpload) {
                if (Platform.OS === "web") {
                    Toaster.error("Web upload not supported yet");
                    return;
                } else {
                    const res = await uploadFileUri({
                        id: manager.id,
                        localUri: imageToUpload,
                        uri: imageToUpload,
                        type: "image",
                    });
                    if (res) {
                        updatedImageURL = res.imageUrl || "";
                    }
                }
            }

            // Update Firestore document
            await updateDoc(managerRef, {
                profileImage: updatedImageURL,
                name: name || manager.name,
            });

            setImageToUpload(""); // Clear image-to-upload buffer
            Toaster.success("Profile updated successfully");
        } catch (error) {
            Console.error(error, "Error during profile update");
            Toaster.error("Error during profile update");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await deregisterTokens?.();
        await signOutManager();
    };

    const confirmSignOut = () => {
        openModal({
            title: "Log out",
            description: "Are you sure you want to log out?",
            confirmAction: handleSignOut,
            confirmText: "Log out",
        });
    };

    useEffect(() => {
        if (!manager) {
            Console.error("Manager object is null");
            return;
        }
        setName(manager.name || "");
        setEmail(manager.email || "");
    }, [manager]);

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <PageHeader title="Profile" subtitle="Manage your account and preferences" />
            <AppLayout safeAreaEdges={["bottom", "left", "right"]}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.content}>
                        {/* ── Identity ────────────────────────────────────────── */}
                        <View style={styles.identityCard}>
                            <View style={styles.avatarWrap}>
                                <ImageComponent
                                    url={capturedImage}
                                    size="medium"
                                    altText="Profile Image"
                                    shape="circle"
                                    initialsSize={40}
                                    initials={manager?.name}
                                    style={styles.avatar}
                                />
                                <Pressable onPress={() => setIsModalVisible(true)} style={styles.editBadge}>
                                    <FontAwesomeIcon icon={faPen} color={colors.white} size={12} />
                                </Pressable>
                            </View>
                            <Text style={styles.identityName}>{name || manager?.name || "Your name"}</Text>
                            {email ? <Text style={styles.identityEmail}>{email}</Text> : null}
                        </View>

                        {/* ── Profile details ─────────────────────────────────── */}
                        <Text style={styles.sectionLabel}>PROFILE DETAILS</Text>
                        <View style={styles.card}>
                            <TextInput
                                label="Name"
                                value={name}
                                onChangeText={(text) => setName(text)}
                                mode="outlined"
                                style={styles.input}
                            />
                            {loading ? (
                                <ActivityIndicator size="large" color={colors.primary} style={styles.saveButton} />
                            ) : (
                                <Button
                                    mode="contained"
                                    style={styles.saveButton}
                                    onPress={updateProfile}
                                    disabled={loading}
                                >
                                    Save changes
                                </Button>
                            )}
                        </View>

                        {/* ── More ────────────────────────────────────────────── */}
                        <Text style={styles.sectionLabel}>MORE</Text>
                        <View style={styles.card}>
                            <Row
                                colors={colors}
                                styles={styles}
                                icon={faGears}
                                title="Settings"
                                subtitle="Appearance, notifications and account"
                                onPress={() => router.push("/settings")}
                            />
                            <Row
                                colors={colors}
                                styles={styles}
                                icon={faSignOut}
                                title="Log out"
                                onPress={confirmSignOut}
                            />
                        </View>
                    </View>
                </ScrollView>
            </AppLayout>
            <ImageUploadModal
                setVisible={setIsModalVisible}
                visible={isModalVisible}
                onImageUpload={(image) => {
                    if (!image) return;
                    setCapturedImage(image);
                    setImageToUpload(image);
                }}
            />
        </KeyboardAvoidingView>
    );
};

interface RowProps {
    colors: ReturnType<typeof Colors>;
    styles: ReturnType<typeof useStyles>;
    icon: IconDefinition;
    title: string;
    subtitle?: string;
    onPress?: () => void;
}

const Row: React.FC<RowProps> = ({ colors, styles, icon, title, subtitle, onPress }) => (
    <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityLabel={title}
    >
        <View style={styles.rowLead}>
            <View style={styles.iconBadge}>
                <FontAwesomeIcon icon={icon} size={16} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
            </View>
        </View>
        {onPress ? <FontAwesomeIcon icon={faChevronRight} size={14} color={colors.textSecondary} /> : null}
    </Pressable>
);

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        flex: {
            flex: 1,
        },
        scroll: {
            flexGrow: 1,
            padding: 16,
            alignItems: "center",
            backgroundColor: colors.background,
        },
        content: {
            width: "100%",
            maxWidth: 640,
            gap: 8,
        },
        identityCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            paddingVertical: 24,
            paddingHorizontal: 16,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        avatarWrap: {
            position: "relative",
            marginBottom: 12,
        },
        avatar: {
            backgroundColor: colors.primary,
        },
        editBadge: {
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            shadowOpacity: 0.2,
            elevation: 3,
        },
        identityName: {
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
            letterSpacing: -0.2,
        },
        identityEmail: {
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 2,
        },
        sectionLabel: {
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 0.6,
            color: colors.textSecondary,
            marginTop: 16,
            marginBottom: 4,
            marginLeft: 4,
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 16,
            paddingHorizontal: 8,
            paddingVertical: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        input: {
            width: "100%",
            marginTop: 8,
            backgroundColor: colors.card,
        },
        saveButton: {
            width: "100%",
            marginTop: 12,
            marginBottom: 8,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingHorizontal: 6,
            paddingVertical: 14,
            borderRadius: 12,
        },
        rowPressed: {
            backgroundColor: colors.tag,
        },
        rowLead: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            flex: 1,
        },
        iconBadge: {
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        rowText: {
            flex: 1,
        },
        rowTitle: {
            fontSize: 15,
            fontWeight: "500",
            color: colors.text,
        },
        rowSubtitle: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
        },
    });

export default Profile;
