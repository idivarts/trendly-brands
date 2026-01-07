import Collaborations from "@/components/collaborations";
import FullInformationalIllustration from "@/components/FullScreenIllustration";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useEffect, useState } from "react";

const CollaborationsScreen = () => {
    const router = useMyNavigation()
    const [fullIllustration, setFullIllustration] = useState(true)
    const { selectedBrand } = useBrandContext()
    useEffect(() => {
        if (!selectedBrand)
            return;
        (async () => {
            const x = await PersistentStorage.get(selectedBrand.id + "-collaboration")
            setFullIllustration(!x)
        })()
    }, [selectedBrand])

    if (fullIllustration)
        return <FullInformationalIllustration action={() => {
            PersistentStorage.set(selectedBrand?.id + "-collaboration", "true")
            setFullIllustration(false)
            router.push("/create-collaboration")
        }} config={{
            title: "{Post Campaigns.} Track with Ease.",
            description: "Share your brief once and let thousands of micro-creators apply. Stop chasing influencers — they come to you. Post, review, and collaborate seamlessly.",
            items: [
                "Receive Verified Applications",
                "Invite Unlimited Influencers",
                "Track Deliverables in Real-Time"
            ],
            action: "Create Campaign",
            image: "https://d1tfun8qrz04mk.cloudfront.net/uploads/file_1758395122_images-1758395120937-campaign management thumbnail.jpg"
        }} videoUrl="https://www.youtube.com/embed/0thJwxaYJ5c?si=-BgKhCg_fi0vlyoI" />

    return <Collaborations />;
};

export default CollaborationsScreen;
