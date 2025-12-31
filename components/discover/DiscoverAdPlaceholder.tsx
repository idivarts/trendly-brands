import { useBrandContext } from "@/contexts/brand-context.provider";
import React from "react";
import type { DB_TYPE } from "./discover-types";
import EmptyModashSelected from "./empty-screens/EmptyDiscoverModash";
import EmptyNoDatabaseSelected from "./empty-screens/EmptyDiscoverNoDB";
import EmptyPhylloSelected from "./empty-screens/EmptyDiscoverPhyllo";
import EmptyTrendlyInternalSelected from "./empty-screens/EmptyDiscoverTrendly";

interface IProps {
    selectedDb: DB_TYPE;
    setSelectedDb: Function;
    showPlaceholder?: boolean;
}

const DiscoverAdPlaceholder: React.FC<IProps> = ({
    selectedDb,
    setSelectedDb,
    showPlaceholder,
}) => {
    const { selectedBrand } = useBrandContext();
    const planKey = selectedBrand?.billing?.planKey;

    if (!showPlaceholder) {
        return null;
    }

    if (selectedDb == "modash") {
        return <EmptyModashSelected />;
    }
    if (selectedDb == "phyllo") {
        return <EmptyPhylloSelected />;
    }
    if (selectedDb == "trendly") {
        return <EmptyTrendlyInternalSelected />;
    }
    return <EmptyNoDatabaseSelected setSelectedDb={setSelectedDb} />;
};

export default DiscoverAdPlaceholder;
