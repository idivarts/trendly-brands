import Colors from "@/constants/Colors";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { FC, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Text, Button, Avatar, Card } from "react-native-paper";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { FirestoreDB } from "@/utils/firestore";
import { useChatContext } from "@/contexts";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import { IBrandsMembers } from "@/shared-libs/firestore/trendly-pro/models/brands";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import Toaster from "@/shared-uis/components/toaster/Toaster";

interface AddMemberModalProps {
  visible: boolean;
  onDismiss: () => void;
  membersAlreadyInContract: any[];
  channelId: string;
  refreshData: () => void;
  updateMemberContainer: () => void;
}

const AddMembersModal: FC<AddMemberModalProps> = ({
  visible,
  onDismiss,
  membersAlreadyInContract,
  channelId,
  refreshData,
  updateMemberContainer,
}) => {
  const [members, setMembers] = useState([]);
  const theme = useTheme();
  const { addMemberToChannel } = useChatContext();
  const { selectedBrand } = useBrandContext();

  const fetchMembersInBrand = async () => {
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
        } as IBrandsMembers;
      });

      var members = await Promise.all(
        membersData.map(async (member) => {
          const memberDoc = doc(FirestoreDB, "managers", member.managerId);
          const memberData = getDoc(memberDoc).then((doc) => {
            return {
              ...doc.data(),
              managerId: doc.id,
              status: member.status,
            };
          }) as any;
          return memberData;
        })
      );

      members = members.filter((member) => {
        return !membersAlreadyInContract.some((memberInContract) => {
          if (!memberInContract) return false;
          return memberInContract.email === member.email;
        });
      });

      //@ts-ignore
      setMembers(members);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMembersInBrand();
  }, [membersAlreadyInContract]);

  const handleAddMember = (memberId: string) => {
    try {
      addMemberToChannel(channelId, memberId);
      Toaster.success("Member added successfully");
      refreshData();
      onDismiss();
      setTimeout(() => {
        updateMemberContainer();
      }, 1000);
    } catch (error) {
      Toaster.error("Failed to add member");
      console.error(error);
    }
  };

  const renderItem = (item: any) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Avatar.Image size={40} source={{ uri: item.item.profileImage }} />
        <View style={styles.textContainer}>
          <Text
            style={{
              fontSize: 18,
              color: Colors(theme).text,
            }}
          >
            {item.item.name}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: Colors(theme).gray300,
            }}
          >
            {item.item.email}
          </Text>
        </View>
        <Pressable onPress={() => handleAddMember(item.item.managerId)}>
          <FontAwesomeIcon icon={faPlus} size={24} color={Colors(theme).text} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: Colors(theme).backdrop,
        }}
        onPress={onDismiss}
      />
      <View
        style={{
          backgroundColor: Colors(theme).background,
          padding: 16,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <Text style={styles.modalTitle}>Add Members</Text>
        <Text
          style={{
            fontSize: 16,
            marginBottom: 16,
            color: Colors(theme).gray300,
          }}
        >
          Add your team members here
        </Text>
        <FlatList data={members} renderItem={renderItem} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  card: {
    marginBottom: 12,
    elevation: 1,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  addButton: {
    alignSelf: "center",
  },
});

export default AddMembersModal;