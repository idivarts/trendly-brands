import { FirestoreDB } from "@/utils/firestore";
import { useEffect, useState } from "react";
import { collection, getDocs, where, query, orderBy, limit, onSnapshot, QuerySnapshot, DocumentData, startAfter } from "firebase/firestore";

interface UseInfluencersProps {
  pageID: string;
}

const useInfluencers = ({
  pageID,
}: UseInfluencersProps) => {
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const PAGE_SIZE = 5;

  const fetchInitialInfluencers = () => {
    setIsInitialLoading(true);
    const influencerRef = collection(FirestoreDB, "users");
    const influencersQuery = query(
      influencerRef,
      where("profile.completionPercentage", ">=", 60),
      orderBy("name"),
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
        console.error("Error fetching influencers:", error);
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
      orderBy("name"),
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
        console.error("Error fetching more influencers:", error);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  };

  const checkIfAlreadyInvited = async (influencerID: string) => {
    const invitationsRef = collection(
      FirestoreDB,
      "collaborations",
      pageID,
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
