import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";

import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { Contract } from "@/types/Contract";

interface ContractContextProps {
  getContractById: (contractId: string) => Promise<IContracts>;
  getContractsByCollaborationId: (collaborationId: string) => Promise<Contract[]>;
  updateContract: (
    contractId: string,
    contract: Partial<IContracts>
  ) => Promise<void>;
}

const ContractContext = createContext<ContractContextProps>({
  getContractById: async () => ({} as IContracts),
  getContractsByCollaborationId: async () => ([] as Contract[]),
  updateContract: () => Promise.resolve(),
});

export const useContractContext = () => useContext(ContractContext);

export const ContractContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const getContractById = async (contractId: string) => {
    const contractRef = doc(FirestoreDB, "contracts", contractId);
    const contractSnap = await getDoc(contractRef);

    return contractSnap.data() as IContracts
  }

  const getContractsByCollaborationId = async (collaborationId: string) => {
    const contractsCollection = collection(FirestoreDB, 'contracts');
    const q = query(contractsCollection, where('collaborationId', '==', collaborationId));
    const querySnapshot = await getDocs(q);

    const fetchedContracts: Contract[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Contract[];

    return fetchedContracts;
  }

  const updateContract = async (
    contractId: string,
    contract: Partial<IContracts>,
  ) => {
    const contractRef = doc(FirestoreDB, "contracts", contractId);

    await updateDoc(contractRef, {
      ...contract,
    });
  }

  return (
    <ContractContext.Provider
      value={{
        getContractById,
        getContractsByCollaborationId,
        updateContract,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};