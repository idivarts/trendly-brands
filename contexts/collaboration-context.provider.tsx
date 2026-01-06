import {
    createContext,
    useContext,
    type PropsWithChildren,
} from "react";

import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import { Collaboration } from "@/types/Collaboration";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    updateDoc,
} from "firebase/firestore";
import { useBrandContext } from "./brand-context.provider";

interface CollaborationContextProps {
    getCollaborationById: (id: string) => Promise<Collaboration>;
    createCollaboration: (collaboration: Partial<ICollaboration>) => Promise<string | null>;
    updateCollaboration: (id: string, collaboration: Partial<ICollaboration>) => Promise<void>;
}

const CollaborationContext = createContext<CollaborationContextProps>(null!);

export const useCollaborationContext = () => useContext(CollaborationContext);

export const CollaborationContextProvider: React.FC<PropsWithChildren> = ({
    children,
}) => {

    const { selectedBrand } = useBrandContext()
    const { openModal } = useConfirmationModel()
    const router = useMyNavigation();

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
        const collaborationCredits = Number(selectedBrand?.credits?.collaboration);
        if (Number.isFinite(collaborationCredits) && collaborationCredits <= 0) {
            openModal({
                title: "No Collaboration Credit",
                description: "You seem to have exhausted the collaboration credit. Contact support or upgrade your plan to recharge the credits",
                confirmText: "Upgrade Plan",
                confirmAction: () => {
                    router.push("/billing")
                }
            })
            return null;
        }
        const collaborationRef = collection(FirestoreDB, "collaborations");

        const collabDoc = await addDoc(collaborationRef, collaboration);

        HttpWrapper.fetch(`/api/collabs/collaborations/${collabDoc.id}`, {
            method: "POST",
        })
        return collabDoc.id;
    }

    const updateCollaboration = async (
        id: string,
        collaboration: Partial<ICollaboration>,
    ): Promise<void> => {
        const collaborationRef = doc(FirestoreDB, "collaborations", id);

        await updateDoc(collaborationRef, collaboration);
        HttpWrapper.fetch(`/api/collabs/collaborations/${id}?update=1`, {
            method: "POST",
        })
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
        </CollaborationContext.Provider>
    );
};
