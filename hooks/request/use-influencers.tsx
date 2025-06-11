import { useAuthContext } from "@/contexts";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { useInfiniteScroll } from "@/shared-libs/utils/infinite-scroll";
import { User } from "@/types/User";
import { collection, DocumentData, getDocs, orderBy, query, where } from "firebase/firestore";
import { useState } from "react";

interface UseInfluencersProps {
  collaborationId: string;
}

const useInfluencers = ({
  collaborationId,
}: UseInfluencersProps) => {
  // const [influencers, setInfluencers] = useState<any[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);
  // const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { manager } = useAuthContext()

  const PAGE_SIZE = 5;

  const influencersRef = collection(FirestoreDB, "users");
  const q = query(
    influencersRef,
    ...((manager?.isAdmin || false) ? [] : [where("profile.completionPercentage", ">=", 60)]),
    orderBy("creationTime", "desc")
  );
  const { loading: isLoading, data, resetData, loadMore, nextAvailable, onScrollEvent } = useInfiniteScroll<User>(q, 10)

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
