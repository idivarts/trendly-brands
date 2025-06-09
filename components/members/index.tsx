import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { useTheme } from "@react-navigation/native";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
} from "react-native";
import MembersCard from "../brand-profile/members-card";
import { View } from "../theme/Themed";
import Button from "../ui/button";
import MembersModal from "../ui/modal/MembersModal";

export interface ManagerCard extends IManagers {
  managerId: string;
  status: number;
}

const Members = () => {
  const theme = useTheme();
  const { selectedBrand } = useBrandContext();
  const [members, setMembers] = useState<ManagerCard[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const fetchMembers = async () => {
    if (!selectedBrand) return;
    try {
      const memberRef = collection(
        FirestoreDB,
        "brands",
        selectedBrand.id,
        "members"
      );
      const memberDoc = await getDocs(memberRef);
      const membersData = memberDoc.docs.map((doc) => {
        return {
          ...doc.data(),
          managerId: doc.id,
        } as ManagerCard;
      });

      const members = await Promise.all(
        membersData.map(async (member) => {
          const memberDoc = doc(FirestoreDB, "managers", member.managerId);
          const memberData = getDoc(memberDoc).then((doc) => {
            return {
              ...doc.data(),
              managerId: doc.id,
              status: member.status,
            } as ManagerCard;
          });
          return memberData;
        })
      );

      setMembers(members);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedBrand]);

  return (
    <View
      style={{
        flex: 1,
        padding: 10,
        backgroundColor: Colors(theme).background,
      }}
    >
      {/* <MembersCard /> */}
      <FlatList
        data={members}
        renderItem={({ item }) => (
          <MembersCard
            manager={item}
            cardType="preferences"
            action={() => { }}
          />
        )}
        keyExtractor={(item) => item.managerId}
        contentContainerStyle={{
          gap: 10,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors(theme).primary]}
          />
        }
      />
      <Button
        onPress={() => {
          setShowMemberModal(true);
        }}
      >
        Add Member
      </Button>

      <MembersModal
        visible={showMemberModal}
        handleModalClose={() => {
          setShowMemberModal(false);
        }}
        refresh={fetchMembers}
        theme={theme}
      />
    </View>
  );
};

export default Members;
