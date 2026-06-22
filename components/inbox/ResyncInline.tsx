import React from "react";

import ResyncButton from "./ResyncButton";
import { useResyncState } from "./useResyncState";

interface Props {
    /** The subscribed item's updatedAt — bumps when the resync lands, clearing the spinner. */
    watch?: number;
    action: () => Promise<void>;
    label: string;
    size?: number;
    color?: string;
}

/**
 * Drop-in resync affordance: the shared ResyncButton wired to useResyncState, so
 * it spins from tap until the watched value advances (or a timeout). Use this
 * anywhere a single item can be resynced.
 */
const ResyncInline: React.FC<Props> = ({ watch, action, label, size, color }) => {
    const { busy, trigger } = useResyncState(watch, action);
    return <ResyncButton onPress={trigger} busy={busy} label={label} size={size} color={color} />;
};

export default ResyncInline;
