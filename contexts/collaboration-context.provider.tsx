import {
  useContext,
  createContext,
  type PropsWithChildren,
} from "react";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import { Collaboration } from "@/types/Collaboration";
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";

interface CollaborationContextProps {
  getCollaborationById: (id: string) => Promise<Collaboration>;
  createCollaboration: (collaboration: ICollaboration) => Promise<void>;
  updateCollaboration: (id: string, collaboration: Partial<ICollaboration>) => Promise<void>;
}

const CollaborationContext = createContext<CollaborationContextProps>(null!);

export const useCollaborationContext = () => useContext(CollaborationContext);

export const CollaborationContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
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
    collaboration: ICollaboration,
  ): Promise<void> => {
    const collaborationRef = collection(FirestoreDB, "collaborations");
    await addDoc(collaborationRef, collaboration);
  }

  const updateCollaboration = async (
    id: string,
    collaboration: Partial<ICollaboration>,
  ): Promise<void> => {
    const collaborationRef = doc(FirestoreDB, "collaborations", id);

    await updateDoc(collaborationRef, collaboration);
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