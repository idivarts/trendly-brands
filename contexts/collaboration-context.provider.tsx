import {
  useContext,
  createContext,
  type PropsWithChildren,
} from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import { Collaboration } from "@/types/Collaboration";

interface CollaborationContextProps {
  getCollaborationById: (id: string) => Promise<Collaboration>;
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

  return (
    <CollaborationContext.Provider
      value={{
        getCollaborationById,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
};