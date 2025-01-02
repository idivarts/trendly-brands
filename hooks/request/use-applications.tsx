import { useChatContext, useNotificationContext } from "@/contexts";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { FirestoreDB } from "@/utils/firestore";
import { useRouter } from "expo-router";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { useState } from "react";

interface UseApplicationsProps {
  application: {
    collaborationId: string;
    applicationId: string;
    influencerId: string;
  };
  data: any;
  handleActionModalClose: () => void;
  pageId: string;
}

const useApplications = ({
  application,
  data,
  handleActionModalClose,
  pageId,
}: UseApplicationsProps) => {
  const { createGroupWithMembers, connectUser } = useChatContext();
  const { createNotification } = useNotificationContext();
  const router = useRouter();
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const applicationRef = collection(
        FirestoreDB,
        "collaborations",
        pageId,
        "applications"
      );
      const applicationFetch = await getDocs(applicationRef);
      const applications = applicationFetch.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id,
        } as any;
      });

      const influencers = await Promise.all(
        applications.map(async (application) => {
          const userRef = doc(FirestoreDB, "users", application.userId);
          const userFetch = await getDoc(userRef);
          return {
            ...application,
            ...userFetch.data(),
            id: userFetch.id,
            applicationID: application.id,
          } as any;
        })
      );
      setInfluencers(influencers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async () => {
    try {
      const applicationRef = doc(
        FirestoreDB,
        "collaborations",
        application.collaborationId,
        "applications",
        application.applicationId
      );
      await updateDoc(applicationRef, {
        status: "accepted",
      }).then(() => {
        createGroupWithMembers(data.collaboration.name, [
          application.influencerId,
        ]).then((channel) => {
          connectUser();

          createNotification(
            application.influencerId,
            {
              data: {
                collaborationId: data.collaboration.id,
              },
              title: "Application Accepted",
              description: `Your application for ${data.collaboration.name} has been accepted`,
              timeStamp: Date.now(),
              isRead: false,
              type: "application-accepted",
            },
            "users"
          );

          router.navigate(`/channel/${channel.cid}`);
        });

        handleActionModalClose();

        Toaster.success("Application accepted successfully");
      });
    } catch (error) {
      console.error(error);
      handleActionModalClose();
      Toaster.error("Failed to accept application");
    }
  };

  const handleRejectApplication = async () => {
    try {
      const applicationRef = doc(
        FirestoreDB,
        "collaborations",
        application.collaborationId,
        "applications",
        application.applicationId
      );
      await updateDoc(applicationRef, {
        status: "rejected",
      }).then(() => {
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
