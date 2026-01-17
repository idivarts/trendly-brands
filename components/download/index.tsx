import { usePathname, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import DownloadAndroidModal from "./DownloadAndroidModal";
import DownloadIOSModal from "./DownloadIOSModal";

const DownloadApp = () => {
    const [showIOSModal, setShowIOSModal] = useState(false);
    const [showAndroidModal, setShowAndroidModal] = useState(false)
    const pathname = usePathname()
    const segments = useSegments();

    useEffect(() => {
        if (typeof window == "undefined")
            return;
        const userAgent = window.navigator.userAgent;
        // @ts-ignore
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        const isAndroid = /Android/i.test(userAgent);
        // @ts-ignore
        const isInBrowser = typeof window !== "undefined" && window.navigator.standalone !== true;

        if (isIOS && isInBrowser) {
            setShowIOSModal(true);
        }
        if (isAndroid && isInBrowser) {
            setShowAndroidModal(true);
        }
    }, []);

    if (segments.length > 0 && segments[0] == "(auth)")
        return null
    if (segments.length > 0 && segments[0] == "(landing)")
        return null
    if (segments.length > 1 && segments[1] == "(onboarding)")
        return null

    if (pathname.includes("collaboration-application"))
        return null

    if (showIOSModal) return <DownloadIOSModal />;
    if (showAndroidModal) return <DownloadAndroidModal />;

    return null;
};

export default DownloadApp 