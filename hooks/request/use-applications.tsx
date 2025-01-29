import { useState } from "react";
import { useRouter } from "expo-router";
import { collection, getDocs, doc, updateDoc, getDoc, query, where } from "firebase/firestore";

import { useChatContext, useNotificationContext } from "@/contexts";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { FirestoreDB } from "@/utils/firestore";
import { Application, InfluencerApplication } from "@/types/Collaboration";
import { User } from "@/types/User";

interface UseApplicationsProps {
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
  collaborationId,
  data,
  handleActionModalClose,
}: UseApplicationsProps) => {
  const { createGroupWithMembers, connectUser } = useChatContext();
  const { sendNotification } = useNotificationContext();
  const router = useRouter();
  const [influencers, setInfluencers] = useState<{
    influencer: User;
    application: Application;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
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

      const applications = applicationFetch.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id,
        } as Application;
      });

      const influencers = await Promise.all(
        applications.map(async (application) => {
          const userRef = doc(FirestoreDB, "users", application.userId);
          const userFetch = await getDoc(userRef);
          return {
            application: {
              ...application,
              id: application.id,
            },
            influencer: {
              ...userFetch.data(),
              id: userFetch.id,
            }
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

          sendNotification(
            {
              users: [influencerApplication.application.userId],
            },
            {
              data: {
                collaborationId: influencerApplication.application.collaborationId,
              },
              title: "Application Accepted",
              description: `Your application for ${data.collaboration.name} has been accepted`,
              timeStamp: Date.now(),
              isRead: false,
              type: "application-accepted",
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
