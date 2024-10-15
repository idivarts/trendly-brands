import { Text, View } from "@/components/theme/Themed"
import { useRouter } from "expo-router";
import { Button } from "react-native";

const PreSigninScreen = () => {
  const router = useRouter();

  return (
    <View>
      <Text>Pre Signin</Text>
      <Button
        title="Login"
        onPress={() => {
          router.push("/login");
        }}
      />
      <Button
        title="Signup"
        onPress={() => {
          router.push("/signup");
        }}
      />
    </View>
  );
};

export default PreSigninScreen;
