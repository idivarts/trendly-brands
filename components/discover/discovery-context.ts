import React, {
    createContext,
    useContext,
    type MutableRefObject,
} from "react";
import { Subject } from "rxjs";

import type { DB_TYPE, InfluencerItem } from "./discover-types";

export const OpenFilterRightPanel = new Subject<void>();

export interface DiscoverCommunication {
    loading?: boolean;
    data: InfluencerItem[];
    total?: number;
    page?: number;
    pageCount?: number;
    sort?: string;
}

export interface PageSortCommunication {
    page?: number;
    sort?: string;
}

export interface DiscoveryProps {
    selectedDb: DB_TYPE;
    setSelectedDb: Function;
    rightPanel: boolean;
    setRightPanel: Function;
    showFilters: boolean;
    setShowFilters: Function;
    isCollapsed: boolean;
    showRightPanel?: boolean;
    showTopPanel?: boolean;
    setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    discoverCommunication: MutableRefObject<
        ((action: DiscoverCommunication) => any) | undefined
    >;
    pageSortCommunication: MutableRefObject<
        ((action: PageSortCommunication) => any) | undefined
    >;
}

const DiscoveryContext = createContext<DiscoveryProps>({} as DiscoveryProps);
export const useDiscovery = () => useContext(DiscoveryContext);
export const DiscoveryProvider = DiscoveryContext.Provider;
