import { useRouter } from "expo-router";

const CreateCollaborationScreen = () => {
  const router = useRouter();

  return router.replace("modal");
};

export default CreateCollaborationScreen;
