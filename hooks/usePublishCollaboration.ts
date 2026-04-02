// hooks/usePublishCollaboration.ts
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useCollaborationContext } from "@/contexts/collaboration-context.provider";
import { Console } from "@/shared-libs/utils/console";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useCallback } from "react";

/**
 * Shared hook that returns a publish function.
 * publish(collaborationId: string, options?: { onSuccess?: () => void })
 */
export const usePublishCollaboration = () => {
    const { selectedBrand } = useBrandContext();
    const { openModal } = useConfirmationModel();
    const { updateCollaboration } = useCollaborationContext();
    const router = useMyNavigation();

    const publish = useCallback(
        async (collaborationId?: string, options?: { onSuccess?: () => void }) => {
            if (!collaborationId) {
                Console.error("publish called without collaborationId");
                return;
            }

            if (selectedBrand?.credits?.collaboration && selectedBrand.credits.collaboration <= 0) {
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
                await updateCollaboration(collaborationId, {
                    status: "active",
                });
                Toaster.success("Collaboration is published successfully");
                if (options?.onSuccess) options.onSuccess();
            } catch (e) {
                Console.error(e);
                Toaster.error("Failed to publish collaboration");
            }
        },
        [selectedBrand, openModal, router, updateCollaboration]
    );

    return { publish };
};

export default usePublishCollaboration;
