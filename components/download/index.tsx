import { usePathname, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import DownloadAppModal from "./DownloadAppModal";

const DownloadApp = () => {
    const [showModal, setShowModal] = useState(false);
    const pathname = usePathname()
    const segments = useSegments();

    useEffect(() => {
        if (typeof window == "undefined")
            return;
        const userAgent = window.navigator.userAgent;
        // @ts-ignore
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        // @ts-ignore
        const isInBrowser = typeof window !== "undefined" && window.navigator.standalone !== true;

        if (isIOS && isInBrowser) {
            setShowModal(true);
        }
    }, []);

    if (segments.length > 0 && segments[0] == "(auth)")
        return null
    if (segments.length > 1 && segments[1] == "(onboarding)")
        return null

    if (pathname.includes("collaboration-application"))
        return null

    if (!showModal) return null;

    return <DownloadAppModal />;
};

export default DownloadApp 