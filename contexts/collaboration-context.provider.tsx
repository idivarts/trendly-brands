import {
    createContext,
    useContext,
    useState,
    type PropsWithChildren,
} from "react";
import { ActivityIndicator, Modal, Platform, StyleSheet } from "react-native";
import { Button } from "react-native-paper";

import Colors from "@/shared-uis/constants/Colors";
import { Text, View } from "@/shared-uis/components/theme/Themed";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import { Collaboration } from "@/types/Collaboration";
import { Theme, useTheme } from "@react-navigation/native";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    updateDoc,
} from "firebase/firestore";
import { useBrandContext } from "./brand-context.provider";

interface UpdateCollaborationOptions {
    skipEvaluation?: boolean;
}

interface CollaborationContextProps {
    getCollaborationById: (id: string) => Promise<Collaboration>;
    createCollaboration: (collaboration: Partial<ICollaboration>) => Promise<string | null>;
    updateCollaboration: (id: string, collaboration: Partial<ICollaboration>, options?: UpdateCollaborationOptions) => Promise<void>;
}

const CollaborationContext = createContext<CollaborationContextProps>(null!);

export const useCollaborationContext = () => useContext(CollaborationContext);

export const CollaborationContextProvider: React.FC<PropsWithChildren> = ({
    children,
}) => {

    const { selectedBrand } = useBrandContext()
    const { openModal } = useConfirmationModel()
    const router = useMyNavigation();
    const theme = useTheme();
    const styles = evaluationModalStyles(theme);

    const [evaluationModal, setEvaluationModal] = useState<{
        visible: boolean;
        loading: boolean;
        error: string | null;
    }>({ visible: false, loading: false, error: null });

    const runEvaluation = async (collabId: string, isUpdate: boolean): Promise<boolean> => {
        const url = isUpdate
            ? `/api/collabs/collaborations/${collabId}?update=1`
            : `/api/collabs/collaborations/${collabId}`;

        setEvaluationModal({ visible: true, loading: true, error: null });
        try {
            await HttpWrapper.fetch(url, { method: "POST" });
            setEvaluationModal({ visible: false, loading: false, error: null });
            return true;
        } catch (err) {
            const message = await HttpWrapper.extractErrorMessage(err);
            setEvaluationModal({
                visible: true,
                loading: false,
                error: message || "Your collaboration has been taken down as it doesn't meet Trendly's standards.",
            });
            return false;
        }
    };

    const getCollaborationById = async (
        id: string,
    ): Promise<Collaboration> => {
        const collaborationRef = doc(FirestoreDB, "collaborations", id);
        const collaborationSnapshot = await getDoc(collaborationRef);
        return {
            ...collaborationSnapshot.data() as Collaboration,
            id: collaborationSnapshot.id,
        };
    }

    const createCollaboration = async (
        collaboration: Partial<ICollaboration>,
    ): Promise<string | null> => {
        // Collaboration creation is no longer credit-gated (old credit system removed).
        const collaborationRef = collection(FirestoreDB, "collaborations");

        const collabDoc = await addDoc(collaborationRef, collaboration);

        const passed = await runEvaluation(collabDoc.id, false);
        if (!passed) return null;

        return collabDoc.id;
    }

    const updateCollaboration = async (
        id: string,
        collaboration: Partial<ICollaboration>,
        options?: UpdateCollaborationOptions,
    ): Promise<void> => {
        const collaborationRef = doc(FirestoreDB, "collaborations", id);
        await updateDoc(collaborationRef, collaboration);

        if (!options?.skipEvaluation) {
            await runEvaluation(id, true);
        }
    }

    return (
        <CollaborationContext.Provider
            value={{
                getCollaborationById,
                createCollaboration,
                updateCollaboration,
            }}
        >
            {children}
            <Modal
                animationType="fade"
                transparent
                visible={evaluationModal.visible}
                onRequestClose={() => {
                    if (!evaluationModal.loading) {
                        setEvaluationModal({ visible: false, loading: false, error: null });
                    }
                }}
            >
                <View style={styles.backdrop}>
                    <View style={styles.card}>
                        {evaluationModal.loading ? (
                            <>
                                <ActivityIndicator size="large" color={Colors(theme).primary} style={{ marginBottom: 16 }} />
                                <Text style={styles.title}>Evaluating Your Collaboration</Text>
                                <Text style={styles.description}>
                                    AI is reviewing your collaboration to ensure it meets Trendly's standards. This may take a moment...
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.title}>Collaboration Review</Text>
                                <Text style={styles.description}>{evaluationModal.error}</Text>
                                <Button
                                    mode="contained"
                                    onPress={() => setEvaluationModal({ visible: false, loading: false, error: null })}
                                    style={styles.closeButton}
                                >
                                    Close
                                </Button>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </CollaborationContext.Provider>
    );
};

const evaluationModalStyles = (theme: Theme) =>
    StyleSheet.create({
        backdrop: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: Colors(theme).backdrop,
        },
        card: {
            margin: 20,
            backgroundColor: Colors(theme).background,
            borderRadius: 16,
            padding: 25,
            alignItems: "center",
            shadowColor: Colors(theme).backdrop,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            ...(Platform.OS === "web" && { maxWidth: 420 }),
        },
        title: {
            fontSize: 18,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 12,
        },
        description: {
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 16,
        },
        closeButton: {
            backgroundColor: Colors(theme).primary,
            marginTop: 4,
        },
    });
