import { Text, View } from "@/components/theme/Themed";
import { CURRENCY } from "@/constants/Unit";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { convertToMUnits } from "@/shared-uis/utils/conversion-million";
import { stylesFn } from "@/styles/CollaborationCardStats.styles";
import { convertToKUnits } from "@/utils/conversion";
import { useTheme } from "@react-navigation/native";
import { collection, getDocs } from "firebase/firestore";
import { FC, useEffect, useState } from "react";

interface CollaborationStatsProps {
    influencerCount: number;
    collabID: string;
    budget: {
        max: number;
        min: number;
    };
}

const CollaborationStats: FC<CollaborationStatsProps> = (
    props: CollaborationStatsProps
) => {
    const [appliedCount, setAppliedCount] = useState<number>(0);
    const [invitedCount, setInvitedCount] = useState<number>(0);
    const theme = useTheme();
    const styles = stylesFn(theme);

    const formatBudgetValue = (value: number) => {
        const millionValue = convertToMUnits(value);
        if (typeof millionValue === "number") {
            return convertToKUnits(millionValue);
        }
        return millionValue;
    };

    const fetchAppliedCount = async () => {
        const appliedRef = collection(
            FirestoreDB,
            "collaborations",
            props.collabID,
            "applications"
        );
        const fetchApplied = await getDocs(appliedRef);
        const docsData = fetchApplied.docs.map((doc) => doc.data());
        setAppliedCount(docsData.length);
        const invitedRef = collection(
            FirestoreDB,
            "collaborations",
            props.collabID,
            "invitations"
        );
        const fetchInvite = await getDocs(invitedRef);
        const docsDataInvited = fetchInvite.docs.map((doc) => doc.data());

        setInvitedCount(docsDataInvited.length);
    };

    useEffect(() => {
        fetchAppliedCount();
    }, []);

    return (
        <View
            style={{
                padding: 16,
            }}
        >
            <View style={styles.infoRow}>
                <Text style={styles.infoText}>
                    Influencers Needed: {props.influencerCount}
                </Text>
                <Text style={styles.infoText}>
                    Budget:{" "}
                    {props.budget.min === props.budget.max
                        ? `${CURRENCY}. ${formatBudgetValue(props.budget.min)}`
                        : `${CURRENCY}. ${formatBudgetValue(props.budget.min)} - ${CURRENCY}. ${formatBudgetValue(props.budget.max)}`}
                </Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoText}>Applied: {appliedCount || 0}</Text>

                <Text style={styles.infoText}>Invited: {invitedCount || 0}</Text>
            </View>
        </View>
    );
};

export default CollaborationStats;
