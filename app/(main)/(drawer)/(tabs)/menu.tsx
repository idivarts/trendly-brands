import Menu from "@/components/menu";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const MenuScreen = () => {
    return (
        <AppLayout withWebPadding={true} safeAreaEdges={["left", "right"]}>
            <Menu />
        </AppLayout>
    );
};

export default MenuScreen;
