import { useBrandContext } from "@/contexts/brand-context.provider";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useInfiniteIdScroll } from "@/shared-libs/utils/infinite-id-scroll";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { User } from "@/types/User";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

interface UseInfluencersProps {
  collaborationId: string;
}

const useInfluencers = ({
  collaborationId,
}: UseInfluencersProps) => {
  // const [influencers, setInfluencers] = useState<any[]>([]);
  // const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  // const [hasMore, setHasMore] = useState(true);
  // const [isInitialLoading, setIsInitialLoading] = useState(true);
  // const PAGE_SIZE = 5;

  // const { manager } = useAuthContext()
  const { selectedBrand } = useBrandContext()

  const [influencerIds, setInfluencerIds] = useState<string[]>([])

  const influencersRef = collection(FirestoreDB, "users");
  const q = query(
    influencersRef,
  );

  useEffect(() => {
    if (!selectedBrand)
      return;
    HttpWrapper.fetch(`/api/v1/influencers?brandId=${selectedBrand?.id}`, {
      method: "GET",
    }).then(async (res) => {
      const body = await res.json()
      setInfluencerIds(body.data as string[])
    }).catch(e => {
      Toaster.error("Cant fetch Influencers")
    })
  }, [selectedBrand])

  const { loading: isLoading, data, resetData, loadMore, nextAvailable, onScrollEvent } = useInfiniteIdScroll<User>(influencerIds, q, 5)

  // const influencersRef = collection(FirestoreDB, "users");
  // const q = query(
  //   influencersRef,
  //   ...((manager?.isAdmin || false) ? [] : [where("profile.completionPercentage", ">=", 60)]),
  //   orderBy("creationTime", "desc")
  // );
  // const { loading: isLoading, data, resetData, loadMore, nextAvailable, onScrollEvent } = useInfiniteScroll<User>(q, 10)

  const influencers: User[] = data?.map(d => ({
    ...d,
    id: d.documentId
  })) || []

  const checkIfAlreadyInvited = async (influencerID: string) => {
    const invitationsRef = collection(
      FirestoreDB,
      "collaborations",
      collaborationId,
      "invitations"
    );

    const influencersQuery = query(
      invitationsRef,
      where("userId", "==", influencerID)
    );

    const invitedInfluencer = await getDocs(influencersQuery);

    return invitedInfluencer.docs.length > 0;
  };

  return {
    checkIfAlreadyInvited,
    influencers,
    isLoading,
    loadMore, resetData, nextAvailable,
    onScrollEvent
  };
};

export default useInfluencers;
