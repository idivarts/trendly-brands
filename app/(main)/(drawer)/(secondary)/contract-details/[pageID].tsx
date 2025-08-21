import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import ContractDetailsContent from "@/components/contracts/ContractDetailContent";
import { View } from "@/components/theme/Themed";
import ScreenHeader from "@/components/ui/screen-header";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import {
  IApplications,
  ICollaboration,
} from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import BottomSheetScrollContainer from "@/shared-uis/components/bottom-sheet/scroll-view";
import ProfileBottomSheet from "@/shared-uis/components/ProfileModal/Profile-Modal";
import { User } from "@/types/User";
import { useTheme } from "@react-navigation/native";
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { ActivityIndicator } from "react-native";
import { Button } from "react-native-paper";

interface ICollaborationCard extends IContracts {
  userData: IUsers;
  applications: IApplications[];
  collaborationData: ICollaboration;
}

const ContractScreen = () => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { manager } = useAuthContext()
  const { isOnFreeTrial } = useBrandContext()
  const { pageID } = useLocalSearchParams();
  const [contract, setContract] = useState<ICollaborationCard>();
  const [openProfileModal, setOpenProfileModal] = useState(false)
  const [selectedInfluencer, setSelectedInfluencer] = useState<User | undefined>(undefined)

  const fetchProposals = async () => {
    try {
      if (!manager)
        return;

      const user = AuthApp.currentUser;

      if (!user?.uid) {
        throw new Error("User not authenticated");
      }

      const contractsCol = doc(FirestoreDB, "contracts", pageID as string);
      const contractsSnapshot = await getDoc(contractsCol);

      const contract = contractsSnapshot.data() as IContracts;
      const collaborationId = contract.collaborationId;

      const userDataRef = doc(FirestoreDB, "users", contract.userId);
      const userSnapshot = await getDoc(userDataRef);
      const userData = userSnapshot.data() as IUsers;
      setSelectedInfluencer({
        ...userData as IUsers,
        id: userSnapshot.id
      })

      const hasAppliedQuery = query(
        collectionGroup(FirestoreDB, "applications"),
        where("userId", "==", contract.userId),
        where("collaborationId", "==", collaborationId)
      );

      const hasAppliedSnapshot = await getDocs(hasAppliedQuery);

      //@ts-ignore
      const applications = hasAppliedSnapshot.docs.map((appDoc) => ({
        id: appDoc.id,
        ...appDoc.data(),
      })) as IApplications[];

      const collaborationRef = doc(
        FirestoreDB,
        "collaborations",
        collaborationId
      );
      const collaborationSnapshot = await getDoc(collaborationRef);
      const collaborationData = collaborationSnapshot.data() as ICollaboration;

      setContract({
        ...contract,
        userData,
        applications,
        collaborationData,
      });
    } catch (error) {
      Console.error(error, "Error fetching proposals");
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [manager]);

  if (isLoading || !contract) {
    return (
      <AppLayout>
        <View style={{ flex: 1, alignItems: "center", padding: 20 }}>
          {/* <Text>Status is here: {isLoading} & {JSON.stringify(contract)}</Text> */}
          <ActivityIndicator size="large" color={Colors(theme).primary} />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout withWebPadding={false}>
      <ScreenHeader
        title="Contract Details"
        rightAction
        rightActionButton={
          <Button mode="outlined" style={{ marginHorizontal: 16 }} onPress={() => setOpenProfileModal(true)}>View Profile</Button>
        }
      />
      <ContractDetailsContent
        applicationData={contract?.applications[0]}
        collaborationDetail={contract?.collaborationData}
        userData={contract.userData}
        contractData={contract}
        refreshData={fetchProposals}
      />
      <BottomSheetScrollContainer
        isVisible={openProfileModal}
        snapPointsRange={["90%", "90%"]}
        onClose={() => { setOpenProfileModal(false) }}
      >
        <ProfileBottomSheet
          isOnFreePlan={isOnFreeTrial}
          influencer={selectedInfluencer as User}
          theme={theme}
          FireStoreDB={FirestoreDB}
          isBrandsApp={true}
          isPhoneMasked={false}
          closeModal={() => setOpenProfileModal(false)}
        />
      </BottomSheetScrollContainer>
    </AppLayout>
  );
};

export default ContractScreen;
