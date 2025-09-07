import { useBrandContext } from '@/contexts/brand-context.provider'
import AppLayout from '@/layouts/app-layout'
import { View } from '@/shared-uis/components/theme/Themed'
import React from 'react'
import { Chip } from 'react-native-paper'
import ScreenHeader from '../ui/screen-header'
import { DB_TYPE } from './RightPanelDiscover'

interface IProps {
    selectedDb: DB_TYPE,
}
const DiscoverAdPlaceholder: React.FC<IProps> = ({ selectedDb }) => {
    const { selectedBrand } = useBrandContext()
    const planKey = selectedBrand?.billing?.planKey

    if (selectedDb == "modash") {
        return (
            <AppLayout>
                <ScreenHeader title="Modash Creators Discovery" hideAction={true}
                    rightAction={planKey != "enterprise"}
                    rightActionButton={
                        <Chip
                            compact
                            mode="outlined"
                            textStyle={{ fontSize: 10 }}
                        >
                            Upgrade to Enterprise
                        </Chip>
                    } />
                <View
                    style={{}}
                >

                </View>
            </AppLayout>
        )
    }
    if (selectedDb == "phyllo") {
        return (
            <AppLayout>
                <ScreenHeader title="Phyllo Creators Discovery" hideAction={true}
                    rightAction={planKey != "enterprise"}
                    rightActionButton={
                        <Chip
                            compact
                            mode="outlined"
                            textStyle={{ fontSize: 10 }}
                        >
                            Upgrade to Enterprise
                        </Chip>
                    } />
                <View
                    style={{}}
                >

                </View>
            </AppLayout>
        )
    }
    return (
        <AppLayout>
            <ScreenHeader title="Trendly Internal Discovery" hideAction={true}
                rightAction={planKey != "pro" && planKey != "enterprise"}
                rightActionButton={
                    <Chip
                        compact
                        mode="outlined"
                        textStyle={{ fontSize: 10 }}
                    >
                        Upgrade to Pro
                    </Chip>
                } />
            <View
                style={{
                }}
            >

            </View>
        </AppLayout>
    )
}

export default DiscoverAdPlaceholder