import { useRouter } from "expo-router";
import { collection, collectionGroup, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { useState } from "react";

import { useChatContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { Brand } from "@/types/Brand";
import { Application, Collaboration, InfluencerApplication } from "@/types/Collaboration";

interface UseApplicationsProps {
  isApplicationConcised?: boolean;
  collaborationId: string;
  data: {
    collaboration: {
      id: string;
      name: string;
      questionsToInfluencers: string[];
    },
  };
  handleActionModalClose: () => void;
  statusFilter?: string
}

const useApplications = ({
  isApplicationConcised,
  collaborationId,
  data,
  handleActionModalClose,
  statusFilter
}: UseApplicationsProps) => {
  const { connectUser } = useChatContext();
  const router = useRouter();
  const [influencers, setInfluencers] = useState<InfluencerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { brands } = useBrandContext();

  const fetchApplications = async () => {
    try {
      let applications: Application[] = [];
      if (!isApplicationConcised) {
        const applicationRef = collection(
          FirestoreDB,
          "collaborations",
          collaborationId,
          "applications"
        );
        let sQuery = ["pending", "accepted"]
        if (statusFilter) {
          sQuery = [statusFilter]
        }
        const applicationQuery = query(
          applicationRef,
          where("status", "in", sQuery),
          orderBy("timeStamp", "desc"),
        );
        const applicationFetch = await getDocs(applicationQuery);

        applications = applicationFetch.docs.map((doc) => {
          return {
            ...doc.data(),
            id: doc.id,
          } as Application;
        });
      } else {
        const brandIds = brands.map((brand) => brand.id);
        Console.log("brandIds", brandIds);

        const activeCollabs = collection(FirestoreDB, "collaborations");
        const activeCollabsQuery = query(
          activeCollabs,
          where("status", "==", "active"),
          where("brandId", "in", brandIds)
        );

        const activeCollabsFetch = await getDocs(activeCollabsQuery);
        const activeCollabsIds = activeCollabsFetch.docs.map((doc) => doc.id);
        Console.log("activeCollabsIds", activeCollabsIds);

        const applicationRef = collectionGroup(FirestoreDB, "applications");
        const applicationQuery = query(
          applicationRef,
          where("status", "in", ["pending"]),
          where("collaborationId", "in", activeCollabsIds),
          orderBy("timeStamp", "desc"),
        );
        const applicationFetch = await getDocs(applicationQuery);

        applications = applicationFetch.docs.map((doc) => {
          return {
            ...doc.data(),
            id: doc.id,
          } as Application;
        });
      }

      const influencers = await Promise.all(
        applications.map(async (application) => {
          const userRef = doc(FirestoreDB, "users", application.userId);
          const userFetch = await getDoc(userRef);

          let collab: Partial<Collaboration> = data.collaboration;
          let brand: Partial<Brand> = {};
          if (isApplicationConcised) {
            const collabRef = doc(FirestoreDB, "collaborations", application.collaborationId);
            const collabFetch = await getDoc(collabRef);
            collab = { ...collabFetch.data(), id: collabFetch.id } as Collaboration;

            const brandRef = doc(FirestoreDB, "brands", "" + collab.brandId);
            const brandFetch = await getDoc(brandRef);
            brand = { ...brandFetch.data(), id: brandFetch.id } as Brand;
          }

          return {
            id: userFetch.id,
            application: {
              ...application,
              id: application.id,
            },
            influencer: {
              ...userFetch.data(),
              id: userFetch.id,
            },
            collaboration: collab,
            brand: brand
          } as InfluencerApplication;
        })
      );

      setInfluencers(influencers);
    } catch (error) {
      Console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (
    influencerApplication: InfluencerApplication,
  ) => {
    try {
      if (!influencerApplication.application) return;
      HttpWrapper.fetch(`/api/collabs/collaborations/${influencerApplication.application.collaborationId}/applications/${influencerApplication.application.userId}/accept`, {
        method: "POST",
      }).then(async (res) => {
        Toaster.success("Application accepted successfully");
        const body = await res.json()
        await connectUser();
        router.navigate(`/channel/${body.channel.cid}`);
      })
      fetchApplications();
      handleActionModalClose();
    } catch (error) {
      Console.error(error);
      handleActionModalClose();
      Toaster.error("Failed to accept application");
    }
  };

  const handleRejectApplication = async (
    influencerApplication: InfluencerApplication,
  ) => {
    try {
      if (!influencerApplication.application) return;
      HttpWrapper.fetch(`/api/collabs/collaborations/${influencerApplication.application.collaborationId}/applications/${influencerApplication.application.userId}/reject`, {
        method: "POST",
      })
      fetchApplications();
      handleActionModalClose();
      Toaster.success("Application rejected successfully");
    } catch (error) {
      Console.error(error);
      handleActionModalClose();
      Toaster.error("Failed to reject application");
    }
  };

  return {
    handleAcceptApplication,
    handleRejectApplication,
    fetchApplications,
    influencers,
    loading,
  };
}

export default useApplications;
