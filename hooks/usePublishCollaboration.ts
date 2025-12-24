// hooks/usePublishCollaboration.ts
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { doc, updateDoc } from "firebase/firestore";
import { useCallback } from "react";

/**
 * Shared hook that returns a publish function.
 * publish(collaborationId: string, options?: { onSuccess?: () => void })
 */
export const usePublishCollaboration = () => {
    const { isOnFreeTrial } = useBrandContext();
    const { openModal } = useConfirmationModel();
    const router = useMyNavigation();

    const publish = useCallback(
        async (collaborationId?: string, options?: { onSuccess?: () => void }) => {
            if (!collaborationId) {
                Console.error("publish called without collaborationId");
                return;
            }

            if (isOnFreeTrial) {
                openModal({
                    title: "Upgrade to Publish",
                    description:
                        "You need to upgrade your plan to publish collaborations.",
                    confirmText: "Upgrade Now",
                    confirmAction: () => {
                        router.push("/billing");
                    },
                });
                return;
            }

            try {
                const collabRef = doc(FirestoreDB, "collaborations", collaborationId);
                await updateDoc(collabRef, {
                    status: "active",
                });
                Toaster.success("Collaboration is published successfully");
                if (options?.onSuccess) options.onSuccess();
            } catch (e) {
                Console.error(e);
                Toaster.error("Failed to publish collaboration");
            }
        },
        [isOnFreeTrial, openModal, router]
    );

    return { publish };
};

export default usePublishCollaboration;
