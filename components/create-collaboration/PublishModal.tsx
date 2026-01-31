import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Modal } from "react-native";

interface PublishModalProps {
    state: "idle" | "in-process" | "fail" | "success";
    errorMessage: string | null;
    publishedCollabId: string | null;
    onReset: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({
    state,
    errorMessage,
    publishedCollabId,
    onReset,
}) => {
    const theme = useTheme();
    const router = useRouter();

    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={state !== "idle"}
            onRequestClose={() => {
                if (state === "fail") {
                    onReset();
                }
            }}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                }}
            >
                <View
                    style={{
                        backgroundColor: Colors(theme).background,
                        borderRadius: 16,
                        padding: 24,
                        alignItems: "center",
                        width: 480,
                        minHeight: 200,
                    }}
                >
                    {/* STATE 1: IN-PROCESS */}
                    {state === "in-process" && (
                        <>
                            <ActivityIndicator
                                size="large"
                                color={Colors(theme).primary}
                                style={{ marginBottom: 16 }}
                            />
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: "bold",
                                    marginBottom: 8,
                                    textAlign: "center",
                                }}
                            >
                                Campaign under review
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    textAlign: "center",
                                    color: Colors(theme).text,
                                    opacity: 0.7,
                                }}
                            >
                                Please wait while we process your collaboration...
                            </Text>
                        </>
                    )}

                    {/* STATE 2: FAIL */}
                    {state === "fail" && (
                        <>
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: "bold",
                                    marginBottom: 12,
                                    textAlign: "center",
                                }}
                            >
                                Collaboration Not Live
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    textAlign: "center",
                                    color: Colors(theme).text,
                                    marginBottom: 20,
                                    lineHeight: 22,
                                }}
                            >
                                {errorMessage}
                            </Text>
                            <View
                                style={{
                                    flexDirection: "row",
                                    gap: 12,
                                    width: "100%",
                                }}
                            >
                                <Button
                                    mode="contained"
                                    style={{ flex: 1 }}
                                    onPress={() => {
                                        onReset();
                                        router.push("/collaborations");
                                    }}
                                >
                                    Understood
                                </Button>
                                <Button
                                    mode="outlined"
                                    style={{ flex: 1 }}
                                    textColor={Colors(theme).primary}
                                    onPress={() => {
                                        // TODO: navigate to Campaign Guide screen when available
                                        onReset();
                                    }}
                                >
                                    Read Campaign Guide
                                </Button>
                            </View>
                        </>
                    )}

                    {/* STATE 3: SUCCESS */}
                    {state === "success" && (
                        <>
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: "bold",
                                    marginBottom: 12,
                                    textAlign: "center",
                                }}
                            >
                                Congratulations!
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    textAlign: "center",
                                    color: Colors(theme).text,
                                    marginBottom: 20,
                                    lineHeight: 22,
                                }}
                            >
                                Campaign created successfully
                            </Text>
                            <Button
                                mode="contained"
                                style={{ width: "100%" }}
                                onPress={() => {
                                    onReset();
                                    if (publishedCollabId) {
                                        router.push(
                                            `/collaboration-details/${publishedCollabId}`
                                        );
                                    }
                                }}
                            >
                                View Campaign
                            </Button>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default PublishModal;
