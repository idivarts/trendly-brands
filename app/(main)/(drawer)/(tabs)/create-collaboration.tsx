import { useRouter } from "expo-router";

const CreateCollaborationScreen = () => {
  const router = useRouter();

  router.push("/(modal)/create-collaboration");

  return null;
};

export default CreateCollaborationScreen;
