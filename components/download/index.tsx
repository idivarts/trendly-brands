import { useEffect, useState } from "react";
import DownloadAppModal from "./DownloadAppModal";

const DownloadApp = () => {
    const [showModal, setShowModal] = useState(false);

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

    if (!showModal) return null;

    return <DownloadAppModal />;
};

export default DownloadApp 