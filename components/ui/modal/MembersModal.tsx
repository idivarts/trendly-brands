import { Text, View } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme, type Theme } from "@react-navigation/native";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import React, { useMemo } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
} from "react-native";
import { Modal, Portal } from "react-native-paper";
import Button from "../button";
import TextInput from "../text-input";

interface MembersModalProps {
    visible: boolean;
    handleModalClose: () => void;
    theme: any;
    refresh: () => void;
}

const MembersModal: React.FC<MembersModalProps> = ({
    visible,
    handleModalClose,
    theme,
    refresh,
}) => {
    const styles = useMemo(() => useMembersStyles(theme), [theme]);
    const colors = Colors(theme);
    const layoutStyles = React.useMemo(() => StyleSheet.create({
        modalRoot: { justifyContent: "center", alignItems: "center" },
        scroll: { borderRadius: 10, backgroundColor: colors.background, gap: 12 },
        scrollContent: { paddingBottom: 16 },
    }), [colors]);

    const [email, setEmail] = React.useState("");
    const [name, setName] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const { selectedBrand } = useBrandContext();

    const addMember = async () => {
        if (!selectedBrand) return;
        if (!email || !name) {
            Toaster.error("Please enter all fields");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Toaster.error("Please enter a valid email address");
            return;
        }

        if (name.trim().length < 3) {
            Toaster.error("Name must be at least 3 characters long");
            return;
        }
        const user = await AuthApp.currentUser?.getIdToken();
        setLoading(true);

        await HttpWrapper.fetch("/api/v2/brands/members", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                brandId: selectedBrand.id,
                email,
                name
            })
        }).then(async (res) => {
            const data = await res.json()
            Toaster.success("User Invited Successfully");
            refresh();
        }).catch((e) => {
            Toaster.error("Something wrong happened");
            Console.error(e);
        }).finally(() => {
            handleModalClose();
            setEmail("");
            setName("");
            setLoading(false);
        });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <Portal>
                <Modal
                    visible={visible}
                    onDismiss={() => {
                        handleModalClose();
                    }}
                    style={layoutStyles.modalRoot}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.title}>Add Member</Text>
                        <Text style={styles.subtitle}>You can add members from here</Text>
                        <View style={styles.modalInputContainer}>
                            <ScrollView
                                style={layoutStyles.scroll}
                                contentContainerStyle={layoutStyles.scrollContent}
                            >
                                <TextInput
                                    label="Email"
                                    mode="outlined"
                                    inputMode="email"
                                    value={email}
                                    onChangeText={(value) => setEmail(value)}
                                    style={styles.input}
                                    autoFocus
                                />
                                <TextInput
                                    label="Name"
                                    mode="outlined"
                                    value={name}
                                    onChangeText={(value) => setName(value)}
                                    style={styles.input}
                                />

                                <Button
                                    mode="contained"
                                    onPress={addMember}
                                    style={styles.addButton}
                                >
                                    {loading ? <ActivityIndicator color={colors.onPrimary} /> : "Add Member"}
                                </Button>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </Portal>
        </KeyboardAvoidingView>
    );
};

function useMembersStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            padding: 16,
            backgroundColor: Colors(theme).background,
        },
        searchInput: {
            backgroundColor: Colors(theme).background,
            flex: 1,
        },
        title: {
            fontSize: 18,
            fontWeight: "bold",
        },
        subtitle: {
            fontSize: 16,
        },
        scrollView: {
            paddingBottom: 160,
            width: "100%",
        },
        scrollViewContent: {
            paddingBottom: 16,
        },
        actionsCell: {
            flexDirection: "row",
            justifyContent: "flex-end",
        },
        modalContent: {
            padding: 16,
            gap: 16,
            borderRadius: 10,
            backgroundColor: Colors(theme).background,
            width: 300,
        },
        modalInputContainer: {
            marginBottom: 10,
            backgroundColor: Colors(theme).background,
        },
        input: {
            marginBottom: 10,
            backgroundColor: Colors(theme).background,
        },
        chipContainer: {
            backgroundColor: Colors(theme).background,
            flexDirection: "row",
            flexWrap: "wrap",
            marginVertical: 10,
        },
        chip: {
            margin: 4,
        },
        addButton: {
            alignItems: "center",
        },
        noDataContainer: {
            flex: 1,
            justifyContent: "center",
            marginTop: 16,
            alignItems: "center",
        },
        noDataText: {
            fontSize: 17,
        },
    });
}

export default MembersModal;
