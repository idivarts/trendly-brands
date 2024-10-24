import { TextInput } from "react-native-paper";
import AddModal from "./add-modal";

interface AddMemberProps {
  channelId: string;
  setVisible: (visible: boolean) => void;
  visible: boolean;
}

const AddMember: React.FC<AddMemberProps> = ({
  channelId,
  setVisible,
  visible,
}) => {
  return (
    <AddModal
      action={() => { }}
      actionLabel="Add"
      title="Add Member"
      content={
        <>
          <TextInput
            label="User id"
            mode="flat"
          />
        </>
      }
      visible={visible}
      setVisible={setVisible}
    />
  );
};

export default AddMember;
