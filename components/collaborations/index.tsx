import { Text, View } from "@/components/theme/Themed";
import AppLayout from "@/layouts/app-layout";
import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import { TouchableOpacity } from "react-native";
import { stylesFn } from "@/styles/Proposal.styles";
import Applications from "@/components/proposals/Applications";
import Invitations from "@/components/proposals/Invitations";

const Collaborations = () => {
  const [selectedTab, setSelectedTab] = useState<
    "applications" | "invitations"
  >("applications");

  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <AppLayout>
      <View style={styles.container}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around",
            width: "100%",
            marginBottom: 20,
          }}
        >
          <TouchableOpacity onPress={() => setSelectedTab("applications")}>
            <Text
              style={
                selectedTab === "applications"
                  ? styles.titleActive
                  : styles.title
              }
            >
              Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSelectedTab("invitations")}>
            <Text
              style={
                selectedTab === "invitations"
                  ? styles.titleActive
                  : styles.title
              }
            >
              Past
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === "applications" && <Applications />}

        {selectedTab === "invitations" && <Invitations />}
      </View>
    </AppLayout>
  );
};

export default Collaborations;
