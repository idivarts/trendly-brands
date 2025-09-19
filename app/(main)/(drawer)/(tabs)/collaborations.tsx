import Collaborations from "@/components/collaborations";
import FullInformationalIllustration from "@/components/FullScreenIllustration";

const CollaborationsScreen = () => {
  const b = true;
  if (b)
    return <FullInformationalIllustration />
  return <Collaborations />;
};

export default CollaborationsScreen;
