import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    useWindowDimensions,
    type ViewStyle,
} from "react-native";

const HORIZONTAL_MARGIN = 24;
const MODAL_MAX_WIDTH = 440;

const isWeb = Platform.OS === "web";

export enum PublishState {
    Idle = "idle",
    InProcess = "in-process",
    Fail = "fail",
    Success = "success",
}

interface PublishModalProps {
    state: PublishState;
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
    const { width: windowWidth } = useWindowDimensions();

    const availableWidth = windowWidth - HORIZONTAL_MARGIN * 2;
    const modalWidth = Math.min(MODAL_MAX_WIDTH, availableWidth);
    const modalPadding = windowWidth < 360 ? 20 : 24;

    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={state !== PublishState.Idle}
            onRequestClose={() => {
                if (state === PublishState.Fail) {
                    onReset();
                }
            }}
        >
            <View
                style={[
                    {
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        paddingHorizontal: HORIZONTAL_MARGIN,
                    },
                    isWeb && ({
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: "100vw",
                        height: "100vh",
                        maxWidth: "100%",
                        maxHeight: "100%",
                    } as unknown as ViewStyle),
                ]}
            >
                <View
                    style={{
                        backgroundColor: Colors(theme).background,
                        borderRadius: 16,
                        padding: modalPadding,
                        alignItems: "center",
                        width: modalWidth,
                        minHeight: 200,
                        maxWidth: isWeb
                            ? ("min(440px, calc(100vw - 48px))" as ViewStyle["maxWidth"])
                            : "100%",
                        ...(isWeb && ({ boxSizing: "border-box" } as ViewStyle)),
                    }}
                >
                    {/* STATE 1: IN-PROCESS */}
                    {state === PublishState.InProcess && (
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
                    {state === PublishState.Fail && (
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
                                    flexDirection:
                                        windowWidth < 380 ? "column" : "row",
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
                    {state === PublishState.Success && (
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
