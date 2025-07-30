import { IBrands, IBrandsMembers } from "@/shared-libs/firestore/trendly-pro/models/brands";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { Brand } from "@/types/Brand";
import { usePathname } from "expo-router";
import { addDoc, collection, collectionGroup, doc, documentId, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import React, {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuthContext } from "./auth-context.provider";

interface BrandContextProps {
  brands: Brand[];
  createBrand: (brand: Partial<IBrands>) => Promise<void>;
  selectedBrand: Brand | undefined;
  setSelectedBrand: (brand: Brand | undefined, triggerToast?: boolean) => void;
  updateBrand: (id: string, brand: Partial<IBrands>) => Promise<void>;
  loading: boolean
}

const BrandContext = createContext<BrandContextProps>({
  brands: [],
  createBrand: () => Promise.resolve(),
  selectedBrand: undefined,
  setSelectedBrand: () => { },
  updateBrand: () => Promise.resolve(),
  loading: true
});

export const useBrandContext = () => useContext(BrandContext);

export const BrandContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<Brand | undefined>();
  const { manager } = useAuthContext();
  const router = useMyNavigation()
  const pathName = usePathname()

  const setSelectedBrandHandler = async (brand: Brand | undefined, triggerToast = true) => {
    if (brand) {
      Console.log("Setting Brand ID to storage:", brand.id);
      await PersistentStorage.set("selectedBrandId", brand.id)
      if (triggerToast) {
        Toaster.info("Brand changed to " + brand.name);
      }
      setSelectedBrand(brand);
    } else {
      setSelectedBrand(undefined);
    }
  }
  useEffect(() => {
    if (!manager?.id) return;

    const membersCollection = collectionGroup(FirestoreDB, "members");
    const membersQuery = query(
      membersCollection,
      where("managerId", "==", manager.id),
      // where("status", "not-in", [0, 2])
    );
    Console.log("Brand ID from member Query:", manager.id);

    const unsubscribe = onSnapshot(membersQuery, async (membersSnapshot) => {
      setLoading(true)
      try {
        Console.log("Brand ID from member Inside:", manager.id);
        if (membersSnapshot.empty) {
          Console.log("No members found for this manager");
          setBrands([]);
          setSelectedBrand(undefined);
          return;
        }

        const brandIds = new Set<string>();
        membersSnapshot.docs.forEach((doc) => {
          const member = doc.data() as IBrandsMembers
          if (member.status === 0 || member.status > 1) {
            return
          }

          const brandId = doc.ref.parent.parent?.id; // Get the brand ID from the member's document reference
          Console.log("Brand ID from member:", brandId);
          if (brandId) {
            brandIds.add(brandId);
          }
        });

        if (brandIds.size === 0) {
          Console.log("No brands associated with this manager");
          setBrands([]);
          setSelectedBrand(undefined);
          return;
        }

        const brandsCollection = collection(FirestoreDB, "brands");
        const brandsQuery = query(
          brandsCollection,
          where(documentId(), "in", Array.from(brandIds))
        );

        await getDocs(brandsQuery).then(async (brandsSnapshot) => {
          const fetchedBrands: Brand[] = [];
          brandsSnapshot.docs.forEach((brandDoc) => {
            fetchedBrands.push({
              ...(brandDoc.data() as Brand),
              id: brandDoc.id,
            });
          });

          setBrands(fetchedBrands);

          if (fetchedBrands.length > 0 && !selectedBrand) {
            const bId = await PersistentStorage.get("selectedBrandId")
            Console.log("Selected Brand ID from storage:", bId);
            if (bId) {
              const brand = fetchedBrands.find(b => b.id === bId);
              if (brand) {
                await setSelectedBrandHandler(brand, false);
              } else {
                await setSelectedBrandHandler(fetchedBrands[0], false);
              }
            } else
              await setSelectedBrandHandler(fetchedBrands[0], false);
          }
        });
      } finally {
        setLoading(false)
      }
    });

    return () => {
      unsubscribe();
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

  // useEffect(() => {
  //   if (selectedBrand) {
  //     if (!selectedBrand.isBillingDisabled && selectedBrand.billing?.status != ModelStatus.Accepted) {
  //       router.resetAndNavigate("/pay-wall")
  //     } else if (pathName == "pay-wall") {
  //       router.resetAndNavigate("/explore-influencers")
  //     }
  //   }
  // }, [selectedBrand])

  return (
    <BrandContext.Provider
      value={{
        brands,
        createBrand,
        selectedBrand,
        setSelectedBrand: setSelectedBrandHandler,
        updateBrand,
        loading
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};
