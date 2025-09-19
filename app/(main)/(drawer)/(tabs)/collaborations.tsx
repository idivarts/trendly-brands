import Collaborations from "@/components/collaborations";
import FullInformationalIllustration from "@/components/FullScreenIllustration";
import { useState } from "react";

const CollaborationsScreen = () => {
  const [fullIllustration, setFullIllustration] = useState(true)
  if (fullIllustration)
    return <FullInformationalIllustration action={() => {
      setFullIllustration(false)
    }} config={{
      title: "{Post Campaign} and track closely",
      description: "This will help you to find influencers that are already registered on trendly and hence verified from our end. This poses the least risk as we have strong control over these influencers",
      items: [
        "Receive Applications",
        "Invite Unlimited Influencers",
        "Track Deliverables"
      ],
      action: "Create Campaign"
    }} videoUrl="https://www.youtube.com/embed/0thJwxaYJ5c?si=-BgKhCg_fi0vlyoI" />

  return <Collaborations />;
};

export default CollaborationsScreen;
