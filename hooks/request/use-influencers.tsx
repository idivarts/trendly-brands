import { useAuthContext } from "@/contexts";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { collection, DocumentData, getDocs, limit, onSnapshot, orderBy, query, QuerySnapshot, startAfter, where } from "firebase/firestore";
import { useEffect, useState } from "react";

interface UseInfluencersProps {
  collaborationId: string;
}

const useInfluencers = ({
  collaborationId,
}: UseInfluencersProps) => {
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { manager } = useAuthContext()

  const PAGE_SIZE = 5;

  const fetchInitialInfluencers = () => {
    setIsInitialLoading(true);
    const influencerRef = collection(FirestoreDB, "users");
    const influencersQuery = query(
      influencerRef,
      ...(manager?.isAdmin ? [] : [where("profile.completionPercentage", ">=", 60)]),
      // where("profile.completionPercentage", ">=", 60),
      orderBy("lastUseTime", "desc"),
      limit(PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(
      influencersQuery,
      (snapshot: QuerySnapshot) => {
        const data = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        setInfluencers(data);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setIsInitialLoading(false);
      },
      error => {
        Console.error(error, "Error fetching influencers");
        setIsInitialLoading(false);
      }
    );

    return unsubscribe;
  };

  const fetchMoreInfluencers = async () => {
    if (!lastVisible || !hasMore || isLoading) return;

    setIsLoading(true);
    const influencerRef = collection(FirestoreDB, "users");
    const influencersQuery = query(
      influencerRef,
      where("profile.completionPercentage", ">=", 60),
      orderBy("lastUseTime", "desc"),
      startAfter(lastVisible),
      limit(PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(
      influencersQuery,
      (snapshot: QuerySnapshot) => {
        const data = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        setInfluencers(prev => [...prev, ...data]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setIsLoading(false);
      },
      error => {
        Console.error(error, "Error fetching more influencers");
        setIsLoading(false);
      }
    );

    return unsubscribe;
  };

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

  useEffect(() => {
    const unsubscribe = fetchInitialInfluencers();
    return () => unsubscribe && unsubscribe();
  }, []);

  return {
    checkIfAlreadyInvited,
    fetchMoreInfluencers,
    setInfluencers,
    fetchInitialInfluencers,
    isInitialLoading,
    hasMore,
    influencers,
    isLoading,
  };
};

export default useInfluencers;
