import { useRouter } from "expo-router";

const CreateCollaborationScreen = () => {
  const router = useRouter();

  return router.push("modal");
};

export default CreateCollaborationScreen;
