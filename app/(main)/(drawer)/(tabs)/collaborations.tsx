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
      title: "{Post Campaign} and track closely",
      description: "This will help you to find influencers that are already registered on trendly and hence verified from our end. This poses the least risk as we have strong control over these influencers",
      items: [
        "Receive Applications",
        "Invite Unlimited Influencers",
        "Track Deliverables"
      ],
      action: "Create Campaign",
      image: "https://d1tfun8qrz04mk.cloudfront.net/uploads/file_1758395122_images-1758395120937-campaign management thumbnail.jpg"
    }} videoUrl="https://www.youtube.com/embed/0thJwxaYJ5c?si=-BgKhCg_fi0vlyoI" />

  return <Collaborations />;
};

export default CollaborationsScreen;
