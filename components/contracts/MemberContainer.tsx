import { useTheme } from "@react-navigation/native";
import { Text, View } from "../theme/Themed";
import { FC, useEffect } from "react";
import Colors from "@/constants/Colors";
import React from "react";
import { useChatContext } from "@/contexts";
import { doc, getDoc } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import { FlatList, Pressable } from "react-native";
import MembersCard from "../brand-profile/members-card";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

interface MemberContainerProps {
  channelId: string;
  setMembersFromBrand: (members: any[]) => void;
  updateMemberContainer: number;
  setShowModal: () => void;
}

const MemberContainer: FC<MemberContainerProps> = ({
  channelId,
  setMembersFromBrand,
  updateMemberContainer,
  setShowModal,
}) => {
  const theme = useTheme();
  const { fetchMembers, removeMemberFromChannel } = useChatContext();
  const [updateMember, setUpdateMember] = React.useState(false);
  const [members, setMembers] = React.useState<any[]>([]);

  const fetchMembersFromClient = async () => {
    try {
      const members = await fetchMembers(channelId);
      const memberData = await Promise.all(
        members.map(async (member: any) => {
          const memberRef = doc(FirestoreDB, "managers", member.user.id);
          const memberDoc = await getDoc(memberRef);
          const memberData = {
            ...memberDoc.data(),
            email: memberDoc.data()?.email,
            managerId: member.user.id,
          };
          if (memberData && memberData.email) {
            return memberData;
          } else {
            return null;
          }
        })
      );
      const validMembers = memberData.filter((data) => data !== null);

      // Set the filtered members
      setMembers(validMembers);

      setMembersFromBrand(validMembers);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchMembersFromClient();
  }, [updateMemberContainer]);

  return (
    <View
      style={{
        width: "100%",
        flex: 1,
        flexDirection: "column",
        gap: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
          }}
        >
          Members
        </Text>
        <Pressable onPress={setShowModal}>
          <FontAwesomeIcon icon={faPlus} size={20} color={Colors(theme).text} />
        </Pressable>
      </View>
      <FlatList
        data={members}
        renderItem={({ item }) => (
          <MembersCard
            manager={item}
            cardType="contract"
            action={async () => {
              await removeMemberFromChannel(channelId, item.managerId).then(
                () => {
                  fetchMembersFromClient();
                }
              );
            }}
          />
        )}
        contentContainerStyle={{
          gap: 10,
        }}
      />
    </View>
  );
};

export default MemberContainer;
