import AppLayout from "@/layouts/app-layout";
import React from "react";
import KanbanBoard, { KanbanColumnT } from "@/components/kanban/KanbanBoard";

const AdminInvites = () => {
  return (
    <AppLayout>
      <KanbanBoard />
    </AppLayout>
  );
};

export default AdminInvites;
