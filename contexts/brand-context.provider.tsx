import { IS_MONETIZATION_DONE } from "@/shared-constants/app";
import {
  IBrands,
  IBrandsMembers,
} from "@/shared-libs/firestore/trendly-pro/models/brands";
import { ModelStatus } from "@/shared-libs/firestore/trendly-pro/models/status";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { useMyNavigation } from "@/shared-libs/utils/router";
import {
  ProfileModalSendMessage,
  ProfileModalUnlockRequest,
} from "@/shared-uis/components/ProfileModal/Profile-Modal";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { Brand } from "@/types/Brand";
import { usePathname } from "expo-router";
import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  DocumentData,
  documentId,
  DocumentReference,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import React, {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import { useAuthContext } from "./auth-context.provider";

interface BrandContextProps {
  brands: Brand[];
  createBrand: (
    brand: Partial<IBrands>
  ) => Promise<DocumentReference<DocumentData, DocumentData> | null>;
  selectedBrand: Brand | undefined;
  setSelectedBrand: (brand: Brand | undefined, triggerToast?: boolean) => void;
  updateBrand: (id: string, brand: Partial<IBrands>) => Promise<void>;
  loading: boolean;
  isOnFreeTrial?: boolean;
  isProfileLocked: (influencerId: string) => boolean;
}

const BrandContext = createContext<BrandContextProps>({
  brands: [],
  createBrand: () => Promise.resolve(null),
  selectedBrand: undefined,
  setSelectedBrand: () => {},
  updateBrand: () => Promise.resolve(),
  loading: true,
  isOnFreeTrial: true,
  isProfileLocked: (influencerId: string) => true,
});

export const useBrandContext = () => useContext(BrandContext);

export const BrandContextProvider: React.FC<
  PropsWithChildren & { restrictForPayment?: boolean }
> = ({ children, restrictForPayment = true }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<Brand | undefined>();
  const { manager } = useAuthContext();
  const router = useMyNavigation();
  const pathName = usePathname();

  const setSelectedBrandHandler = async (
    brand: Brand | undefined,
    triggerToast = true
  ) => {
    if (brand) {
      Console.log("Setting Brand ID to storage:", brand.id);
      await PersistentStorage.set("selectedBrandId", brand.id);
      if (triggerToast) {
        Toaster.success("Brand changed to " + brand.name);
      }
      setSelectedBrand(brand);
    } else {
      setSelectedBrand(undefined);
    }
  };

  useEffect(() => {
    if (!selectedBrand?.id) return;

    const sBrandRef = doc(collection(FirestoreDB, "brands"), selectedBrand.id);
    const unsubscribe = onSnapshot(sBrandRef, (snapshot) => {
      const bData = snapshot.data() as IBrands;
      setSelectedBrandHandler({ ...bData, id: selectedBrand.id }, false);
    });
    return () => {
      unsubscribe();
    };
  }, [selectedBrand?.id]);

  useEffect(() => {
    if (!manager?.id) return;

    const membersCollection = collectionGroup(FirestoreDB, "members");
    const membersQuery = query(
      membersCollection,
      where("managerId", "==", manager.id)
      // where("status", "not-in", [0, 2])
    );
    Console.log("Brand ID from member Query:", manager.id);

    const unsubscribe = onSnapshot(membersQuery, async (membersSnapshot) => {
      setLoading(true);
      try {
        Console.log("Brand ID from member Inside:", manager.id);
        if (membersSnapshot.empty) {
          Console.log("No members found for this manager");
          setBrands([]);
          setSelectedBrandHandler(undefined, false);
          return;
        }

        const brandIds = new Set<string>();
        membersSnapshot.docs.forEach((doc) => {
          const member = doc.data() as IBrandsMembers;
          if (member.status === 0 || member.status > 1) {
            return;
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
          setSelectedBrandHandler(undefined, false);
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
            const bId = await PersistentStorage.get("selectedBrandId");
            Console.log("Selected Brand ID from storage:", bId);
            if (bId) {
              const brand = fetchedBrands.find((b) => b.id === bId);
              if (brand) {
                await setSelectedBrandHandler(brand, false);
              } else {
                await setSelectedBrandHandler(fetchedBrands[0], false);
              }
            } else await setSelectedBrandHandler(fetchedBrands[0], false);
          }
        });
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [manager?.id]);

  useEffect(() => {
    const subscription1 = ProfileModalUnlockRequest.subscribe(
      async ({ influencerId, callback }) => {
        try {
          Console.log("Unlocking Influencer on brand", selectedBrand);
          if (!selectedBrand) return;
          const uCredit = selectedBrand?.credits?.influencer || 0;
          if (uCredit <= 0 && IS_MONETIZATION_DONE) {
            Toaster.error("Your Profile has no unlock Credits");
            return;
          }
          Console.log("Unlocking Influencer", influencerId);

          const influencerSet = new Set([
            ...(selectedBrand.unlockedInfluencers || []),
            influencerId,
          ]);
          await updateBrand(selectedBrand.id, {
            unlockedInfluencers: [...influencerSet],
            credits: {
              ...selectedBrand.credits,
              influencer: IS_MONETIZATION_DONE ? uCredit - 1 : uCredit,
            },
          });
          Console.log("Unlocked Influencer", [...influencerSet]);

          IS_MONETIZATION_DONE &&
            HttpWrapper.fetch(
              `/api/collabs/influencers/${influencerId}/unlock`,
              {
                method: "POST",
                body: JSON.stringify({
                  brandId: selectedBrand?.id,
                }),
                headers: {
                  "content-type": "application/json",
                },
              }
            );
        } finally {
          callback(true);
        }
      }
    );

    const subscription2 = ProfileModalSendMessage.subscribe(
      async ({ influencerId, callback }) => {
        try {
          IS_MONETIZATION_DONE &&
            (await HttpWrapper.fetch(
              `/api/collabs/influencers/${influencerId}/message`,
              {
                method: "POST",
                body: JSON.stringify({
                  brandId: selectedBrand?.id,
                }),
                headers: {
                  "content-type": "application/json",
                },
              }
            ).then((r) => {
              Toaster.success("Message thread is created");
              router.push("/messages");
              callback(true);
            }));
        } catch (e) {
          callback(false);
        }
      }
    );
    return () => {
      subscription1.unsubscribe();
      subscription2.unsubscribe();
    };
  }, [selectedBrand]);

  const isProfileLocked = useCallback(
    (influencerId: string) => {
      // TODO: replace this placeholder logic with your real rules.
      // Example of using state that should trigger recomputation when they change:
      // - selectedBrand
      // - loading
      // - manager
      // - isOnFreeTrial
      if (!selectedBrand) return true;

      // Example rule: lock profiles when brand is on free trial or billing not accepted
      const lockedByBilling =
        !selectedBrand.isBillingDisabled &&
        selectedBrand.billing?.status !== ModelStatus.Accepted;

      // Example rule: optionally lock specific influencer IDs (extend as needed)
      // const lockedById = Boolean(influencerId && selectedBrand.lockedInfluencers?.includes?.(influencerId));

      // https://brands.trendly.now/influencer/GB9YIOsx1ESc7SBxuqm4pI9wZP53
      const unlockedProfiles = selectedBrand.unlockedInfluencers || [];
      return !unlockedProfiles.includes(influencerId);
    },
    [selectedBrand, manager?.id]
  );

  const createBrand = async (brand: Partial<IBrands>) => {
    if (!manager) return null;

    const brandRef = collection(FirestoreDB, "brands");
    const brandDoc = await addDoc(brandRef, brand);

    const managerRef = doc(
      FirestoreDB,
      "brands",
      brandDoc.id,
      "members",
      manager.id
    );
    await setDoc(managerRef, {
      managerId: manager.id,
      role: "Manager",
    });

    HttpWrapper.fetch(`/api/v2/brands/create`, {
      method: "POST",
      body: JSON.stringify({
        brandId: brandDoc.id,
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    return brandDoc;
  };

  const updateBrand = async (
    id: string,
    brand: Partial<IBrands>
  ): Promise<void> => {
    const brandRef = doc(FirestoreDB, "brands", id);

    await updateDoc(brandRef, brand);
  };

  useEffect(() => {
    if (selectedBrand) {
      if (!restrictForPayment) return;

      if (Platform.OS == "web" && !selectedBrand.hasPayWall) return;

      console.log(
        "Evaluation Paywall condition",
        !selectedBrand.isBillingDisabled &&
          selectedBrand.billing?.status != ModelStatus.Accepted
      );

      if (
        !selectedBrand.isBillingDisabled &&
        selectedBrand.billing?.status != ModelStatus.Accepted &&
        (!selectedBrand.billing?.isOnTrial ||
          (selectedBrand.billing?.isOnTrial &&
            (selectedBrand.billing.trialEnds || 0) < Date.now()))
      ) {
        router.resetAndNavigate("/pay-wall");
      }
    }
  }, [selectedBrand]);

  const isOnFreeTrial = useMemo(() => {
    if (!selectedBrand) return false;
    return !selectedBrand.isBillingDisabled && !selectedBrand.billing;
  }, [selectedBrand]);

  const ctxValue = useMemo(
    () => ({
      brands,
      createBrand,
      selectedBrand,
      setSelectedBrand: setSelectedBrandHandler,
      updateBrand,
      loading,
      isOnFreeTrial,
      isProfileLocked,
    }),
    [
      brands,
      createBrand,
      selectedBrand,
      updateBrand,
      loading,
      isOnFreeTrial,
      isProfileLocked,
      setSelectedBrandHandler,
    ]
  );

  return (
    <BrandContext.Provider value={ctxValue}>{children}</BrandContext.Provider>
  );
};
