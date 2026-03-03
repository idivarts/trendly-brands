import Members from "@/components/members";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import React, { useState } from "react";

const PreferencesScreen = () => {
    const { selectedBrand } = useBrandContext();
    const [showMemberModal, setShowMemberModal] = useState(false);

    return (
        <AppLayout withWebPadding={false}>
            <PageHeader
                title="Members"
                subtitle={selectedBrand?.name}
                showBackButton={false}
                actionButtons={[
                    <Button
                        key="add-member"
                        onPress={() => setShowMemberModal(true)}
                    >
                        Add Member
                    </Button>,
                ]}
            />
            <AppLayout safeAreaEdges={["bottom", "left", "right"]}>
                <Members
                    showMemberModal={showMemberModal}
                    onCloseMemberModal={() => setShowMemberModal(false)}
                />
            </AppLayout>
        </AppLayout>
    );
};

export default PreferencesScreen;
