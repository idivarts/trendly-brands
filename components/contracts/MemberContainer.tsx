import Colors from "@/constants/Colors";
import { useChatContext } from "@/contexts";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import React, { FC, useEffect, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import MembersCard from "../brand-profile/members-card";
import { Text, View } from "../theme/Themed";

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
  const { fetchMembers, removeMemberFromChannel, isStreamConnected } = useChatContext();
  // const [updateMember, setUpdateMember] = React.useState(false);
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = useState(true)

  const fetchMembersFromClient = async () => {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    if (!isStreamConnected)
      return
    fetchMembersFromClient();
  }, [updateMemberContainer, isStreamConnected]);

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
      {loading ? <ActivityIndicator /> :
        <FlatList
          data={members}
          renderItem={({ item }) => (
            <MembersCard
              manager={item}
              cardType="contract"
              removeAction={async () => {
                await removeMemberFromChannel(channelId, item.managerId).then(() => {
                  fetchMembersFromClient();
                }
                );
              }}
            />
          )}
          contentContainerStyle={{
            gap: 10,
          }}
        />}
    </View>
  );
};

export default MemberContainer;
