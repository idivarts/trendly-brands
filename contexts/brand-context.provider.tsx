import { Brand } from "@/types/Brand";
import { FirestoreDB } from "@/utils/firestore";
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import React, {
  useContext,
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { useAuthContext } from "./auth-context.provider";
import { IBrands } from "@/shared-libs/firestore/trendly-pro/models/brands";

interface BrandContextProps {
  brands: Brand[];
  createBrand: (brand: Partial<IBrands>) => Promise<void>;
  selectedBrand: Brand | undefined;
  setSelectedBrand: React.Dispatch<React.SetStateAction<Brand | undefined>>;
  updateBrand: (id: string, brand: Partial<IBrands>) => Promise<void>;
}

const BrandContext = createContext<BrandContextProps>({
  brands: [],
  createBrand: () => Promise.resolve(),
  selectedBrand: undefined,
  setSelectedBrand: () => { },
  updateBrand: () => Promise.resolve(),
});

export const useBrandContext = () => useContext(BrandContext);

export const BrandContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | undefined>();
  const { manager } = useAuthContext();

  useEffect(() => {
    if (!manager?.id) return;

    const brandsCollection = collection(FirestoreDB, "brands");

    const unsubscribe = onSnapshot(brandsCollection, (brandsSnapshot) => {
      const brandsWithManagerId: Brand[] = [];

      brandsSnapshot.docs.forEach((brandDoc) => {
        const membersCollection = collection(brandDoc.ref, "members");
        const membersQuery = query(
          membersCollection,
          where("managerId", "==", manager?.id)
        );

        onSnapshot(membersQuery, (membersSnapshot) => {
          if (!membersSnapshot.empty) {
            brandsWithManagerId.push({
              ...(brandDoc.data() as Brand),
              id: brandDoc.id,
            });
          }

          setBrands(brandsWithManagerId);

          if (brandsWithManagerId.length > 0 && !selectedBrand) {
            setSelectedBrand(brandsWithManagerId[0]);
          }
        });
      });
    });

    return () => {
      unsubscribe();
      setSelectedBrand(undefined);
      setBrands([]);
    };
  }, [manager?.id]);

  const createBrand = async (
    brand: Partial<IBrands>,
  ): Promise<void> => {
    const brandRef = collection(FirestoreDB, "brands");
    await addDoc(brandRef, brand);
  }

  const updateBrand = async (
    id: string,
    brand: Partial<IBrands>,
  ): Promise<void> => {
    const brandRef = doc(FirestoreDB, "brands", id);

    await updateDoc(brandRef, brand);
  }

  return (
    <BrandContext.Provider
      value={{
        brands,
        createBrand,
        selectedBrand,
        setSelectedBrand,
        updateBrand,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};
