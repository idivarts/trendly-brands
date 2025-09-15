import { useBrandContext } from '@/contexts/brand-context.provider'
import React from 'react'
import { DB_TYPE } from './RightPanelDiscover'
import EmptyModashSelected from './empty-screens/EmptyDiscoverModash'
import EmptyNoDatabaseSelected from './empty-screens/EmptyDiscoverNoDB'
import EmptyPhylloSelected from './empty-screens/EmptyDiscoverPhyllo'
import EmptyTrendlyInternalSelected from './empty-screens/EmptyDiscoverTrendly'

interface IProps {
    selectedDb: DB_TYPE,
    setSelectedDb: Function
}
const DiscoverAdPlaceholder: React.FC<IProps> = ({ selectedDb, setSelectedDb }) => {
    const { selectedBrand } = useBrandContext()
    const planKey = selectedBrand?.billing?.planKey

    if (selectedDb == "modash") {
        return <EmptyModashSelected />
    }
    if (selectedDb == "phyllo") {
        return <EmptyPhylloSelected />
    }
    if (selectedDb == "trendly") {
        return <EmptyTrendlyInternalSelected />
    }
    return <EmptyNoDatabaseSelected setSelectedDb={setSelectedDb} />
}

export default DiscoverAdPlaceholder