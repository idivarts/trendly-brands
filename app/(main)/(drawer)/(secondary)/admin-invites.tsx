import KanbanBoard from '@/components/kanban/KanbanBoard'
import AppLayout from '@/layouts/app-layout'
import React from 'react'

const AdminInvites = () => {
    return (
        <AppLayout>
            <KanbanBoard
                columns={[
                    { id: 'todo', title: 'To Do', data: [{ id: '1', title: 'Setup repo' }] },
                    { id: 'doing', title: 'In Progress', data: [{ id: '2', title: 'Auth flow' }] },
                    { id: 'done', title: 'Done', data: [{ id: '3', title: 'Wireframes' }] },
                ]}
                onChange={(next) => console.log(next)}
            />
        </AppLayout>
    )
}

export default AdminInvites