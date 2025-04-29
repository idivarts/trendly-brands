import Colors from "@/constants/Colors";
import { useChatContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { IBrandsMembers } from "@/shared-libs/firestore/trendly-pro/models/brands";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import ImageComponent from "@/shared-uis/components/image-component";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { FC, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";

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
        if (member.status === 0) return false;
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
        <ImageComponent
          size="small"
          url={item.item.profileImage}
          initials={item.item.name}
          altText="Profile Image"
        />
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
        {members.length !== 0 ? (
          <FlatList data={members} renderItem={renderItem} />
        ) : (
          <Text
            style={{
              color: Colors(theme).gray300,
              textAlign: "center",
              fontSize: 16,
              paddingBottom: 16,
            }}
          >
            No members to add
          </Text>
        )}
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
