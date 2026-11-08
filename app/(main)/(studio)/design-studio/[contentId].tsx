/**
 * /design-studio/<contentId> — the Design Studio.
 *
 * A route rather than a state, which is the whole reason this file exists. The
 * old studio was a `stage` value inside the content detail screen: nothing could
 * link to it, the back button could not leave it, and opening a second content's
 * studio meant unwinding the first one's state by hand.
 */
import StudioScreen from "@/components/studio/StudioScreen";
import { useLocalSearchParams } from "expo-router";
import React from "react";

const DesignStudioRoute = () => {
    const { contentId } = useLocalSearchParams<{ contentId: string }>();
    return <StudioScreen contentId={String(contentId ?? "")} />;
};

export default DesignStudioRoute;
