import { useRouter } from "expo-router";
import { collection, collectionGroup, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { useState } from "react";

import { useChatContext, useNotificationContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { Brand } from "@/types/Brand";
import { Application, Collaboration, InfluencerApplication } from "@/types/Collaboration";
import { FirestoreDB } from "@/utils/firestore";

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
}

const useApplications = ({
  isApplicationConcised,
  collaborationId,
  data,
  handleActionModalClose,
}: UseApplicationsProps) => {
  const { createGroupWithMembers, connectUser } = useChatContext();
  const {
    createNotification,
    sendNotification,
  } = useNotificationContext();
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
        const applicationQuery = query(
          applicationRef,
          where("status", "in", ["pending", "accepted"])
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
        console.log("brandIds", brandIds);

        const activeCollabs = collection(FirestoreDB, "collaborations");
        const activeCollabsQuery = query(
          activeCollabs,
          where("status", "==", "active"),
          where("brandId", "in", brandIds)
        );

        const activeCollabsFetch = await getDocs(activeCollabsQuery);
        const activeCollabsIds = activeCollabsFetch.docs.map((doc) => doc.id);
        console.log("activeCollabsIds", activeCollabsIds);

        const applicationRef = collectionGroup(FirestoreDB, "applications");
        const applicationQuery = query(
          applicationRef,
          where("status", "in", ["pending", "accepted"]),
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (
    influencerApplication: InfluencerApplication,
  ) => {
    try {
      if (!influencerApplication.application) return;

      const applicationRef = doc(
        FirestoreDB,
        "collaborations",
        influencerApplication.application.collaborationId,
        "applications",
        influencerApplication.application.id,
      );
      await updateDoc(applicationRef, {
        status: "accepted",
      }).then(() => {
        createGroupWithMembers(
          data.collaboration.name,
          influencerApplication.application.userId,
          data.collaboration.id,
        ).then((channel) => {
          connectUser();

          createNotification(
            influencerApplication.application.userId,
            {
              data: {
                collaborationId: data.collaboration.id,
              },
              description: `Your application for ${data.collaboration.name} has been accepted`,
              isRead: false,
              timeStamp: Date.now(),
              title: "Application Accepted",
              type: "application-accepted",
            },
            "users"
          );

          sendNotification(
            {
              users: [influencerApplication.application.userId],
            },
            {
              data: {
                collaborationId: influencerApplication.application.collaborationId,
              },
              notification: {
                title: "Application Accepted",
                description: `Your application for ${data.collaboration.name} has been accepted`,
              },
            },
          );

          router.navigate(`/channel/${channel.cid}`);
        });

        fetchApplications();
        handleActionModalClose();
        Toaster.success("Application accepted successfully");
      });
    } catch (error) {
      console.error(error);
      handleActionModalClose();
      Toaster.error("Failed to accept application");
    }
  };

  const handleRejectApplication = async (
    influencerApplication: InfluencerApplication,
  ) => {
    try {
      if (!influencerApplication.application) return;

      const applicationRef = doc(
        FirestoreDB,
        "collaborations",
        influencerApplication.application.collaborationId,
        "applications",
        influencerApplication.application.id
      );
      await updateDoc(applicationRef, {
        status: "rejected",
      }).then(() => {
        fetchApplications();
        handleActionModalClose();
        Toaster.success("Application rejected successfully");
      });
    } catch (error) {
      console.error(error);
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
