import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import ContractDetailsContent from "@/components/contracts/ContractDetailContent";
import ContractActionsMenu, { type ContractActionsMenuItem } from "@/components/contracts/ContractActionsMenu";
import ContractStatusDevTools from "@/components/contracts/ContractStatusDevTools";
import { Text, View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
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
import Colors from "@/shared-uis/constants/Colors";
import { User } from "@/types/User";
import { useTheme } from "@react-navigation/native";
import {
    collectionGroup,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import { ActivityIndicator, StyleSheet } from "react-native";
import { Button } from "react-native-paper";

const styles = StyleSheet.create({
    loadingCenter: {
        flex: 1,
        alignItems: "center",
        padding: 20,
    },
    viewProfileButton: {
        marginHorizontal: 16,
    },
    footer: {
        paddingVertical: 16,
        alignItems: "center",
    },
    footerText: {
        fontSize: 12,
        opacity: 0.7,
    },
});

interface ICollaborationCard extends IContracts {
    /** Firestore document id for `contracts/{id}`. This is the backend `:contractId`. */
    id: string;
    userData: IUsers;
    applications: IApplications[];
    collaborationData: ICollaboration;
}

const ContractScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const [contractMenuItems, setContractMenuItems] = useState<ContractActionsMenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { manager } = useAuthContext()
    const managerEmail = manager?.email;
    const { isOnFreeTrial, isProfileLocked } = useBrandContext()
    const { pageID } = useLocalSearchParams();
    const [contract, setContract] = useState<ICollaborationCard>();
    const [openProfileModal, setOpenProfileModal] = useState(false);
    const [selectedInfluencer, setSelectedInfluencer] = useState<User | undefined>(undefined);
    const [devOverrideStatus, setDevOverrideStatus] = useState<number | null>(null);

    const fetchProposals = async () => {
        try {
            if (!manager)
                return;

            const user = AuthApp.currentUser;

            if (!user?.uid) {
                throw new Error("User not authenticated");
            }

            if (!pageID || typeof pageID !== "string") return;

            const contractsCol = doc(FirestoreDB, "contracts", pageID);
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
                id: contractsSnapshot.id,
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
        if (!managerEmail || !pageID || typeof pageID !== "string") {
            setContract(undefined);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const contractRef = doc(FirestoreDB, "contracts", pageID);
        const unsubscribe = onSnapshot(
            contractRef,
            async (snapshot) => {
                try {
                    if (!snapshot.exists()) {
                        setContract(undefined);
                        setIsLoading(false);
                        return;
                    }

                    const contractData = snapshot.data() as IContracts;
                    const collaborationId = contractData.collaborationId;

                    const userDataRef = doc(FirestoreDB, "users", contractData.userId);
                    const userSnapshot = await getDoc(userDataRef);
                    const userData = userSnapshot.data() as IUsers;
                    setSelectedInfluencer({
                        ...(userData as IUsers),
                        id: userSnapshot.id,
                    });

                    const hasAppliedQuery = query(
                        collectionGroup(FirestoreDB, "applications"),
                        where("userId", "==", contractData.userId),
                        where("collaborationId", "==", collaborationId)
                    );

                    const hasAppliedSnapshot = await getDocs(hasAppliedQuery);
                    // @ts-ignore
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
                        id: snapshot.id,
                        ...contractData,
                        userData,
                        applications,
                        collaborationData,
                    });
                } catch (error) {
                    Console.error(error, "Error subscribing to contract");
                    setContract(undefined);
                } finally {
                    setIsLoading(false);
                }
            },
            (error) => {
                Console.error(error, "Contract onSnapshot error");
                setContract(undefined);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [managerEmail, pageID]);

    if (isLoading || !contract) {
        return (
            <AppLayout safeAreaEdges={["top", "right", "bottom", "left"]}>
                <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color={Colors(theme).primary} />
                </View>
            </AppLayout>
        );
    }

    const contractSubtitle =
        contract.collaborationData?.name ||
        contract.userData?.name ||
        "Contract";

    return (
        <AppLayout withWebPadding={false}>
            <PageHeader
                title="Contract Details"
                subtitle={contractSubtitle}
                showBackButton
                mobileActions="notification-only"
                actionButtons={[
                    <Button
                        key="view-profile"
                        mode="outlined"
                        style={styles.viewProfileButton}
                        onPress={() => setOpenProfileModal(true)}
                    >
                        View Profile
                    </Button>,
                ]}
                rightComponent={<ContractActionsMenu items={contractMenuItems} />}
            />
            {__DEV__ && (
                <ContractStatusDevTools
                    realStatus={contract.status}
                    overrideStatus={devOverrideStatus}
                    onOverrideChange={setDevOverrideStatus}
                    contractId={contract.streamChannelId}
                    onWriteSuccess={fetchProposals}
                />
            )}
            <ContractDetailsContent
                applicationData={contract?.applications[0]}
                collaborationDetail={contract?.collaborationData}
                userData={contract.userData}
                contractData={contract}
                refreshData={fetchProposals}
                devOverrideStatus={devOverrideStatus}
                onMenuItemsChange={setContractMenuItems}
            />
            {xl && (
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.text }]}>
                        © {new Date().getFullYear()} Trendly Influencer Management Platform
                    </Text>
                </View>
            )}
            <BottomSheetScrollContainer
                isVisible={openProfileModal}
                snapPointsRange={["90%", "90%"]}
                onClose={() => { setOpenProfileModal(false) }}
            >
                <ProfileBottomSheet
                    // isOnFreePlan={isOnFreeTrial}
                    // lockProfile={isProfileLocked(selectedInfluencer?.id || "")}
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
