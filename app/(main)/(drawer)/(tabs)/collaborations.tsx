import Collaborations from "@/components/collaborations";
import FullScreenIllustration from "@/components/FullScreenIllustration";

const CollaborationsScreen = () => {
  const b = true;
  if (b)
    return <FullScreenIllustration />
  return <Collaborations />;
};

export default CollaborationsScreen;
