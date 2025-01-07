import {
  useContext,
  createContext,
  type PropsWithChildren,
} from "react";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";

import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";

interface ContractContextProps {
  getContractById: (contractId: string) => Promise<IContracts>;
  updateContract: (
    contractId: string,
    contract: Partial<IContracts>
  ) => Promise<void>;
}

const ContractContext = createContext<ContractContextProps>({
  getContractById: async () => ({} as IContracts),
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
        updateContract,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};