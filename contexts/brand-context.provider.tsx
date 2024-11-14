import { Brand } from "@/types/Brand";
import { FirestoreDB } from "@/utils/firestore";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, {
  useContext,
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { useAuthContext } from "./auth-context.provider";

interface BrandContextProps {
  brands: Brand[];
  selectedBrand: Brand | undefined;
  setSelectedBrand: React.Dispatch<React.SetStateAction<Brand | undefined>>;
}

const BrandContext = createContext<BrandContextProps>({
  brands: [],
  selectedBrand: undefined,
  setSelectedBrand: () => { },
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

  return (
    <BrandContext.Provider
      value={{
        brands,
        selectedBrand,
        setSelectedBrand,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};
