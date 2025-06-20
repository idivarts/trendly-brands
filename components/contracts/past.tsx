import {
  IApplications,
  ICollaboration,
} from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";
import ActiveContracts from "./active";

interface ICollaborationCard extends IContracts {
  userData: IUsers;
  applications: IApplications[];
  collaborationData: ICollaboration;
}

const PastContracts = () => {
  return <ActiveContracts isPast={true} />;
  // const [isVisible, setIsVisible] = useState(false);
  // const [proposals, setProposals] = useState<ICollaborationCard[]>([]);
  // const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  // const [notPendingProposals, setNotPendingProposals] = useState<number>();
  // const { selectedBrand } = useBrandContext();

  // const openBottomSheet = (id: string) => {
  //   setIsVisible(true);
  //   setSelectedCollabId(id);
  // };
  // const closeBottomSheet = () => setIsVisible(false);

  // const theme = useTheme();
  // const styles = stylesFn(theme);
  // const user = AuthApp.currentUser;

  // const [isLoading, setIsLoading] = useState(true);
  // const [refreshing, setRefreshing] = useState(false);

  // const { xl } = useBreakpoints();

  // const handleRefresh = async () => {
  //   setRefreshing(true);
  //   await fetchProposals();
  //   setRefreshing(false);
  // };

  // const fetchProposals = async () => {
  //   try {
  //     setIsLoading(true);
  //     const user = AuthApp.currentUser;

  //     if (!user?.uid) {
  //       throw new Error("User not authenticated");
  //     }

  //     const contractsCol = collection(FirestoreDB, "contracts");
  //     const contractsQuery = query(
  //       contractsCol,
  //       where("brandId", "==", selectedBrand?.id)
  //     );
  //     const contractsSnapshot = await getDocs(contractsQuery);

  //     const contracts = await Promise.all(
  //       contractsSnapshot.docs.map(async (document) => {
  //         const contract = document.data() as IContracts;
  //         const collaborationId = contract.collaborationId;

  //         const user = doc(FirestoreDB, "users", contract.userId);
  //         const userSnapshot = await getDoc(user);
  //         const userData = userSnapshot.data() as IUsers;

  //         const hasAppliedQuery = query(
  //           collectionGroup(FirestoreDB, "applications"),
  //           where("userId", "==", contract.userId),
  //           where("collaborationId", "==", collaborationId)
  //         );

  //         const hasAppliedSnapshot = await getDocs(hasAppliedQuery);

  //         //@ts-ignore
  //         const applications = hasAppliedSnapshot.docs.map((appDoc) => ({
  //           id: appDoc.id,
  //           ...appDoc.data(),
  //         })) as IApplications[];

  //         const collaborationRef = doc(
  //           FirestoreDB,
  //           "collaborations",
  //           collaborationId
  //         );
  //         const collaborationSnapshot = await getDoc(collaborationRef);
  //         const collaborationData =
  //           collaborationSnapshot.data() as ICollaboration;

  //         return { ...contract, applications, userData, collaborationData };
  //       })
  //     );

  //     setProposals(contracts);
  //     setIsLoading(false);
  //   } catch (error) {
  //     Console.error(error, "Error fetching proposals");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchProposals();
  // }, [user, selectedBrand]);

  // const filteredProposals = useMemo(() => {
  //   return proposals.filter((proposal) => {
  //     return proposal.status === 3;
  //   });
  // }, [proposals]);

  // if (isLoading) {
  //   return (
  //     <AppLayout>
  //       <View style={styles.container}>
  //         <ActivityIndicator size="large" color={Colors(theme).primary} />
  //       </View>
  //     </AppLayout>
  //   );
  // }

  // return (
  //   <View
  //     style={{
  //       width: "100%",
  //       flex: 1,
  //     }}
  //   >
  //     {filteredProposals.length === 0 ? (
  //       <EmptyState
  //         image={require("@/assets/images/illustration6.png")}
  //         subtitle="Start Applying today and get exclusive collabs"
  //         title="No Contracts yet"
  //         action={() => router.push("/collaborations")}
  //         actionLabel="Explore Collaborations"
  //       />
  //     ) : (
  //       <View style={{ flex: 1 }}>
  //         <FlatList
  //           data={filteredProposals}
  //           showsVerticalScrollIndicator={false}
  //           renderItem={({ item }) => (
  //             <Pressable
  //               onPress={() => {
  //                 router.push(`/contract-details/${item.streamChannelId}`);
  //               }}
  //               style={{
  //                 flex: 1,
  //                 borderWidth: 0.3,
  //                 borderColor: Colors(theme).gray300,
  //                 borderRadius: 5,
  //                 maxWidth: xl ? "48%" : "100%",
  //                 overflow: "hidden",
  //               }}
  //             >
  //               <ContractHeader
  //                 userImage={item.userData?.profileImage || ""}
  //                 username={item.userData?.name}
  //                 collabId={item.collaborationId}
  //                 collabName={item.collaborationData.name || ""}
  //                 onOpenBottomSheet={() => { }}
  //               />
  //               <ContractDetails
  //                 application={
  //                   item.applications[0] || {
  //                     message: "No message",
  //                     quotation: "No quotation",
  //                     timeline: new Date().toISOString(),
  //                   }
  //                 }
  //               />
  //             </Pressable>
  //           )}
  //           keyExtractor={(item, index) => index.toString()}
  //           style={{
  //             flexGrow: 1,
  //             paddingBottom: 16,
  //             paddingHorizontal: 16,
  //             paddingTop: 8,
  //           }}
  //           contentContainerStyle={{
  //             gap: 16,
  //             paddingBottom: 24,
  //             alignItems: "stretch",
  //           }}
  //           refreshControl={
  //             <RefreshControl
  //               refreshing={refreshing}
  //               onRefresh={handleRefresh}
  //               colors={[Colors(theme).primary]}
  //             />
  //           }
  //           horizontal={false}
  //           numColumns={xl ? 2 : 1} // TODO: On fly can't be responsive
  //           {...(xl && {
  //             columnWrapperStyle: {
  //               gap: 16,
  //             },
  //           })}
  //         />
  //       </View>
  //     )}
  //     {isVisible && (
  //       <BottomSheetActions
  //         cardId={selectedCollabId || ""}
  //         cardType="activeCollab"
  //         isVisible={isVisible}
  //         onClose={closeBottomSheet}
  //         snapPointsRange={["20%", "50%"]}
  //         key={selectedCollabId}
  //       />
  //     )}
  //   </View>
  // );
};

export default PastContracts;
