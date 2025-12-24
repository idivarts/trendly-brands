import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useState } from "react";
import { TextInput } from "react-native-paper";
import { Channel as ChannelType } from "stream-chat";
import AddModal from "./add-modal";

interface AddMemberProps {
    channel: ChannelType;
    setVisible: (visible: boolean) => void;
    visible: boolean;
}

const AddMember: React.FC<AddMemberProps> = ({
    channel,
    setVisible,
    visible,
}) => {
    const [userId, setUserId] = useState('');

    const addMember = async () => {
        // User id should exist on the get stream
        await channel.addMembers([userId]);
        Toaster.success('Member added successfully');
        setVisible(false);
        setUserId('');
    }

    return (
        <AddModal
            action={addMember}
            actionLabel="Add"
            title="Add Member"
            content={
                <>
                    <TextInput
                        label="User id"
                        mode="flat"
                        onChangeText={setUserId}
                        value={userId}
                    />
                </>
            }
            visible={visible}
            setVisible={setVisible}
        />
    );
};

export default AddMember;
