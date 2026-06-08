// hooks/usePublishCollaboration.ts
import { useCollaborationContext } from "@/contexts/collaboration-context.provider";
import { Console } from "@/shared-libs/utils/console";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useCallback } from "react";

/**
 * Shared hook that returns a publish function.
 * publish(collaborationId: string, options?: { onSuccess?: () => void })
 *
 * Publishing is no longer credit-gated (old credit system removed).
 */
export const usePublishCollaboration = () => {
    const { updateCollaboration } = useCollaborationContext();

    const publish = useCallback(
        async (collaborationId?: string, options?: { onSuccess?: () => void }) => {
            if (!collaborationId) {
                Console.error("publish called without collaborationId");
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
        [updateCollaboration]
    );

    return { publish };
};

export default usePublishCollaboration;
