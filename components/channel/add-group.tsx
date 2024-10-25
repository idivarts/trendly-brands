import { TextInput } from "react-native-paper";
import AddModal from "./add-modal";
import { useState } from "react";
import { useChatContext } from "stream-chat-expo";
import Toaster from "@/shared-uis/components/toaster/Toaster";

interface AddGroupProps {
  setVisible: (visible: boolean) => void;
  visible: boolean;
}

const AddGroup: React.FC<AddGroupProps> = ({
  setVisible,
  visible,
}) => {
  const [groupName, setGroupName] = useState('');

  const { client } = useChatContext();

  const addGroup = async () => {
    const channel = client.channel('messaging', groupName.toLowerCase().replace(/\s+/g, '-'), {
      name: groupName,
      members: [client.user?.id as string],
    });

    await channel.create();
    await channel.watch();

    Toaster.success('Group added successfully');

    setVisible(false);
    setGroupName('');
  }

  return (
    <AddModal
      action={addGroup}
      actionLabel="Add"
      title="Add Group"
      content={
        <>
          <TextInput
            label="Group name"
            mode="flat"
            onChangeText={setGroupName}
            value={groupName}
          />
        </>
      }
      visible={visible}
      setVisible={setVisible}
    />
  );
};

export default AddGroup;
