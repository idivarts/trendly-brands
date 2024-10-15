import { Button, Text, View } from "react-native";
import { useAuthContext } from "@/contexts";
import { DUMMY_MANAGER_CREDENTIALS } from "@/constants/Manager";

const Signup = () => {
  const {
    signUp,
  } = useAuthContext();

  const handleSignUp = () => {
    signUp(
      DUMMY_MANAGER_CREDENTIALS.name,
      DUMMY_MANAGER_CREDENTIALS.email,
      DUMMY_MANAGER_CREDENTIALS.password
    );
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Text>Signup</Text>
      <Button title="Signup" onPress={handleSignUp} />
    </View>
  );
};

export default Signup;
